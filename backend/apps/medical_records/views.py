from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import transaction
from django.db.models import Q
from django.contrib.postgres.search import SearchVector, SearchQuery
from .models import MedicalRecord
from .serializers import (
    MedicalRecordSerializer,
    MedicalRecordCreateSerializer,
    MedicalRecordAmendSerializer,
)
from apps.accounts.models import UserRole
from apps.accounts.permissions import IsDoctorRole
from apps.audit.models import AuditLog, AuditAction

class MedicalRecordViewSet(viewsets.ModelViewSet):
    """
    Electronic Medical Records with PostgreSQL full-text search,
    temporal versioning, and auditable clinical amendments.
    """
    serializer_class = MedicalRecordSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['patient', 'doctor', 'is_latest']
    ordering_fields = ['recorded_at', 'version_number']

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return MedicalRecord.objects.none()

        qs = MedicalRecord.objects.select_related('patient__user', 'doctor__user', 'appointment')

        # Patients see only their own latest records (or all their historical versions if requested)
        if user.role == UserRole.PATIENT:
            qs = qs.filter(patient__user=user)
        elif user.role == UserRole.DOCTOR:
            # Doctors see records where they are the treating doctor, or all patients they have appointments with
            qs = qs.filter(Q(doctor__user=user) | Q(patient__appointments__doctor__user=user)).distinct()
        elif user.role == UserRole.ADMIN:
            qs = qs.all()
        else:
            # Receptionist, Lab, Billing do not have access to full clinical SOAP notes
            return MedicalRecord.objects.none()

        # Full-Text Search in PostgreSQL
        search_query = self.request.query_params.get('search', None)
        if search_query:
            try:
                # Use PostgreSQL SearchVector when available
                qs = qs.annotate(
                    search=SearchVector('diagnosis', 'clinical_notes', 'treatment_plan')
                ).filter(search=SearchQuery(search_query))
            except Exception:
                # Fallback to icontains for search
                qs = qs.filter(
                    Q(diagnosis__icontains=search_query) |
                    Q(clinical_notes__icontains=search_query) |
                    Q(treatment_plan__icontains=search_query)
                )

        return qs

    def create(self, request, *args, **kwargs):
        user = request.user
        if user.role != UserRole.DOCTOR:
            return Response(
                {"detail": "Only verified physicians can create electronic medical records."},
                status=status.HTTP_403_FORBIDDEN
            )

        doctor = getattr(user, 'doctor_profile', None)
        if not doctor:
            return Response({"detail": "Doctor profile not configured."}, status=status.HTTP_400_BAD_REQUEST)

        serializer = MedicalRecordCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        with transaction.atomic():
            record = MedicalRecord.objects.create(
                doctor=doctor,
                **serializer.validated_data,
                version_number=1,
                is_latest=True
            )

            AuditLog.log_event(
                actor=user,
                action=AuditAction.CREATE,
                entity_type='MedicalRecord',
                entity_id=str(record.id),
                change_summary=f"Medical record #{record.id} v1 created by Dr. {user.last_name} for patient {record.patient.user.get_full_name()}"
            )

        return Response(MedicalRecordSerializer(record).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'], permission_classes=[IsDoctorRole])
    def amend(self, request, pk=None):
        """
        Creates an immutable amendment version while archiving the prior version.
        """
        original = self.get_object()
        user = request.user
        doctor = getattr(user, 'doctor_profile', None)

        serializer = MedicalRecordAmendSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        with transaction.atomic():
            # Mark original as no longer latest
            original.is_latest = False
            original.save(update_fields=['is_latest'])

            # Create new version
            new_version = MedicalRecord.objects.create(
                patient=original.patient,
                doctor=doctor,
                appointment=original.appointment,
                diagnosis=serializer.validated_data['diagnosis'],
                clinical_notes=serializer.validated_data['clinical_notes'],
                treatment_plan=serializer.validated_data.get('treatment_plan', original.treatment_plan),
                recorded_at=original.recorded_at,  # encounter time is preserved
                version_number=original.version_number + 1,
                is_latest=True,
                parent_record=original,
                amendment_reason=serializer.validated_data['amendment_reason']
            )

            AuditLog.log_event(
                actor=user,
                action=AuditAction.RECORD_AMENDED,
                entity_type='MedicalRecord',
                entity_id=str(new_version.id),
                change_summary=f"Record #{original.id} amended to v{new_version.version_number}. Reason: {new_version.amendment_reason}",
                previous_values={
                    'diagnosis': original.diagnosis,
                    'notes': original.clinical_notes,
                    'version': original.version_number
                },
                new_values={
                    'diagnosis': new_version.diagnosis,
                    'notes': new_version.clinical_notes,
                    'version': new_version.version_number
                }
            )

        return Response(MedicalRecordSerializer(new_version).data, status=status.HTTP_201_CREATED)
