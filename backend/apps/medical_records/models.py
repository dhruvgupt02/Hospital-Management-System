from django.db import models
from django.conf import settings
from django.utils.translation import gettext_lazy as _
from django.utils import timezone
from apps.patients.models import Patient
from apps.doctors.models import Doctor
from apps.appointments.models import Appointment

class MedicalRecord(models.Model):
    """
    Electronic Medical Record implementing temporal versioning.
    Finalized clinical records are never silently overwritten;
    amendments produce an auditable new version linked to the parent.
    """
    patient = models.ForeignKey(
        Patient,
        on_delete=models.PROTECT,
        related_name='medical_records'
    )
    doctor = models.ForeignKey(
        Doctor,
        on_delete=models.PROTECT,
        related_name='authored_medical_records'
    )
    appointment = models.ForeignKey(
        Appointment,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='medical_records'
    )
    diagnosis = models.TextField(_('clinical diagnosis'), db_index=True)
    clinical_notes = models.TextField(_('clinical examination and SOAP notes'))
    treatment_plan = models.TextField(_('recommended treatment plan'), blank=True)

    # Temporal Timestamps:
    # 1. recorded_at: When clinical encounter actually occurred in real life
    recorded_at = models.DateTimeField(_('clinical encounter time'), default=timezone.now, db_index=True)
    # 2. created_at: When record was initially entered into the database
    created_at = models.DateTimeField(_('database entry time'), auto_now_add=True, db_index=True)
    # 3. updated_at: When record was amended/updated
    updated_at = models.DateTimeField(_('last amendment time'), auto_now=True)

    version_number = models.PositiveIntegerField(default=1)
    is_latest = models.BooleanField(default=True, db_index=True)
    parent_record = models.ForeignKey(
        'self',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='amendments'
    )
    amendment_reason = models.TextField(blank=True, null=True)

    class Meta:
        ordering = ['-recorded_at', '-version_number']
        verbose_name = _('Medical Record')
        verbose_name_plural = _('Medical Records')
        indexes = [
            models.Index(fields=['patient', 'is_latest', 'recorded_at']),
            models.Index(fields=['doctor', 'is_latest']),
        ]

    def __str__(self):
        return f"Record #{self.id} v{self.version_number} - {self.patient.user.get_full_name()} ({self.diagnosis[:30]})"
