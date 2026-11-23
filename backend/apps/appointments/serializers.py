from rest_framework import serializers
from .models import Appointment, AppointmentStatus
from apps.patients.serializers import PatientSerializer
from apps.doctors.serializers import DoctorSerializer

class AppointmentSerializer(serializers.ModelSerializer):
    patient_details = PatientSerializer(source='patient', read_only=True)
    doctor_details = DoctorSerializer(source='doctor', read_only=True)
    created_by_email = serializers.EmailField(source='created_by.email', read_only=True)

    class Meta:
        model = Appointment
        fields = [
            'id', 'patient', 'doctor', 'patient_details', 'doctor_details',
            'appointment_start', 'appointment_end', 'status', 'reason',
            'cancellation_reason', 'created_by', 'created_by_email',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_by', 'created_at', 'updated_at']

    def validate(self, attrs):
        start = attrs.get('appointment_start')
        end = attrs.get('appointment_end')
        if start and end:
            if start >= end:
                raise serializers.ValidationError({"appointment_end": "Appointment end time must be after start time."})
            duration = end - start
            if duration.total_seconds() < 900:
                raise serializers.ValidationError({"appointment_end": "Appointment duration must be at least 15 minutes."})
            if duration.total_seconds() > 14400:
                raise serializers.ValidationError({"appointment_end": "Appointment duration cannot exceed 4 hours."})
        return attrs

class AppointmentCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Appointment
        fields = ['patient', 'doctor', 'appointment_start', 'appointment_end', 'reason']

    def validate(self, attrs):
        start = attrs.get('appointment_start')
        end = attrs.get('appointment_end')
        if start >= end:
            raise serializers.ValidationError("Appointment end time must be after start time.")
        duration = end - start
        if duration.total_seconds() < 900:
            raise serializers.ValidationError("Appointment duration must be at least 15 minutes.")
        if duration.total_seconds() > 14400:
            raise serializers.ValidationError("Appointment duration cannot exceed 4 hours.")
        return attrs

class AppointmentRescheduleSerializer(serializers.Serializer):
    appointment_start = serializers.DateTimeField(required=True)
    appointment_end = serializers.DateTimeField(required=True)
    reason = serializers.CharField(required=False, allow_blank=True)

    def validate(self, attrs):
        start = attrs.get('appointment_start')
        end = attrs.get('appointment_end')
        if start >= end:
            raise serializers.ValidationError("Appointment end time must be after start time.")
        return attrs

class AppointmentCancelSerializer(serializers.Serializer):
    cancellation_reason = serializers.CharField(required=True, min_length=3)
