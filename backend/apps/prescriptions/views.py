from rest_framework import viewsets, permissions, status, filters
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q
from .models import Prescription, PrescriptionItem
from .serializers import PrescriptionSerializer, PrescriptionCreateSerializer
from apps.accounts.models import UserRole
from apps.audit.models import AuditLog, AuditAction

class PrescriptionViewSet(viewsets.ModelViewSet):
    """
    CRUD Viewset for Prescriptions.
    Doctors can author prescriptions; Patients can view their own.
    """
    serializer_class = PrescriptionSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['patient', 'doctor', 'status']
    search_fields = ['items__medicine_name', 'patient__user__first_name', 'patient__user__last_name']

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Prescription.objects.none()

        qs = Prescription.objects.select_related('patient__user', 'doctor__user', 'medical_record').prefetch_related('items')

        if user.role == UserRole.PATIENT:
            return qs.filter(patient__user=user)
        elif user.role == UserRole.DOCTOR:
            return qs.filter(doctor__user=user)
        elif user.role in [UserRole.ADMIN, UserRole.RECEPTIONIST]:
            return qs.all()
        return qs.none()

    def create(self, request, *args, **kwargs):
        user = request.user
        if user.role != UserRole.DOCTOR:
            return Response(
                {"detail": "Only physicians are authorized to prescribe medications."},
                status=status.HTTP_403_FORBIDDEN
            )

        doctor = getattr(user, 'doctor_profile', None)
        if not doctor:
            return Response({"detail": "Doctor profile not configured."}, status=status.HTTP_400_BAD_REQUEST)

        serializer = PrescriptionCreateSerializer(data=request.data, context={'doctor': doctor})
        serializer.is_valid(raise_exception=True)
        prescription = serializer.save()

        AuditLog.log_event(
            actor=user,
            action=AuditAction.CREATE,
            entity_type='Prescription',
            entity_id=str(prescription.id),
            change_summary=f"Prescription #{prescription.id} written by Dr. {user.last_name} for patient {prescription.patient.user.get_full_name()} with {prescription.items.count()} items"
        )

        return Response(PrescriptionSerializer(prescription).data, status=status.HTTP_201_CREATED)
