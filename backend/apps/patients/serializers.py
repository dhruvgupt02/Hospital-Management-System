from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Patient
from apps.accounts.models import UserRole

User = get_user_model()

class PatientSerializer(serializers.ModelSerializer):
    first_name = serializers.CharField(source='user.first_name', read_only=True)
    last_name = serializers.CharField(source='user.last_name', read_only=True)
    email = serializers.EmailField(source='user.email', read_only=True)
    full_name = serializers.CharField(source='user.get_full_name', read_only=True)

    class Meta:
        model = Patient
        fields = [
            'id', 'user', 'first_name', 'last_name', 'email', 'full_name',
            'date_of_birth', 'gender', 'phone', 'address', 'emergency_contact',
            'blood_group', 'allergies', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'user', 'created_at', 'updated_at']

class PatientCreateSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(write_only=True, required=True)
    first_name = serializers.CharField(write_only=True, required=True)
    last_name = serializers.CharField(write_only=True, required=True)
    password = serializers.CharField(write_only=True, required=False, default="Patient@123")

    class Meta:
        model = Patient
        fields = [
            'id', 'email', 'first_name', 'last_name', 'password',
            'date_of_birth', 'gender', 'phone', 'address', 'emergency_contact',
            'blood_group', 'allergies'
        ]

    def create(self, validated_data):
        email = validated_data.pop('email')
        first_name = validated_data.pop('first_name')
        last_name = validated_data.pop('last_name')
        password = validated_data.pop('password', 'Patient@123')

        user = User.objects.create_user(
            email=email,
            first_name=first_name,
            last_name=last_name,
            role=UserRole.PATIENT,
            password=password
        )

        patient = Patient.objects.create(user=user, **validated_data)
        return patient
