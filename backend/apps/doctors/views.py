from rest_framework import viewsets, permissions, filters
from django_filters.rest_framework import DjangoFilterBackend
from .models import Doctor, DoctorAvailability
from .serializers import DoctorSerializer, DoctorCreateSerializer, DoctorAvailabilitySerializer
from apps.accounts.models import UserRole
from apps.accounts.permissions import IsAdminUserRole

class DoctorViewSet(viewsets.ModelViewSet):
    """
    CRUD viewset for Doctors and their profiles.
    Allows public/patient discovery and administrative creation.
    """
    queryset = Doctor.objects.select_related('user').prefetch_related('availabilities').all()
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['specialization', 'availability_status']
    search_fields = ['user__first_name', 'user__last_name', 'specialization', 'biography']
    ordering_fields = ['consultation_fee', 'user__last_name', 'created_at']

    def get_permissions(self):
        if self.action in ['create', 'destroy']:
            return [IsAdminUserRole()]
        elif self.action in ['update', 'partial_update']:
            # Either admin or the doctor themselves
            return [permissions.IsAuthenticated()]
        return [permissions.IsAuthenticated()]

    def get_serializer_class(self):
        if self.action == 'create':
            return DoctorCreateSerializer
        return DoctorSerializer

class DoctorAvailabilityViewSet(viewsets.ModelViewSet):
    """
    CRUD viewset for Doctor weekly availability schedules.
    """
    queryset = DoctorAvailability.objects.select_related('doctor__user').all()
    serializer_class = DoctorAvailabilitySerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['doctor', 'weekday', 'is_active']

    def get_queryset(self):
        doctor_id = self.request.query_params.get('doctor_id')
        if doctor_id:
            return DoctorAvailability.objects.filter(doctor_id=doctor_id, is_active=True)
        return DoctorAvailability.objects.all()
