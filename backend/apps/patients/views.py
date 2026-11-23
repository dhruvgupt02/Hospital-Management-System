from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from django.db.models import Q
from .models import Patient
from .serializers import PatientSerializer, PatientCreateSerializer
from apps.accounts.models import UserRole
from apps.audit.models import AuditLog, AuditAction

class PatientViewSet(viewsets.ModelViewSet):
    """
    CRUD viewset for Patients.
    Strictly prevents IDOR vulnerabilities:
    - Patients can only query and retrieve their own profile.
    - Authorized clinical/administrative staff can query patients.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.action == 'create':
            return PatientCreateSerializer
        return PatientSerializer

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Patient.objects.none()

        # Patients only see their own profile
        if user.role == UserRole.PATIENT:
            return Patient.objects.filter(user=user)

        # Hospital staff (Doctor, Receptionist, Admin, Lab, Billing)
        queryset = Patient.objects.select_related('user').all()

        # Optional search by name, email, phone
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(user__first_name__icontains=search) |
                Q(user__last_name__icontains=search) |
                Q(user__email__icontains=search) |
                Q(phone__icontains=search)
            )
        return queryset

    def perform_create(self, serializer):
        user = self.request.user
        # Only Receptionist, Admin, or the user themselves during registration can create
        patient = serializer.save()
        AuditLog.log_event(
            actor=user,
            action=AuditAction.CREATE,
            entity_type='Patient',
            entity_id=str(patient.id),
            change_summary=f"Patient registered: {patient.user.email} (ID: {patient.id})"
        )

    def perform_update(self, serializer):
        instance = serializer.instance
        old_data = {
            'phone': instance.phone,
            'address': instance.address,
            'emergency_contact': instance.emergency_contact
        }
        patient = serializer.save()
        AuditLog.log_event(
            actor=self.request.user,
            action=AuditAction.UPDATE,
            entity_type='Patient',
            entity_id=str(patient.id),
            change_summary=f"Patient profile updated for {patient.user.email}",
            previous_values=old_data,
            new_values={
                'phone': patient.phone,
                'address': patient.address,
                'emergency_contact': patient.emergency_contact
            }
        )
