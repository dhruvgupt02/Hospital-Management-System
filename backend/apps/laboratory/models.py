import uuid
from django.db import models
from django.conf import settings
from django.utils.translation import gettext_lazy as _
from apps.patients.models import Patient
from apps.doctors.models import Doctor
from apps.medical_records.models import MedicalRecord

class LabOrderStatus(models.TextChoices):
    ORDERED = 'Ordered', _('Ordered')
    IN_PROGRESS = 'In_Progress', _('In Progress')
    COMPLETED = 'Completed', _('Completed')
    CANCELLED = 'Cancelled', _('Cancelled')

class LabVerificationStatus(models.TextChoices):
    PENDING = 'Pending', _('Pending Verification')
    VERIFIED = 'Verified', _('Verified')
    REJECTED = 'Rejected', _('Rejected')

def lab_report_file_path(instance, filename):
    ext = filename.split('.')[-1].lower()
    unique_name = f"{uuid.uuid4().hex}.{ext}"
    return f"lab_reports/{unique_name}"

class LaboratoryOrder(models.Model):
    patient = models.ForeignKey(
        Patient,
        on_delete=models.PROTECT,
        related_name='lab_orders'
    )
    medical_record = models.ForeignKey(
        MedicalRecord,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='lab_orders'
    )
    ordered_by = models.ForeignKey(
        Doctor,
        on_delete=models.PROTECT,
        related_name='ordered_lab_tests'
    )
    test_name = models.CharField(_('diagnostic test name'), max_length=150, db_index=True)
    clinical_notes = models.TextField(_('clinical indication / instructions'), blank=True)
    status = models.CharField(
        max_length=20,
        choices=LabOrderStatus.choices,
        default=LabOrderStatus.ORDERED,
        db_index=True
    )
    ordered_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ['-ordered_at']
        verbose_name = _('Laboratory Order')
        verbose_name_plural = _('Laboratory Orders')
        indexes = [
            models.Index(fields=['patient', 'status']),
            models.Index(fields=['ordered_by', 'status']),
        ]

    def __str__(self):
        return f"LabOrder #{self.id}: {self.test_name} for {self.patient.user.get_full_name()}"

class LaboratoryReport(models.Model):
    laboratory_order = models.ForeignKey(
        LaboratoryOrder,
        on_delete=models.PROTECT,
        related_name='reports'
    )
    result = models.TextField(_('findings / test result'))
    unit = models.CharField(_('measurement unit'), max_length=50, blank=True)
    reference_range = models.CharField(_('biological reference interval'), max_length=100, blank=True)
    report_file = models.FileField(upload_to=lab_report_file_path, null=True, blank=True)
    reported_at = models.DateTimeField(auto_now_add=True)
    verified_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='verified_lab_reports'
    )
    verification_status = models.CharField(
        max_length=20,
        choices=LabVerificationStatus.choices,
        default=LabVerificationStatus.PENDING,
        db_index=True
    )
    version_number = models.PositiveIntegerField(default=1)
    amendment_notes = models.TextField(blank=True)

    class Meta:
        ordering = ['-reported_at', '-version_number']
        verbose_name = _('Laboratory Report')
        verbose_name_plural = _('Laboratory Reports')

    def __str__(self):
        return f"Report #{self.id} v{self.version_number} for {self.laboratory_order.test_name} ({self.verification_status})"
