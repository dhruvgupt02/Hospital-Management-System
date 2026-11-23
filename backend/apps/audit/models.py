from django.db import models
from django.conf import settings
from django.utils.translation import gettext_lazy as _
from .middleware import get_current_user, get_current_request, get_current_request_id

class AuditAction(models.TextChoices):
    CREATE = 'CREATE', _('Create')
    UPDATE = 'UPDATE', _('Update')
    DELETE = 'DELETE', _('Delete')
    LOGIN_SUCCESS = 'LOGIN_SUCCESS', _('Login Success')
    LOGIN_FAILED = 'LOGIN_FAILED', _('Login Failed')
    PASSWORD_RESET = 'PASSWORD_RESET', _('Password Reset')
    ROLE_CHANGE = 'ROLE_CHANGE', _('Role Change')
    APPOINTMENT_CANCELLED = 'APPOINTMENT_CANCELLED', _('Appointment Cancelled')
    APPOINTMENT_RESCHEDULED = 'APPOINTMENT_RESCHEDULED', _('Appointment Rescheduled')
    RECORD_AMENDED = 'RECORD_AMENDED', _('Medical Record Amended')
    PAYMENT_RECORDED = 'PAYMENT_RECORDED', _('Payment Recorded')
    CLAIM_SUBMITTED = 'CLAIM_SUBMITTED', _('Insurance Claim Submitted')

class AuditLog(models.Model):
    """
    Immutable audit log tracking all critical clinical, financial, and security events.
    App-level safeguards prevent deletion or modification of audit trails.
    """
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='audit_actions'
    )
    actor_email = models.CharField(max_length=255, null=True, blank=True)
    action = models.CharField(max_length=50, choices=AuditAction.choices, db_index=True)
    entity_type = models.CharField(max_length=100, db_index=True)
    entity_id = models.CharField(max_length=100, db_index=True)
    timestamp = models.DateTimeField(auto_now_add=True, db_index=True)
    request_id = models.CharField(max_length=100, null=True, blank=True)
    source_ip = models.CharField(max_length=50, null=True, blank=True)
    change_summary = models.TextField()
    previous_values = models.JSONField(default=dict, blank=True)
    new_values = models.JSONField(default=dict, blank=True)

    class Meta:
        ordering = ['-timestamp']
        verbose_name = _('Audit Log')
        verbose_name_plural = _('Audit Logs')
        indexes = [
            models.Index(fields=['entity_type', 'entity_id']),
            models.Index(fields=['action', 'timestamp']),
        ]

    def __str__(self):
        actor_name = self.actor_email or (self.actor.email if self.actor else 'System')
        return f"[{self.timestamp:%Y-%m-%d %H:%M:%S}] {actor_name} -> {self.action} on {self.entity_type} #{self.entity_id}"

    def save(self, *args, **kwargs):
        # Prevent update of existing audit logs (immutability rule)
        if self.pk:
            raise ValueError(_("Audit log entries are immutable and cannot be updated."))
        if not self.actor_email and self.actor:
            self.actor_email = self.actor.email
        super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        raise ValueError(_("Audit log entries cannot be deleted."))

    @classmethod
    def log_event(
        cls,
        action,
        entity_type,
        entity_id,
        change_summary,
        actor=None,
        previous_values=None,
        new_values=None,
        request=None
    ):
        """Helper to reliably log an audit event using current context."""
        if not actor:
            actor = get_current_user()

        actor_email = None
        if actor and hasattr(actor, 'email'):
            actor_email = actor.email

        req = request or get_current_request()
        request_id = None
        source_ip = None
        if req:
            request_id = getattr(req, 'request_id', None)
            source_ip = getattr(req, 'client_ip', None)
        else:
            request_id = get_current_request_id()

        return cls.objects.create(
            actor=actor if (actor and getattr(actor, 'is_authenticated', False)) else None,
            actor_email=actor_email,
            action=action,
            entity_type=entity_type,
            entity_id=str(entity_id),
            change_summary=change_summary,
            previous_values=previous_values or {},
            new_values=new_values or {},
            request_id=request_id,
            source_ip=source_ip
        )
