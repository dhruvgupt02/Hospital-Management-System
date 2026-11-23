from rest_framework import serializers
from .models import MedicalRecord
from apps.patients.serializers import PatientSerializer
from apps.doctors.serializers import DoctorSerializer

class MedicalRecordHistorySerializer(serializers.ModelSerializer):
    doctor_name = serializers.CharField(source='doctor.user.get_full_name', read_only=True)

    class Meta:
        model = MedicalRecord
        fields = [
            'id', 'version_number', 'diagnosis', 'clinical_notes',
            'treatment_plan', 'recorded_at', 'created_at', 'updated_at',
            'amendment_reason', 'doctor_name'
        ]

class MedicalRecordSerializer(serializers.ModelSerializer):
    patient_details = PatientSerializer(source='patient', read_only=True)
    doctor_details = DoctorSerializer(source='doctor', read_only=True)
    amendment_history = MedicalRecordHistorySerializer(source='amendments', many=True, read_only=True)

    class Meta:
        model = MedicalRecord
        fields = [
            'id', 'patient', 'doctor', 'patient_details', 'doctor_details',
            'appointment', 'diagnosis', 'clinical_notes', 'treatment_plan',
            'recorded_at', 'created_at', 'updated_at', 'version_number',
            'is_latest', 'parent_record', 'amendment_reason', 'amendment_history'
        ]
        read_only_fields = [
            'id', 'version_number', 'is_latest', 'parent_record',
            'created_at', 'updated_at'
        ]

class MedicalRecordCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = MedicalRecord
        fields = [
            'patient', 'appointment', 'diagnosis', 'clinical_notes',
            'treatment_plan', 'recorded_at'
        ]

class MedicalRecordAmendSerializer(serializers.Serializer):
    diagnosis = serializers.CharField(required=True)
    clinical_notes = serializers.CharField(required=True)
    treatment_plan = serializers.CharField(required=False, allow_blank=True)
    amendment_reason = serializers.CharField(required=True, min_length=5)
