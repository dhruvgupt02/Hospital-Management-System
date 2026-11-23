from decimal import Decimal
from rest_framework import serializers
from .models import Invoice, InvoiceItem, Payment
from apps.patients.serializers import PatientSerializer

class InvoiceItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = InvoiceItem
        fields = ['id', 'description', 'quantity', 'unit_price', 'line_total']
        read_only_fields = ['id', 'line_total']

class PaymentSerializer(serializers.ModelSerializer):
    payment_method_display = serializers.CharField(source='get_payment_method_display', read_only=True)

    class Meta:
        model = Payment
        fields = [
            'id', 'invoice', 'amount', 'payment_method',
            'payment_method_display', 'transaction_reference',
            'status', 'notes', 'paid_at', 'created_at'
        ]
        read_only_fields = ['id', 'paid_at', 'created_at']

class InvoiceSerializer(serializers.ModelSerializer):
    patient_details = PatientSerializer(source='patient', read_only=True)
    items = InvoiceItemSerializer(many=True, read_only=True)
    payments = PaymentSerializer(many=True, read_only=True)
    balance_due = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = Invoice
        fields = [
            'id', 'patient', 'appointment', 'patient_details',
            'invoice_number', 'subtotal', 'tax_amount', 'discount_amount',
            'total_amount', 'amount_paid', 'balance_due', 'status',
            'due_date', 'items', 'payments', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'invoice_number', 'subtotal', 'total_amount',
            'amount_paid', 'balance_due', 'created_at', 'updated_at'
        ]

class InvoiceCreateItemSerializer(serializers.Serializer):
    description = serializers.CharField(required=True)
    quantity = serializers.IntegerField(min_value=1, default=1)
    unit_price = serializers.DecimalField(max_digits=10, decimal_places=2)

class InvoiceCreateSerializer(serializers.ModelSerializer):
    items = InvoiceCreateItemSerializer(many=True, required=True)

    class Meta:
        model = Invoice
        fields = ['patient', 'appointment', 'tax_amount', 'discount_amount', 'due_date', 'items']

    def create(self, validated_data):
        from django.db import transaction
        items_data = validated_data.pop('items')
        with transaction.atomic():
            invoice = Invoice.objects.create(**validated_data)
            for item in items_data:
                InvoiceItem.objects.create(
                    invoice=invoice,
                    description=item['description'],
                    quantity=item['quantity'],
                    unit_price=item['unit_price']
                )
            invoice.recalculate_totals(save=True)
        return invoice

class RecordPaymentSerializer(serializers.Serializer):
    amount = serializers.DecimalField(max_digits=10, decimal_places=2, min_value=Decimal('0.01'))
    payment_method = serializers.CharField(required=True)
    transaction_reference = serializers.CharField(required=False, allow_blank=True)
    notes = serializers.CharField(required=False, allow_blank=True)
