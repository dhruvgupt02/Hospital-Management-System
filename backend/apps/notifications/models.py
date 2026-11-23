from django.db import models
from django.conf import settings
from django.utils.translation import gettext_lazy as _

class NotificationType(models.TextChoices):
    APPOINTMENT = 'Appointment', _('Appointment')
    PRESCRIPTION = 'Prescription', _('Prescription')
    LAB_REPORT = 'LabReport', _('Laboratory Report')
    BILLING = 'Billing', _('Billing & Payment')
    SYSTEM = 'System', _('System Notice')

class Notification(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notifications'
    )
    title = models.CharField(max_length=200)
    message = models.TextField()
    notification_type = models.CharField(
        max_length=30,
        choices=NotificationType.choices,
        default=NotificationType.SYSTEM
    )
    is_read = models.BooleanField(default=False, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = _('Notification')
        verbose_name_plural = _('Notifications')
        indexes = [
            models.Index(fields=['user', 'is_read', 'created_at']),
        ]

    def __str__(self):
        return f"Notification for {self.user.email}: {self.title}"
