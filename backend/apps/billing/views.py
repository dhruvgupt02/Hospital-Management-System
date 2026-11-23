from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .models import Invoice, InvoiceItem, Payment, InvoiceStatus
from .serializers import (
    InvoiceSerializer,
    InvoiceCreateSerializer,
    PaymentSerializer,
    RecordPaymentSerializer,
)
from .services import BillingService
from apps.accounts.models import UserRole
from apps.accounts.permissions import IsBillingStaffRole
from apps.audit.models import AuditLog, AuditAction

class InvoiceViewSet(viewsets.ModelViewSet):
    """
    CRUD viewset for Invoices, payments, and financial auditing.
    """
    serializer_class = InvoiceSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['patient', 'status']
    search_fields = ['invoice_number', 'patient__user__first_name', 'patient__user__last_name']
    ordering_fields = ['created_at', 'total_amount', 'status']

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Invoice.objects.none()

        qs = Invoice.objects.select_related('patient__user', 'appointment').prefetch_related('items', 'payments')

        if user.role == UserRole.PATIENT:
            return qs.filter(patient__user=user)
        elif user.role in [UserRole.BILLING_STAFF, UserRole.ADMIN, UserRole.RECEPTIONIST]:
            return qs.all()
        return qs.none()

    def create(self, request, *args, **kwargs):
        user = request.user
        if user.role not in [UserRole.BILLING_STAFF, UserRole.ADMIN]:
            return Response(
                {"detail": "Only billing staff and administrators can generate invoices."},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = InvoiceCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        invoice = serializer.save()

        AuditLog.log_event(
            actor=user,
            action=AuditAction.CREATE,
            entity_type='Invoice',
            entity_id=str(invoice.id),
            change_summary=f"Invoice #{invoice.invoice_number} generated for ${invoice.total_amount} (Patient: {invoice.patient.user.get_full_name()})"
        )

        return Response(InvoiceSerializer(invoice).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def record_payment(self, request, pk=None):
        invoice = self.get_object()
        user = request.user

        # Both patient (simulated self-pay) or billing staff can record payment
        if user.role == UserRole.PATIENT and invoice.patient.user != user:
            return Response({"detail": "Forbidden."}, status=status.HTTP_403_FORBIDDEN)

        serializer = RecordPaymentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            payment = BillingService.record_payment(
                invoice_id=invoice.id,
                amount=serializer.validated_data['amount'],
                payment_method=serializer.validated_data['payment_method'],
                transaction_reference=serializer.validated_data.get('transaction_reference'),
                user=user,
                notes=serializer.validated_data.get('notes', '')
            )
        except Exception as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        # Refresh invoice
        invoice.refresh_from_db()
        return Response({
            "message": "Payment successfully recorded.",
            "payment": PaymentSerializer(payment).data,
            "invoice": InvoiceSerializer(invoice).data
        }, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'], permission_classes=[IsBillingStaffRole])
    def cancel(self, request, pk=None):
        invoice = self.get_object()
        if invoice.amount_paid > 0:
            return Response({"detail": "Cannot cancel an invoice with recorded payments."}, status=status.HTTP_400_BAD_REQUEST)
        invoice.status = InvoiceStatus.CANCELLED
        invoice.save(update_fields=['status', 'updated_at'])

        AuditLog.log_event(
            actor=request.user,
            action=AuditAction.UPDATE,
            entity_type='Invoice',
            entity_id=str(invoice.id),
            change_summary=f"Invoice #{invoice.invoice_number} marked as Cancelled by {request.user.email}"
        )
        return Response(InvoiceSerializer(invoice).data)

class PaymentViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Read-only viewset for recorded payments.
    """
    serializer_class = PaymentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Payment.objects.none()

        qs = Payment.objects.select_related('invoice__patient__user')
        if user.role == UserRole.PATIENT:
            return qs.filter(invoice__patient__user=user)
        elif user.role in [UserRole.BILLING_STAFF, UserRole.ADMIN]:
            return qs.all()
        return qs.none()
