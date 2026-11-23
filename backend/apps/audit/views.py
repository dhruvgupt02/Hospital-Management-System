from rest_framework import generics, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from django.utils import timezone
from django.db.models import Count, Sum, Q
from datetime import timedelta
from decimal import Decimal
from .models import AuditLog
from .serializers import AuditLogSerializer
from apps.accounts.permissions import IsAdminUserRole
from apps.accounts.models import UserRole

class AuditLogListView(generics.ListAPIView):
    """
    List system audit logs. Strictly restricted to Administrators.
    """
    queryset = AuditLog.objects.all().order_by('-timestamp')
    serializer_class = AuditLogSerializer
    permission_classes = [IsAdminUserRole]
    filterset_fields = ['action', 'entity_type']
    search_fields = ['entity_id', 'actor_email', 'change_summary']

class DashboardAnalyticsView(APIView):
    """
    Aggregates operational hospital metrics from database queries.
    Scoped by role to prevent unauthorized data exposure.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        role = user.role
        now = timezone.now()
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        today_end = today_start + timedelta(days=1)

        # Lazy imports to prevent circular references
        from apps.patients.models import Patient
        from apps.doctors.models import Doctor
        from apps.appointments.models import Appointment, AppointmentStatus
        from apps.laboratory.models import LaboratoryReport, LabVerificationStatus
        from apps.billing.models import Invoice, InvoiceStatus, Payment
        from apps.insurance.models import InsuranceClaim, ClaimStatus

        metrics = {}
        charts = {}

        if role in [UserRole.ADMIN, UserRole.RECEPTIONIST]:
            metrics['total_patients'] = Patient.objects.count()
            metrics['active_doctors'] = Doctor.objects.filter(availability_status=True).count()
            metrics['today_appointments'] = Appointment.objects.filter(
                appointment_start__gte=today_start,
                appointment_start__lt=today_end
            ).count()
            metrics['upcoming_appointments'] = Appointment.objects.filter(
                appointment_start__gte=now,
                status__in=[AppointmentStatus.SCHEDULED, AppointmentStatus.CONFIRMED]
            ).count()
            metrics['completed_appointments'] = Appointment.objects.filter(
                status=AppointmentStatus.COMPLETED
            ).count()
            metrics['cancelled_appointments'] = Appointment.objects.filter(
                status=AppointmentStatus.CANCELLED
            ).count()

        if role in [UserRole.ADMIN, UserRole.BILLING_STAFF]:
            metrics['unpaid_invoices'] = Invoice.objects.filter(
                status__in=[InvoiceStatus.UNPAID, InvoiceStatus.PARTIALLY_PAID]
            ).count()
            total_rev = Payment.objects.aggregate(total=Sum('amount'))['total'] or Decimal('0.00')
            metrics['total_payments_recorded'] = float(total_rev)
            metrics['pending_claims'] = InsuranceClaim.objects.filter(
                status=ClaimStatus.SUBMITTED
            ).count()

            # Monthly billing breakdown
            monthly_data = (
                Invoice.objects.values('created_at__year', 'created_at__month')
                .annotate(
                    billed=Sum('total_amount'),
                    collected=Sum('amount_paid')
                )
                .order_by('-created_at__year', '-created_at__month')[:6]
            )
            charts['monthly_billing'] = [
                {
                    'month': f"{item['created_at__year']}-{item['created_at__month']:02d}",
                    'billed': float(item['billed'] or 0),
                    'collected': float(item['collected'] or 0)
                }
                for item in reversed(list(monthly_data))
            ]

        if role in [UserRole.ADMIN, UserRole.LAB_TECHNICIAN, UserRole.DOCTOR]:
            metrics['pending_lab_reports'] = LaboratoryReport.objects.filter(
                verification_status=LabVerificationStatus.PENDING
            ).count()

        # Doctor specific metrics
        if role == UserRole.DOCTOR:
            doctor_profile = getattr(user, 'doctor_profile', None)
            if doctor_profile:
                doc_appts = Appointment.objects.filter(doctor=doctor_profile)
                metrics['today_appointments'] = doc_appts.filter(
                    appointment_start__gte=today_start,
                    appointment_start__lt=today_end
                ).count()
                metrics['upcoming_appointments'] = doc_appts.filter(
                    appointment_start__gte=now,
                    status__in=[AppointmentStatus.SCHEDULED, AppointmentStatus.CONFIRMED]
                ).count()
                metrics['completed_appointments'] = doc_appts.filter(
                    status=AppointmentStatus.COMPLETED
                ).count()
                metrics['total_patients_treated'] = doc_appts.values('patient').distinct().count()

        # Patient specific metrics
        if role == UserRole.PATIENT:
            patient_profile = getattr(user, 'patient_profile', None)
            if patient_profile:
                p_appts = Appointment.objects.filter(patient=patient_profile)
                metrics['upcoming_appointments'] = p_appts.filter(
                    appointment_start__gte=now,
                    status__in=[AppointmentStatus.SCHEDULED, AppointmentStatus.CONFIRMED]
                ).count()
                metrics['past_appointments'] = p_appts.filter(
                    status=AppointmentStatus.COMPLETED
                ).count()
                p_invoices = Invoice.objects.filter(patient=patient_profile)
                metrics['unpaid_invoices'] = p_invoices.filter(
                    status__in=[InvoiceStatus.UNPAID, InvoiceStatus.PARTIALLY_PAID]
                ).count()

        # Chart: Appointment status distribution
        status_counts = Appointment.objects.values('status').annotate(count=Count('id'))
        charts['appointment_status'] = [
            {'name': item['status'], 'value': item['count']}
            for item in status_counts
        ]

        # Chart: Workload by doctor (Admin only)
        if role == UserRole.ADMIN:
            workload = (
                Doctor.objects.annotate(
                    appointment_count=Count('appointments')
                ).values('user__first_name', 'user__last_name', 'specialization', 'appointment_count')
                .order_by('-appointment_count')[:7]
            )
            charts['doctor_workload'] = [
                {
                    'doctor': f"Dr. {item['user__first_name']} {item['user__last_name']}",
                    'specialization': item['specialization'],
                    'appointments': item['appointment_count']
                }
                for item in workload
            ]

        return Response({
            'role': role,
            'metrics': metrics,
            'charts': charts,
            'timestamp': now.isoformat()
        })
