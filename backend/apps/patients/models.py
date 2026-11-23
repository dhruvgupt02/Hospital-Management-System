from django.db import models
from django.conf import settings
from django.utils.translation import gettext_lazy as _

class GenderChoices(models.TextChoices):
    MALE = 'Male', _('Male')
    FEMALE = 'Female', _('Female')
    OTHER = 'Other', _('Other')
    PREFER_NOT_TO_SAY = 'Prefer not to say', _('Prefer not to say')

class Patient(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='patient_profile'
    )
    date_of_birth = models.DateField(_('date of birth'), null=True, blank=True)
    gender = models.CharField(
        _('gender'),
        max_length=20,
        choices=GenderChoices.choices,
        default=GenderChoices.OTHER
    )
    phone = models.CharField(_('phone number'), max_length=30, blank=True)
    address = models.TextField(_('residential address'), blank=True)
    emergency_contact = models.CharField(_('emergency contact'), max_length=150, blank=True)
    blood_group = models.CharField(_('blood group'), max_length=10, blank=True)
    allergies = models.TextField(_('known allergies'), blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = _('Patient')
        verbose_name_plural = _('Patients')
        indexes = [
            models.Index(fields=['phone']),
            models.Index(fields=['created_at']),
        ]

    def __str__(self):
        return f"{self.user.get_full_name()} (DOB: {self.date_of_birth})"
