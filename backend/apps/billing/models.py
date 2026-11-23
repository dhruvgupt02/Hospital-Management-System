import uuid
from decimal import Decimal
from django.db import models
from django.utils.translation import gettext_lazy as _
from django.utils import timezone
from apps.patients.models import Patient
from apps.appointments.models import Appointment

class InvoiceStatus(models.TextChoices):
    UNPAID = 'Unpaid', _('Unpaid')
    PARTIALLY_PAID = 'Partially_Paid', _('Partially Paid')
    PAID = 'Paid', _('Paid')
    CANCELLED = 'Cancelled', _('Cancelled')

class PaymentMethod(models.TextChoices):
    CREDIT_CARD = 'Credit_Card', _('Credit Card (Simulated)')
    DEBIT_CARD = 'Debit_Card', _('Debit Card (Simulated)')
    CASH = 'Cash', _('Cash')
    INSURANCE = 'Insurance', _('Insurance Adjudication')
    BANK_TRANSFER = 'Bank_Transfer', _('Bank Transfer')

class PaymentStatus(models.TextChoices):
    SUCCESS = 'Success', _('Success')
    FAILED = 'Failed', _('Failed')
    REFUNDED = 'Refunded', _('Refunded')

def generate_invoice_number():
    date_part = timezone.now().strftime('%Y%m%d')
    random_part = uuid.uuid4().hex[:6].upper()
    return f"INV-{date_part}-{random_part}"

class Invoice(models.Model):
    patient = models.ForeignKey(
        Patient,
        on_delete=models.PROTECT,
        related_name='invoices'
    )
    appointment = models.ForeignKey(
        Appointment,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='invoices'
    )
    invoice_number = models.CharField(
        max_length=50,
        unique=True,
        default=generate_invoice_number,
        db_index=True
    )
    subtotal = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    tax_amount = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    discount_amount = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    total_amount = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    amount_paid = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    status = models.CharField(
        max_length=20,
        choices=InvoiceStatus.choices,
        default=InvoiceStatus.UNPAID,
        db_index=True
    )
    due_date = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = _('Invoice')
        verbose_name_plural = _('Invoices')
        indexes = [
            models.Index(fields=['patient', 'status']),
            models.Index(fields=['invoice_number']),
        ]

    def __str__(self):
        return f"{self.invoice_number} - {self.patient.user.get_full_name()} (${self.total_amount})"

    @property
    def balance_due(self):
        return max(Decimal('0.00'), self.total_amount - self.amount_paid)

    def recalculate_totals(self, save=True):
        """Recalculates monetary totals from items using server-side decimal math."""
        items_total = sum((item.line_total for item in self.items.all()), Decimal('0.00'))
        self.subtotal = items_total
        # Recalculate net total
        net = self.subtotal + self.tax_amount - self.discount_amount
        self.total_amount = max(Decimal('0.00'), net)

        # Update status based on payments
        if self.amount_paid >= self.total_amount and self.total_amount > Decimal('0.00'):
            self.status = InvoiceStatus.PAID
        elif self.amount_paid > Decimal('0.00'):
            self.status = InvoiceStatus.PARTIALLY_PAID
        elif self.status != InvoiceStatus.CANCELLED:
            self.status = InvoiceStatus.UNPAID

        if save:
            self.save(update_fields=['subtotal', 'total_amount', 'status', 'updated_at'])

class InvoiceItem(models.Model):
    invoice = models.ForeignKey(
        Invoice,
        on_delete=models.CASCADE,
        related_name='items'
    )
    description = models.CharField(max_length=200)
    quantity = models.PositiveIntegerField(default=1)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    line_total = models.DecimalField(max_digits=10, decimal_places=2)

    class Meta:
        ordering = ['id']

    def save(self, *args, **kwargs):
        # Calculate line total securely on the server
        self.line_total = Decimal(str(self.quantity)) * Decimal(str(self.unit_price))
        super().save(*args, **kwargs)

class Payment(models.Model):
    invoice = models.ForeignKey(
        Invoice,
        on_delete=models.PROTECT,
        related_name='payments'
    )
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    payment_method = models.CharField(
        max_length=30,
        choices=PaymentMethod.choices,
        default=PaymentMethod.CREDIT_CARD
    )
    transaction_reference = models.CharField(
        max_length=100,
        unique=True,
        db_index=True
    )
    status = models.CharField(
        max_length=20,
        choices=PaymentStatus.choices,
        default=PaymentStatus.SUCCESS
    )
    notes = models.TextField(blank=True)
    paid_at = models.DateTimeField(default=timezone.now)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-paid_at']

    def __str__(self):
        return f"Payment #{self.id} (${self.amount}) for {self.invoice.invoice_number}"
