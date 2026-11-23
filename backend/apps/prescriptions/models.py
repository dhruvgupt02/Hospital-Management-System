from django.db import models
from django.utils.translation import gettext_lazy as _
from django.utils import timezone
from apps.patients.models import Patient
from apps.doctors.models import Doctor
from apps.medical_records.models import MedicalRecord

class PrescriptionStatus(models.TextChoices):
    ACTIVE = 'Active', _('Active')
    DISCONTINUED = 'Discontinued', _('Discontinued')
    COMPLETED = 'Completed', _('Completed')

class Prescription(models.Model):
    medical_record = models.ForeignKey(
        MedicalRecord,
        on_delete=models.PROTECT,
        related_name='prescriptions',
        null=True,
        blank=True
    )
    doctor = models.ForeignKey(
        Doctor,
        on_delete=models.PROTECT,
        related_name='prescriptions'
    )
    patient = models.ForeignKey(
        Patient,
        on_delete=models.PROTECT,
        related_name='prescriptions'
    )
    prescribed_at = models.DateTimeField(default=timezone.now, db_index=True)
    instructions = models.TextField(_('general advice & precautions'), blank=True)
    status = models.CharField(
        max_length=20,
        choices=PrescriptionStatus.choices,
        default=PrescriptionStatus.ACTIVE,
        db_index=True
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-prescribed_at']
        verbose_name = _('Prescription')
        verbose_name_plural = _('Prescriptions')
        indexes = [
            models.Index(fields=['patient', 'status']),
            models.Index(fields=['doctor', 'status']),
        ]

    def __str__(self):
        return f"Prescription #{self.id} for {self.patient.user.get_full_name()} by Dr. {self.doctor.user.last_name}"

class PrescriptionItem(models.Model):
    prescription = models.ForeignKey(
        Prescription,
        on_delete=models.CASCADE,
        related_name='items'
    )
    medicine_name = models.CharField(_('medicine name / generic compound'), max_length=150, db_index=True)
    dosage = models.CharField(_('dosage (e.g. 500mg)'), max_length=100)
    frequency = models.CharField(_('frequency (e.g. Twice daily after meals)'), max_length=100)
    duration = models.CharField(_('duration (e.g. 7 days)'), max_length=100)
    quantity = models.PositiveIntegerField(_('dispense quantity'), default=1)
    additional_instructions = models.TextField(blank=True)

    class Meta:
        ordering = ['id']
        verbose_name = _('Prescription Item')
        verbose_name_plural = _('Prescription Items')
        indexes = [
            models.Index(fields=['medicine_name']),
        ]

    def __str__(self):
        return f"{self.medicine_name} - {self.dosage} ({self.frequency})"
