from rest_framework import serializers
from .models import LaboratoryOrder, LaboratoryReport
from apps.patients.serializers import PatientSerializer
from apps.doctors.serializers import DoctorSerializer

class LaboratoryReportSerializer(serializers.ModelSerializer):
    verified_by_name = serializers.CharField(source='verified_by.get_full_name', read_only=True)
    file_url = serializers.SerializerMethodField()

    class Meta:
        model = LaboratoryReport
        fields = [
            'id', 'laboratory_order', 'result', 'unit', 'reference_range',
            'report_file', 'file_url', 'reported_at', 'verified_by',
            'verified_by_name', 'verification_status', 'version_number',
            'amendment_notes'
        ]
        read_only_fields = ['id', 'reported_at', 'version_number', 'file_url']

    def get_file_url(self, obj):
        if obj.report_file:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.report_file.url)
            return obj.report_file.url
        return None

class LaboratoryOrderSerializer(serializers.ModelSerializer):
    patient_details = PatientSerializer(source='patient', read_only=True)
    ordered_by_details = DoctorSerializer(source='ordered_by', read_only=True)
    reports = LaboratoryReportSerializer(many=True, read_only=True)

    class Meta:
        model = LaboratoryOrder
        fields = [
            'id', 'patient', 'medical_record', 'ordered_by',
            'patient_details', 'ordered_by_details', 'test_name',
            'clinical_notes', 'status', 'ordered_at', 'reports'
        ]
        read_only_fields = ['id', 'ordered_at']

class LaboratoryOrderCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = LaboratoryOrder
        fields = ['patient', 'medical_record', 'test_name', 'clinical_notes']

class LaboratoryReportCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = LaboratoryReport
        fields = [
            'laboratory_order', 'result', 'unit', 'reference_range',
            'report_file', 'amendment_notes'
        ]

    def validate_report_file(self, value):
        if value:
            # Validate file size (< 10MB)
            if value.size > 10 * 1024 * 1024:
                raise serializers.ValidationError("File size cannot exceed 10MB.")
            # Validate file extension
            allowed_extensions = ['pdf', 'png', 'jpg', 'jpeg']
            ext = value.name.split('.')[-1].lower()
            if ext not in allowed_extensions:
                raise serializers.ValidationError(f"Invalid file format. Allowed formats: {', '.join(allowed_extensions)}")
        return value
