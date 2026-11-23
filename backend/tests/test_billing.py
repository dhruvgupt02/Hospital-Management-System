import pytest
from decimal import Decimal
from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APIClient
from apps.accounts.models import UserRole
from apps.patients.models import Patient
from apps.billing.models import Invoice, InvoiceItem, InvoiceStatus, PaymentMethod, Payment
from apps.billing.services import BillingService

User = get_user_model()

@pytest.mark.django_db
class TestBilling:
    @pytest.fixture
    def setup_billing(self):
        p_user = User.objects.create_user(email='bill.patient@medicare.local', password='Pass123!', role=UserRole.PATIENT)
        patient = Patient.objects.create(user=p_user)

        b_user = User.objects.create_user(email='bill.staff@medicare.local', password='Pass123!', role=UserRole.BILLING_STAFF)

        client = APIClient()
        client.force_authenticate(user=b_user)

        return {
            'client': client,
            'b_user': b_user,
            'p_user': p_user,
            'patient': patient,
        }

    def test_invoice_creation_and_server_side_totals(self, setup_billing):
        client = setup_billing['client']
        patient = setup_billing['patient']

        url = reverse('invoices-list')
        payload = {
            'patient': patient.id,
            'tax_amount': '15.00',
            'discount_amount': '10.00',
            'items': [
                {'description': 'Consultation', 'quantity': 1, 'unit_price': '100.00'},
                {'description': 'Blood Draw Fee', 'quantity': 2, 'unit_price': '25.00'},
            ]
        }
        response = client.post(url, payload, format='json')
        assert response.status_code == status.HTTP_201_CREATED

        invoice = Invoice.objects.get(id=response.data['id'])
        # Subtotal: 100 + 50 = 150.00
        assert invoice.subtotal == Decimal('150.00')
        # Total: 150 + 15 - 10 = 155.00
        assert invoice.total_amount == Decimal('155.00')
        assert invoice.amount_paid == Decimal('0.00')
        assert invoice.status == InvoiceStatus.UNPAID

    def test_multiple_payments_and_balance_tracking(self, setup_billing):
        patient = setup_billing['patient']
        b_user = setup_billing['b_user']

        invoice = Invoice.objects.create(
            patient=patient,
            subtotal=Decimal('200.00'),
            total_amount=Decimal('200.00'),
            amount_paid=Decimal('0.00'),
            status=InvoiceStatus.UNPAID
        )

        # Payment 1: Partial payment of $80.00
        p1 = BillingService.record_payment(
            invoice_id=invoice.id,
            amount=Decimal('80.00'),
            payment_method=PaymentMethod.CREDIT_CARD,
            transaction_reference='TXN-TEST-001',
            user=b_user
        )

        invoice.refresh_from_db()
        assert invoice.amount_paid == Decimal('80.00')
        assert invoice.balance_due == Decimal('120.00')
        assert invoice.status == InvoiceStatus.PARTIALLY_PAID

        # Payment 2: Remaining settlement of $120.00
        p2 = BillingService.record_payment(
            invoice_id=invoice.id,
            amount=Decimal('120.00'),
            payment_method=PaymentMethod.CASH,
            transaction_reference='TXN-TEST-002',
            user=b_user
        )

        invoice.refresh_from_db()
        assert invoice.amount_paid == Decimal('200.00')
        assert invoice.balance_due == Decimal('0.00')
        assert invoice.status == InvoiceStatus.PAID
        assert invoice.payments.count() == 2

    def test_overpayment_rejection(self, setup_billing):
        patient = setup_billing['patient']
        b_user = setup_billing['b_user']

        invoice = Invoice.objects.create(
            patient=patient,
            subtotal=Decimal('100.00'),
            total_amount=Decimal('100.00'),
            amount_paid=Decimal('0.00'),
            status=InvoiceStatus.UNPAID
        )

        with pytest.raises(Exception):
            BillingService.record_payment(
                invoice_id=invoice.id,
                amount=Decimal('150.00'), # Exceeds remaining $100 balance
                payment_method=PaymentMethod.CREDIT_CARD,
                transaction_reference='TXN-TEST-FAIL',
                user=b_user
            )

    def test_duplicate_transaction_prevention(self, setup_billing):
        patient = setup_billing['patient']
        b_user = setup_billing['b_user']

        invoice = Invoice.objects.create(
            patient=patient,
            subtotal=Decimal('100.00'),
            total_amount=Decimal('100.00'),
            amount_paid=Decimal('0.00')
        )

        BillingService.record_payment(
            invoice_id=invoice.id,
            amount=Decimal('50.00'),
            payment_method=PaymentMethod.CREDIT_CARD,
            transaction_reference='TXN-DUP-KEY',
            user=b_user
        )

        with pytest.raises(Exception):
            BillingService.record_payment(
                invoice_id=invoice.id,
                amount=Decimal('50.00'),
                payment_method=PaymentMethod.CREDIT_CARD,
                transaction_reference='TXN-DUP-KEY', # Same reference
                user=b_user
            )
