from decimal import Decimal
from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import transaction
from django_filters.rest_framework import DjangoFilterBackend
from .models import InsurancePolicy, InsuranceClaim, ClaimStatus
from .serializers import (
    InsurancePolicySerializer,
    InsuranceClaimSerializer,
    InsuranceClaimCreateSerializer,
    ClaimAdjudicationSerializer,
)
from apps.accounts.models import UserRole
from apps.accounts.permissions import IsBillingStaffRole
from apps.billing.services import BillingService
from apps.billing.models import PaymentMethod
from apps.audit.models import AuditLog, AuditAction

class InsurancePolicyViewSet(viewsets.ModelViewSet):
    serializer_class = InsurancePolicySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return InsurancePolicy.objects.none()

        qs = InsurancePolicy.objects.select_related('patient__user')
        if user.role == UserRole.PATIENT:
            return qs.filter(patient__user=user)
        elif user.role in [UserRole.BILLING_STAFF, UserRole.ADMIN, UserRole.RECEPTIONIST]:
            return qs.all()
        return qs.none()

class InsuranceClaimViewSet(viewsets.ModelViewSet):
    serializer_class = InsuranceClaimSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['status']
    search_fields = ['claim_number', 'invoice__invoice_number', 'insurance_policy__insurer_name']

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return InsuranceClaim.objects.none()

        qs = InsuranceClaim.objects.select_related(
            'invoice__patient__user',
            'insurance_policy__patient__user'
        )
        if user.role == UserRole.PATIENT:
            return qs.filter(invoice__patient__user=user)
        elif user.role in [UserRole.BILLING_STAFF, UserRole.ADMIN]:
            return qs.all()
        return qs.none()

    def create(self, request, *args, **kwargs):
        user = request.user
        if user.role not in [UserRole.BILLING_STAFF, UserRole.ADMIN]:
            return Response({"detail": "Only billing staff can submit insurance claims."}, status=status.HTTP_403_FORBIDDEN)

        serializer = InsuranceClaimCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        claim = serializer.save()

        AuditLog.log_event(
            actor=user,
            action=AuditAction.CLAIM_SUBMITTED,
            entity_type='InsuranceClaim',
            entity_id=str(claim.id),
            change_summary=f"Insurance claim #{claim.claim_number} of ${claim.claim_amount} submitted to {claim.insurance_policy.insurer_name} for Invoice {claim.invoice.invoice_number}"
        )

        return Response(InsuranceClaimSerializer(claim).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'], permission_classes=[IsBillingStaffRole])
    def adjudicate(self, request, pk=None):
        """
        Adjudicate an insurance claim: approve/reject/settle.
        If settled with approved amount > 0, records an insurance payment towards the invoice!
        """
        claim = self.get_object()
        serializer = ClaimAdjudicationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        new_status = serializer.validated_data['status']
        approved_amt = serializer.validated_data.get('approved_amount', Decimal('0.00'))
        notes = serializer.validated_data.get('adjudication_notes', '')

        with transaction.atomic():
            claim.status = new_status
            claim.approved_amount = approved_amt
            claim.adjudication_notes = notes
            claim.save()

            # If settled with approved amount, apply insurance payment to invoice
            if new_status == ClaimStatus.SETTLED and approved_amt > Decimal('0.00'):
                BillingService.record_payment(
                    invoice_id=claim.invoice.id,
                    amount=approved_amt,
                    payment_method=PaymentMethod.INSURANCE,
                    transaction_reference=f"INS-{claim.claim_number}",
                    user=request.user,
                    notes=f"Settled insurance payout from {claim.insurance_policy.insurer_name}"
                )

            AuditLog.log_event(
                actor=request.user,
                action=AuditAction.UPDATE,
                entity_type='InsuranceClaim',
                entity_id=str(claim.id),
                change_summary=f"Claim #{claim.claim_number} status updated to {new_status} (Approved: ${approved_amt})"
            )

        return Response(InsuranceClaimSerializer(claim).data)
