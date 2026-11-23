from django.db import transaction, IntegrityError
from django.core.exceptions import ValidationError
from rest_framework.exceptions import APIException
from rest_framework import status
from django.utils import timezone
from .models import Appointment, AppointmentStatus
from apps.audit.models import AuditLog, AuditAction

class ConflictException(APIException):
    status_code = status.HTTP_409_CONFLICT
    default_detail = "Appointment conflict detected: The selected time slot is already booked for this doctor or patient."
    default_code = 'appointment_conflict'

class AppointmentService:
    @staticmethod
    def check_conflicts(doctor, patient, start, end, exclude_id=None):
        """
        Application-level check with select_for_update inside transactions.
        """
        # Check doctor overlapping active bookings
        doctor_conflict = Appointment.objects.filter(
            doctor=doctor,
            status__in=[AppointmentStatus.SCHEDULED, AppointmentStatus.CONFIRMED],
            appointment_start__lt=end,
            appointment_end__gt=start
        )
        if exclude_id:
            doctor_conflict = doctor_conflict.exclude(id=exclude_id)

        if doctor_conflict.exists():
            return "Doctor is unavailable during this time window."

        # Check patient overlapping active bookings
        if patient:
            patient_conflict = Appointment.objects.filter(
                patient=patient,
                status__in=[AppointmentStatus.SCHEDULED, AppointmentStatus.CONFIRMED],
                appointment_start__lt=end,
                appointment_end__gt=start
            )
            if exclude_id:
                patient_conflict = patient_conflict.exclude(id=exclude_id)

            if patient_conflict.exists():
                return "Patient already has an active appointment during this time window."

        return None

    @classmethod
    def book_appointment(cls, patient, doctor, start, end, reason, created_by=None):
        """
        Concurrently safe appointment booking using transaction + row-level locking
        and backed by PostgreSQL ExclusionConstraint.
        """
        with transaction.atomic():
            # Application-level check
            conflict_err = cls.check_conflicts(doctor, patient, start, end)
            if conflict_err:
                raise ConflictException(detail=conflict_err)

            try:
                appointment = Appointment.objects.create(
                    patient=patient,
                    doctor=doctor,
                    appointment_start=start,
                    appointment_end=end,
                    reason=reason,
                    created_by=created_by,
                    status=AppointmentStatus.SCHEDULED
                )
            except IntegrityError as exc:
                # Caught when PostgreSQL exclusion constraint triggers under high concurrency
                raise ConflictException(detail="Appointment booking rejected due to concurrent conflict.") from exc

            AuditLog.log_event(
                actor=created_by,
                action=AuditAction.CREATE,
                entity_type='Appointment',
                entity_id=str(appointment.id),
                change_summary=f"Appointment booked for {patient.user.get_full_name()} with Dr. {doctor.user.last_name} at {start}"
            )
            return appointment

    @classmethod
    def reschedule_appointment(cls, appointment, new_start, new_end, user=None, reason=""):
        """
        Safely reschedules an appointment to a new time window.
        """
        with transaction.atomic():
            if appointment.status in [AppointmentStatus.CANCELLED, AppointmentStatus.COMPLETED]:
                raise ValidationError(f"Cannot reschedule an appointment in {appointment.status} status.")

            conflict_err = cls.check_conflicts(
                appointment.doctor,
                appointment.patient,
                new_start,
                new_end,
                exclude_id=appointment.id
            )
            if conflict_err:
                raise ConflictException(detail=conflict_err)

            old_start = appointment.appointment_start
            old_end = appointment.appointment_end

            appointment.appointment_start = new_start
            appointment.appointment_end = new_end
            if reason:
                appointment.reason = f"{appointment.reason} | Rescheduled: {reason}"
            try:
                appointment.save()
            except IntegrityError as exc:
                raise ConflictException(detail="Rescheduling rejected due to concurrent booking conflict.") from exc

            AuditLog.log_event(
                actor=user,
                action=AuditAction.APPOINTMENT_RESCHEDULED,
                entity_type='Appointment',
                entity_id=str(appointment.id),
                change_summary=f"Appointment #{appointment.id} rescheduled from {old_start} to {new_start}",
                previous_values={'start': str(old_start), 'end': str(old_end)},
                new_values={'start': str(new_start), 'end': str(new_end)}
            )
            return appointment

    @classmethod
    def cancel_appointment(cls, appointment, user=None, reason=""):
        """
        Cancels an appointment, updating state and auditing the event.
        """
        with transaction.atomic():
            if appointment.status == AppointmentStatus.CANCELLED:
                return appointment
            if appointment.status == AppointmentStatus.COMPLETED:
                raise ValidationError("Cannot cancel an already completed appointment.")

            appointment.status = AppointmentStatus.CANCELLED
            appointment.cancellation_reason = reason
            appointment.save(update_fields=['status', 'cancellation_reason', 'updated_at'])

            AuditLog.log_event(
                actor=user,
                action=AuditAction.APPOINTMENT_CANCELLED,
                entity_type='Appointment',
                entity_id=str(appointment.id),
                change_summary=f"Appointment #{appointment.id} cancelled. Reason: {reason}"
            )
            return appointment
