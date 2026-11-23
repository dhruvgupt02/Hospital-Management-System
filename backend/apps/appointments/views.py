from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.utils.dateparse import parse_date, parse_datetime
from django.utils import timezone
from datetime import datetime, time, timedelta
from .models import Appointment, AppointmentStatus
from .serializers import (
    AppointmentSerializer,
    AppointmentCreateSerializer,
    AppointmentRescheduleSerializer,
    AppointmentCancelSerializer,
)
from .services import AppointmentService, ConflictException
from apps.accounts.models import UserRole
from apps.patients.models import Patient
from apps.doctors.models import Doctor, DoctorAvailability
from apps.audit.models import AuditLog, AuditAction

class AppointmentViewSet(viewsets.ModelViewSet):
    """
    CRUD viewset for Appointments with conflict detection, rescheduling,
    cancellation, and role-based filtering.
    """
    serializer_class = AppointmentSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['doctor', 'patient', 'status']
    search_fields = ['patient__user__first_name', 'patient__user__last_name', 'doctor__user__last_name', 'reason']
    ordering_fields = ['appointment_start', 'created_at']

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Appointment.objects.none()

        qs = Appointment.objects.select_related('patient__user', 'doctor__user', 'created_by').all()

        if user.role == UserRole.PATIENT:
            return qs.filter(patient__user=user)
        elif user.role == UserRole.DOCTOR:
            return qs.filter(doctor__user=user)
        # Receptionists, Admins, Billing, Lab see appointments
        return qs

    def create(self, request, *args, **kwargs):
        user = request.user
        serializer = AppointmentCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        patient = serializer.validated_data['patient']
        # If user is a patient, enforce they can only book for themselves
        if user.role == UserRole.PATIENT:
            patient_profile = getattr(user, 'patient_profile', None)
            if not patient_profile or patient.id != patient_profile.id:
                return Response(
                    {"detail": "Patients can only book appointments for their own profile."},
                    status=status.HTTP_403_FORBIDDEN
                )

        doctor = serializer.validated_data['doctor']
        start = serializer.validated_data['appointment_start']
        end = serializer.validated_data['appointment_end']
        reason = serializer.validated_data['reason']

        appointment = AppointmentService.book_appointment(
            patient=patient,
            doctor=doctor,
            start=start,
            end=end,
            reason=reason,
            created_by=user
        )

        return Response(AppointmentSerializer(appointment).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def reschedule(self, request, pk=None):
        appointment = self.get_object()
        user = request.user

        # Permission check: Patient can reschedule their own; Doctor or Receptionist/Admin can reschedule
        if user.role == UserRole.PATIENT and appointment.patient.user != user:
            return Response({"detail": "Not authorized to reschedule this appointment."}, status=status.HTTP_403_FORBIDDEN)
        if user.role == UserRole.DOCTOR and appointment.doctor.user != user:
            return Response({"detail": "Not authorized to reschedule this appointment."}, status=status.HTTP_403_FORBIDDEN)

        serializer = AppointmentRescheduleSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        updated_appt = AppointmentService.reschedule_appointment(
            appointment=appointment,
            new_start=serializer.validated_data['appointment_start'],
            new_end=serializer.validated_data['appointment_end'],
            user=user,
            reason=serializer.validated_data.get('reason', '')
        )
        return Response(AppointmentSerializer(updated_appt).data)

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        appointment = self.get_object()
        user = request.user

        if user.role == UserRole.PATIENT and appointment.patient.user != user:
            return Response({"detail": "Not authorized to cancel this appointment."}, status=status.HTTP_403_FORBIDDEN)
        if user.role == UserRole.DOCTOR and appointment.doctor.user != user:
            return Response({"detail": "Not authorized to cancel this appointment."}, status=status.HTTP_403_FORBIDDEN)

        serializer = AppointmentCancelSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        cancelled_appt = AppointmentService.cancel_appointment(
            appointment=appointment,
            user=user,
            reason=serializer.validated_data['cancellation_reason']
        )
        return Response(AppointmentSerializer(cancelled_appt).data)

    @action(detail=True, methods=['post'])
    def confirm(self, request, pk=None):
        appointment = self.get_object()
        if appointment.status != AppointmentStatus.SCHEDULED:
            return Response({"detail": "Only scheduled appointments can be confirmed."}, status=status.HTTP_400_BAD_REQUEST)
        appointment.status = AppointmentStatus.CONFIRMED
        appointment.save(update_fields=['status', 'updated_at'])
        AuditLog.log_event(
            actor=request.user,
            action=AuditAction.UPDATE,
            entity_type='Appointment',
            entity_id=str(appointment.id),
            change_summary=f"Appointment #{appointment.id} marked as Confirmed"
        )
        return Response(AppointmentSerializer(appointment).data)

    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        appointment = self.get_object()
        appointment.status = AppointmentStatus.COMPLETED
        appointment.save(update_fields=['status', 'updated_at'])
        AuditLog.log_event(
            actor=request.user,
            action=AuditAction.UPDATE,
            entity_type='Appointment',
            entity_id=str(appointment.id),
            change_summary=f"Appointment #{appointment.id} completed"
        )
        return Response(AppointmentSerializer(appointment).data)

    @action(detail=False, methods=['get'])
    def available_slots(self, request):
        """
        Calculates open 30-minute booking slots for a given doctor on a given date.
        """
        doctor_id = request.query_params.get('doctor_id')
        date_str = request.query_params.get('date')
        if not doctor_id or not date_str:
            return Response({"detail": "doctor_id and date parameters are required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            target_date = parse_date(date_str)
        except Exception:
            return Response({"detail": "Invalid date format. Use YYYY-MM-DD."}, status=status.HTTP_400_BAD_REQUEST)

        weekday = target_date.weekday()
        schedules = DoctorAvailability.objects.filter(doctor_id=doctor_id, weekday=weekday, is_active=True)
        if not schedules.exists():
            return Response([])

        # Retrieve existing active bookings on that day
        day_start = timezone.make_aware(datetime.combine(target_date, time.min))
        day_end = timezone.make_aware(datetime.combine(target_date, time.max))

        booked = Appointment.objects.filter(
            doctor_id=doctor_id,
            status__in=[AppointmentStatus.SCHEDULED, AppointmentStatus.CONFIRMED],
            appointment_start__lt=day_end,
            appointment_end__gt=day_start
        )

        slot_duration = timedelta(minutes=30)
        available_slots = []

        for sched in schedules:
            current_time = timezone.make_aware(datetime.combine(target_date, sched.start_time))
            period_end = timezone.make_aware(datetime.combine(target_date, sched.end_time))

            while current_time + slot_duration <= period_end:
                slot_end = current_time + slot_duration
                # Check collision with booked
                has_collision = any(
                    (b.appointment_start < slot_end and b.appointment_end > current_time)
                    for b in booked
                )
                if not has_collision and current_time > timezone.now():
                    available_slots.append({
                        'start': current_time.isoformat(),
                        'end': slot_end.isoformat(),
                        'formatted_start': current_time.strftime('%I:%M %p'),
                        'formatted_end': slot_end.strftime('%I:%M %p'),
                    })
                current_time += slot_duration

        return Response(available_slots)
