import uuid
from decimal import Decimal
from django.db import transaction
from django.core.exceptions import ValidationError
from .models import Invoice, Payment, PaymentStatus, InvoiceStatus
from apps.audit.models import AuditLog, AuditAction

class BillingService:
    @classmethod
    def record_payment(
        cls,
        invoice_id,
        amount,
        payment_method,
        transaction_reference=None,
        user=None,
        notes=""
    ):
        """
        Records a payment atomically with row-level locking (select_for_update)
        on the Invoice to prevent concurrent race conditions.
        """
        amount_dec = Decimal(str(amount))
        if amount_dec <= Decimal('0.00'):
            raise ValidationError("Payment amount must be greater than zero.")

        if not transaction_reference:
            transaction_reference = f"TXN-{uuid.uuid4().hex[:12].upper()}"

        with transaction.atomic():
            # Acquire row-level lock on the target invoice
            invoice = Invoice.objects.select_for_update().get(id=invoice_id)

            if invoice.status == InvoiceStatus.PAID:
                raise ValidationError("Invoice is already fully settled.")
            if invoice.status == InvoiceStatus.CANCELLED:
                raise ValidationError("Cannot pay towards a cancelled invoice.")

            current_balance = invoice.balance_due
            if amount_dec > current_balance:
                raise ValidationError(f"Payment amount (${amount_dec}) exceeds remaining balance (${current_balance}).")

            # Check duplicate transaction reference
            if Payment.objects.filter(transaction_reference=transaction_reference).exists():
                raise ValidationError("Duplicate transaction reference detected.")

            # Create payment record
            payment = Payment.objects.create(
                invoice=invoice,
                amount=amount_dec,
                payment_method=payment_method,
                transaction_reference=transaction_reference,
                status=PaymentStatus.SUCCESS,
                notes=notes
            )

            # Update invoice paid balance
            invoice.amount_paid += amount_dec
            if invoice.amount_paid >= invoice.total_amount:
                invoice.status = InvoiceStatus.PAID
            else:
                invoice.status = InvoiceStatus.PARTIALLY_PAID
            invoice.save(update_fields=['amount_paid', 'status', 'updated_at'])

            # Log audit event within the same database transaction
            AuditLog.log_event(
                actor=user,
                action=AuditAction.PAYMENT_RECORDED,
                entity_type='Invoice',
                entity_id=str(invoice.id),
                change_summary=f"Payment of ${amount_dec} recorded via {payment_method} (Ref: {transaction_reference})",
                previous_values={'amount_paid': str(invoice.amount_paid - amount_dec)},
                new_values={'amount_paid': str(invoice.amount_paid), 'status': invoice.status}
            )

            return payment
