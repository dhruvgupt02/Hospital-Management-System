from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from .models import User, UserRole

class UserSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(source='get_full_name', read_only=True)
    role_display = serializers.CharField(source='get_role_display', read_only=True)
    patient_id = serializers.SerializerMethodField()
    doctor_id = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'email', 'first_name', 'last_name', 'full_name',
            'role', 'role_display', 'is_active', 'created_at', 'updated_at',
            'patient_id', 'doctor_id'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_patient_id(self, obj):
        if hasattr(obj, 'patient_profile'):
            return obj.patient_profile.id
        return None

    def get_doctor_id(self, obj):
        if hasattr(obj, 'doctor_profile'):
            return obj.doctor_profile.id
        return None

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True, required=True)
    date_of_birth = serializers.DateField(required=False, allow_null=True)
    gender = serializers.CharField(required=False, allow_blank=True, max_length=20)
    phone = serializers.CharField(required=False, allow_blank=True, max_length=30)
    address = serializers.CharField(required=False, allow_blank=True)
    emergency_contact = serializers.CharField(required=False, allow_blank=True, max_length=150)

    class Meta:
        model = User
        fields = [
            'email', 'password', 'password_confirm', 'first_name', 'last_name',
            'role', 'date_of_birth', 'gender', 'phone', 'address', 'emergency_contact'
        ]

    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        return attrs

    def create(self, validated_data):
        validated_data.pop('password_confirm')
        date_of_birth = validated_data.pop('date_of_birth', None)
        gender = validated_data.pop('gender', '')
        phone = validated_data.pop('phone', '')
        address = validated_data.pop('address', '')
        emergency_contact = validated_data.pop('emergency_contact', '')

        # Standard public registration defaults to PATIENT role
        role = validated_data.get('role', UserRole.PATIENT)
        user = User.objects.create_user(**validated_data)

        # If role is PATIENT, automatically create Patient profile
        if role == UserRole.PATIENT:
            from apps.patients.models import Patient
            Patient.objects.create(
                user=user,
                date_of_birth=date_of_birth or '2000-01-01',
                gender=gender or 'Other',
                phone=phone or '',
                address=address or '',
                emergency_contact=emergency_contact or ''
            )

        return user

class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, validators=[validate_password])

    def validate_old_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError("Current password is incorrect.")
        return value

class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)

class UserAdminUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['role', 'is_active', 'first_name', 'last_name']
