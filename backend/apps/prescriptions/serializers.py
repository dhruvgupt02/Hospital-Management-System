from rest_framework import serializers
from django.db import transaction
from .models import Prescription, PrescriptionItem
from apps.patients.serializers import PatientSerializer
from apps.doctors.serializers import DoctorSerializer

class PrescriptionItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = PrescriptionItem
        fields = [
            'id', 'medicine_name', 'dosage', 'frequency',
            'duration', 'quantity', 'additional_instructions'
        ]

class PrescriptionSerializer(serializers.ModelSerializer):
    patient_details = PatientSerializer(source='patient', read_only=True)
    doctor_details = DoctorSerializer(source='doctor', read_only=True)
    items = PrescriptionItemSerializer(many=True, read_only=True)

    class Meta:
        model = Prescription
        fields = [
            'id', 'medical_record', 'doctor', 'patient',
            'patient_details', 'doctor_details', 'prescribed_at',
            'instructions', 'status', 'items', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']

class PrescriptionCreateSerializer(serializers.ModelSerializer):
    items = PrescriptionItemSerializer(many=True, required=True)

    class Meta:
        model = Prescription
        fields = [
            'medical_record', 'patient', 'instructions', 'items'
        ]

    def create(self, validated_data):
        items_data = validated_data.pop('items')
        doctor = self.context['doctor']

        with transaction.atomic():
            prescription = Prescription.objects.create(doctor=doctor, **validated_data)
            for item in items_data:
                PrescriptionItem.objects.create(prescription=prescription, **item)
        return prescription
