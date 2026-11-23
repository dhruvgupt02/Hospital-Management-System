from rest_framework import serializers
from .models import AuditLog

class AuditLogSerializer(serializers.ModelSerializer):
    actor_display = serializers.SerializerMethodField()

    class Meta:
        model = AuditLog
        fields = [
            'id', 'actor', 'actor_email', 'actor_display', 'action',
            'entity_type', 'entity_id', 'timestamp', 'request_id',
            'source_ip', 'change_summary', 'previous_values', 'new_values'
        ]
        read_only_fields = fields

    def get_actor_display(self, obj):
        if obj.actor:
            return obj.actor.get_full_name() or obj.actor.email
        return obj.actor_email or 'System'
