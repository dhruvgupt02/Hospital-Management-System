from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django.http import FileResponse, Http404
from django_filters.rest_framework import DjangoFilterBackend
from .models import LaboratoryOrder, LaboratoryReport, LabOrderStatus, LabVerificationStatus
from .serializers import (
    LaboratoryOrderSerializer,
    LaboratoryOrderCreateSerializer,
    LaboratoryReportSerializer,
    LaboratoryReportCreateSerializer,
)
from apps.accounts.models import UserRole
from apps.accounts.permissions import IsLabTechnicianRole
from apps.audit.models import AuditLog, AuditAction

class LaboratoryOrderViewSet(viewsets.ModelViewSet):
    """
    Laboratory Orders viewset. Doctors order tests; Lab Technicians process them.
    """
    serializer_class = LaboratoryOrderSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['patient', 'ordered_by', 'status']
    search_fields = ['test_name', 'patient__user__first_name', 'patient__user__last_name']

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return LaboratoryOrder.objects.none()

        qs = LaboratoryOrder.objects.select_related('patient__user', 'ordered_by__user').prefetch_related('reports')

        if user.role == UserRole.PATIENT:
            return qs.filter(patient__user=user)
        elif user.role == UserRole.DOCTOR:
            return qs.filter(ordered_by__user=user)
        elif user.role in [UserRole.LAB_TECHNICIAN, UserRole.ADMIN, UserRole.RECEPTIONIST]:
            return qs.all()
        return qs.none()

    def create(self, request, *args, **kwargs):
        user = request.user
        if user.role != UserRole.DOCTOR:
            return Response({"detail": "Only physicians can place laboratory test orders."}, status=status.HTTP_403_FORBIDDEN)

        doctor = getattr(user, 'doctor_profile', None)
        if not doctor:
            return Response({"detail": "Doctor profile required."}, status=status.HTTP_400_BAD_REQUEST)

        serializer = LaboratoryOrderCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        order = serializer.save(ordered_by=doctor)

        AuditLog.log_event(
            actor=user,
            action=AuditAction.CREATE,
            entity_type='LaboratoryOrder',
            entity_id=str(order.id),
            change_summary=f"Lab test '{order.test_name}' ordered by Dr. {user.last_name} for patient {order.patient.user.get_full_name()}"
        )

        return Response(LaboratoryOrderSerializer(order).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def update_status(self, request, pk=None):
        order = self.get_object()
        new_status = request.data.get('status')
        if new_status not in LabOrderStatus.values:
            return Response({"detail": "Invalid status value."}, status=status.HTTP_400_BAD_REQUEST)

        order.status = new_status
        order.save(update_fields=['status'])
        return Response(LaboratoryOrderSerializer(order).data)

class LaboratoryReportViewSet(viewsets.ModelViewSet):
    """
    Laboratory Reports viewset. Lab technicians enter findings and upload documents.
    """
    serializer_class = LaboratoryReportSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return LaboratoryReport.objects.none()

        qs = LaboratoryReport.objects.select_related('laboratory_order__patient__user', 'verified_by')

        if user.role == UserRole.PATIENT:
            return qs.filter(laboratory_order__patient__user=user)
        elif user.role == UserRole.DOCTOR:
            return qs.filter(laboratory_order__ordered_by__user=user)
        elif user.role in [UserRole.LAB_TECHNICIAN, UserRole.ADMIN]:
            return qs.all()
        return qs.none()

    def create(self, request, *args, **kwargs):
        user = request.user
        if user.role not in [UserRole.LAB_TECHNICIAN, UserRole.ADMIN]:
            return Response({"detail": "Only laboratory technicians can upload test results."}, status=status.HTTP_403_FORBIDDEN)

        serializer = LaboratoryReportCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        report = serializer.save(version_number=1)

        # Mark parent order as Completed
        order = report.laboratory_order
        order.status = LabOrderStatus.COMPLETED
        order.save(update_fields=['status'])

        AuditLog.log_event(
            actor=user,
            action=AuditAction.CREATE,
            entity_type='LaboratoryReport',
            entity_id=str(report.id),
            change_summary=f"Lab report #{report.id} uploaded for test {order.test_name} by {user.email}"
        )

        return Response(LaboratoryReportSerializer(report, context={'request': request}).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'], permission_classes=[IsLabTechnicianRole])
    def verify(self, request, pk=None):
        report = self.get_object()
        verif_status = request.data.get('status', LabVerificationStatus.VERIFIED)
        report.verification_status = verif_status
        report.verified_by = request.user
        report.save(update_fields=['verification_status', 'verified_by'])

        AuditLog.log_event(
            actor=request.user,
            action=AuditAction.UPDATE,
            entity_type='LaboratoryReport',
            entity_id=str(report.id),
            change_summary=f"Lab report #{report.id} verified status: {verif_status} by {request.user.email}"
        )
        return Response(LaboratoryReportSerializer(report, context={'request': request}).data)

    @action(detail=True, methods=['get'])
    def download(self, request, pk=None):
        report = self.get_object()
        if not report.report_file:
            raise Http404("No attached report file found.")

        # Ensure user is authorized to download
        user = request.user
        patient = report.laboratory_order.patient
        if user.role == UserRole.PATIENT and patient.user != user:
            return Response({"detail": "Forbidden."}, status=status.HTTP_403_FORBIDDEN)

        return FileResponse(report.report_file.open(), as_attachment=True, filename=report.report_file.name.split('/')[-1])
