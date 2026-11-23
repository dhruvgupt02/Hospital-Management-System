from django.db import models
from django.conf import settings
from django.utils.translation import gettext_lazy as _
from django.core.exceptions import ValidationError
from django.utils import timezone
from django.contrib.postgres.constraints import ExclusionConstraint
from django.contrib.postgres.fields import RangeOperators
from django.db.models import Func, Value, Q
from apps.patients.models import Patient
from apps.doctors.models import Doctor

class TsTzRange(Func):
    function = 'tstzrange'
    output_field = None

class AppointmentStatus(models.TextChoices):
    SCHEDULED = 'Scheduled', _('Scheduled')
    CONFIRMED = 'Confirmed', _('Confirmed')
    COMPLETED = 'Completed', _('Completed')
    CANCELLED = 'Cancelled', _('Cancelled')
    NO_SHOW = 'No-show', _('No-show')

class Appointment(models.Model):
    patient = models.ForeignKey(
        Patient,
        on_delete=models.PROTECT,
        related_name='appointments'
    )
    doctor = models.ForeignKey(
        Doctor,
        on_delete=models.PROTECT,
        related_name='appointments'
    )
    appointment_start = models.DateTimeField(_('start time'), db_index=True)
    appointment_end = models.DateTimeField(_('end time'), db_index=True)
    status = models.CharField(
        _('status'),
        max_length=20,
        choices=AppointmentStatus.choices,
        default=AppointmentStatus.SCHEDULED,
        db_index=True
    )
    reason = models.TextField(_('consultation reason / chief complaint'))
    cancellation_reason = models.TextField(blank=True, null=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='created_appointments'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['appointment_start']
        verbose_name = _('Appointment')
        verbose_name_plural = _('Appointments')
        indexes = [
            models.Index(fields=['doctor', 'status', 'appointment_start']),
            models.Index(fields=['patient', 'status', 'appointment_start']),
        ]
        constraints = [
            # PostgreSQL exclusion constraint preventing overlapping doctor bookings
            ExclusionConstraint(
                name='exclude_overlapping_doctor_appointments',
                expressions=[
                    ('doctor', RangeOperators.EQUAL),
                    (TsTzRange('appointment_start', 'appointment_end', Value('[)')), RangeOperators.OVERLAPS),
                ],
                condition=Q(status__in=[AppointmentStatus.SCHEDULED, AppointmentStatus.CONFIRMED]),
            ),
            # PostgreSQL exclusion constraint preventing overlapping patient bookings
            ExclusionConstraint(
                name='exclude_overlapping_patient_appointments',
                expressions=[
                    ('patient', RangeOperators.EQUAL),
                    (TsTzRange('appointment_start', 'appointment_end', Value('[)')), RangeOperators.OVERLAPS),
                ],
                condition=Q(status__in=[AppointmentStatus.SCHEDULED, AppointmentStatus.CONFIRMED]),
            ),
        ]

    def __str__(self):
        return f"Appt #{self.id}: {self.patient.user.get_full_name()} with Dr. {self.doctor.user.last_name} at {self.appointment_start:%Y-%m-%d %H:%M}"

    def clean(self):
        super().clean()
        if self.appointment_start and self.appointment_end:
            if self.appointment_start >= self.appointment_end:
                raise ValidationError(_("Appointment start time must be before end time."))
            duration = self.appointment_end - self.appointment_start
            if duration.total_seconds() < 900:  # Minimum 15 minutes
                raise ValidationError(_("Appointment duration must be at least 15 minutes."))
            if duration.total_seconds() > 14400:  # Maximum 4 hours
                raise ValidationError(_("Appointment duration cannot exceed 4 hours."))
