from django.db import models
from django.conf import settings
from django.utils.translation import gettext_lazy as _
from decimal import Decimal

class WeekdayChoices(models.IntegerChoices):
    MONDAY = 0, _('Monday')
    TUESDAY = 1, _('Tuesday')
    WEDNESDAY = 2, _('Wednesday')
    THURSDAY = 3, _('Thursday')
    FRIDAY = 4, _('Friday')
    SATURDAY = 5, _('Saturday')
    SUNDAY = 6, _('Sunday')

class Doctor(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='doctor_profile'
    )
    specialization = models.CharField(_('specialization'), max_length=100, db_index=True)
    license_number = models.CharField(_('medical license number'), max_length=50, unique=True, db_index=True)
    consultation_fee = models.DecimalField(
        _('consultation fee ($)'),
        max_digits=10,
        decimal_places=2,
        default=Decimal('100.00')
    )
    biography = models.TextField(_('biography and qualifications'), blank=True)
    availability_status = models.BooleanField(_('is actively available'), default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['specialization', 'user__last_name']
        verbose_name = _('Doctor')
        verbose_name_plural = _('Doctors')
        indexes = [
            models.Index(fields=['specialization', 'availability_status']),
        ]

    def __str__(self):
        return f"Dr. {self.user.get_full_name()} ({self.specialization})"

class DoctorAvailability(models.Model):
    doctor = models.ForeignKey(
        Doctor,
        on_delete=models.CASCADE,
        related_name='availabilities'
    )
    weekday = models.IntegerField(_('day of week'), choices=WeekdayChoices.choices)
    start_time = models.TimeField(_('slot start time'))
    end_time = models.TimeField(_('slot end time'))
    effective_from = models.DateField(null=True, blank=True)
    effective_until = models.DateField(null=True, blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['weekday', 'start_time']
        verbose_name = _('Doctor Availability')
        verbose_name_plural = _('Doctor Availabilities')
        indexes = [
            models.Index(fields=['doctor', 'weekday', 'is_active']),
        ]

    def __str__(self):
        return f"Dr. {self.doctor.user.last_name}: {self.get_weekday_display()} {self.start_time.strftime('%H:%M')} - {self.end_time.strftime('%H:%M')}"
