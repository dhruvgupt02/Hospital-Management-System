from decimal import Decimal
from rest_framework import serializers
from .models import InsurancePolicy, InsuranceClaim
from apps.patients.serializers import PatientSerializer
from apps.billing.serializers import InvoiceSerializer

class InsurancePolicySerializer(serializers.ModelSerializer):
    patient_details = PatientSerializer(source='patient', read_only=True)

    class Meta:
        model = InsurancePolicy
        fields = [
            'id', 'patient', 'patient_details', 'insurer_name',
            'policy_number', 'coverage_details', 'valid_from',
            'valid_until', 'status', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']

class InsuranceClaimSerializer(serializers.ModelSerializer):
    policy_details = InsurancePolicySerializer(source='insurance_policy', read_only=True)
    invoice_details = InvoiceSerializer(source='invoice', read_only=True)

    class Meta:
        model = InsuranceClaim
        fields = [
            'id', 'invoice', 'insurance_policy', 'invoice_details',
            'policy_details', 'claim_number', 'claim_amount',
            'approved_amount', 'status', 'adjudication_notes',
            'submitted_at', 'updated_at'
        ]
        read_only_fields = ['id', 'claim_number', 'submitted_at', 'updated_at']

class InsuranceClaimCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = InsuranceClaim
        fields = ['invoice', 'insurance_policy', 'claim_amount']

    def validate(self, attrs):
        invoice = attrs['invoice']
        policy = attrs['insurance_policy']
        claim_amount = attrs['claim_amount']

        if policy.patient != invoice.patient:
            raise serializers.ValidationError("Insurance policy does not belong to the invoice's patient.")
        if claim_amount > invoice.total_amount:
            raise serializers.ValidationError("Claim amount cannot exceed total invoice amount.")
        return attrs

class ClaimAdjudicationSerializer(serializers.Serializer):
    status = serializers.CharField(required=True)
    approved_amount = serializers.DecimalField(max_digits=10, decimal_places=2, required=False, default=Decimal('0.00'))
    adjudication_notes = serializers.CharField(required=False, allow_blank=True)
