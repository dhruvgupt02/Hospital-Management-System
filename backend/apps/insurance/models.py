import uuid
from decimal import Decimal
from django.db import models
from django.utils.translation import gettext_lazy as _
from django.utils import timezone
from apps.patients.models import Patient
from apps.billing.models import Invoice

class PolicyStatus(models.TextChoices):
    ACTIVE = 'Active', _('Active')
    EXPIRED = 'Expired', _('Expired')
    TERMINATED = 'Terminated', _('Terminated')

class ClaimStatus(models.TextChoices):
    SUBMITTED = 'Submitted', _('Submitted')
    UNDER_REVIEW = 'Under_Review', _('Under Review')
    APPROVED = 'Approved', _('Approved')
    REJECTED = 'Rejected', _('Rejected')
    SETTLED = 'Settled', _('Settled')

def generate_claim_number():
    date_str = timezone.now().strftime('%Y%m%d')
    random_str = uuid.uuid4().hex[:6].upper()
    return f"CLM-{date_str}-{random_str}"

class InsurancePolicy(models.Model):
    patient = models.ForeignKey(
        Patient,
        on_delete=models.PROTECT,
        related_name='insurance_policies'
    )
    insurer_name = models.CharField(_('insurance company name'), max_length=100)
    policy_number = models.CharField(_('policy / member ID'), max_length=100, db_index=True)
    coverage_details = models.TextField(_('coverage summary & limits'))
    valid_from = models.DateField()
    valid_until = models.DateField()
    status = models.CharField(
        max_length=20,
        choices=PolicyStatus.choices,
        default=PolicyStatus.ACTIVE,
        db_index=True
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-valid_until']
        verbose_name = _('Insurance Policy')
        verbose_name_plural = _('Insurance Policies')

    def __str__(self):
        return f"{self.insurer_name} ({self.policy_number}) - {self.patient.user.get_full_name()}"

class InsuranceClaim(models.Model):
    invoice = models.ForeignKey(
        Invoice,
        on_delete=models.PROTECT,
        related_name='insurance_claims'
    )
    insurance_policy = models.ForeignKey(
        InsurancePolicy,
        on_delete=models.PROTECT,
        related_name='claims'
    )
    claim_number = models.CharField(
        max_length=100,
        unique=True,
        default=generate_claim_number,
        db_index=True
    )
    claim_amount = models.DecimalField(max_digits=10, decimal_places=2)
    approved_amount = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    status = models.CharField(
        max_length=20,
        choices=ClaimStatus.choices,
        default=ClaimStatus.SUBMITTED,
        db_index=True
    )
    adjudication_notes = models.TextField(blank=True)
    submitted_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-submitted_at']
        verbose_name = _('Insurance Claim')
        verbose_name_plural = _('Insurance Claims')

    def __str__(self):
        return f"Claim #{self.claim_number} (${self.claim_amount}) - {self.status}"
