from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Doctor, DoctorAvailability
from apps.accounts.models import UserRole

User = get_user_model()

class DoctorAvailabilitySerializer(serializers.ModelSerializer):
    weekday_display = serializers.CharField(source='get_weekday_display', read_only=True)

    class Meta:
        model = DoctorAvailability
        fields = [
            'id', 'doctor', 'weekday', 'weekday_display',
            'start_time', 'end_time', 'effective_from', 'effective_until', 'is_active'
        ]

class DoctorSerializer(serializers.ModelSerializer):
    first_name = serializers.CharField(source='user.first_name', read_only=True)
    last_name = serializers.CharField(source='user.last_name', read_only=True)
    email = serializers.EmailField(source='user.email', read_only=True)
    full_name = serializers.CharField(source='user.get_full_name', read_only=True)
    availabilities = DoctorAvailabilitySerializer(many=True, read_only=True)

    class Meta:
        model = Doctor
        fields = [
            'id', 'user', 'first_name', 'last_name', 'email', 'full_name',
            'specialization', 'license_number', 'consultation_fee',
            'biography', 'availability_status', 'availabilities',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'user', 'created_at', 'updated_at']

class DoctorCreateSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(write_only=True, required=True)
    first_name = serializers.CharField(write_only=True, required=True)
    last_name = serializers.CharField(write_only=True, required=True)
    password = serializers.CharField(write_only=True, required=False, default="Doctor@123")

    class Meta:
        model = Doctor
        fields = [
            'id', 'email', 'first_name', 'last_name', 'password',
            'specialization', 'license_number', 'consultation_fee',
            'biography', 'availability_status'
        ]

    def create(self, validated_data):
        email = validated_data.pop('email')
        first_name = validated_data.pop('first_name')
        last_name = validated_data.pop('last_name')
        password = validated_data.pop('password', 'Doctor@123')

        user = User.objects.create_user(
            email=email,
            first_name=first_name,
            last_name=last_name,
            role=UserRole.DOCTOR,
            password=password
        )

        doctor = Doctor.objects.create(user=user, **validated_data)
        return doctor
