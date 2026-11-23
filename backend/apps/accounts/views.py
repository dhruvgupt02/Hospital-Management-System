from rest_framework import generics, status, viewsets
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import get_user_model
from .models import UserRole
from .serializers import (
    UserSerializer,
    RegisterSerializer,
    ChangePasswordSerializer,
    PasswordResetRequestSerializer,
    UserAdminUpdateSerializer,
)
from .permissions import IsAdminUserRole
from apps.audit.models import AuditLog, AuditAction

User = get_user_model()

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        try:
            data = super().validate(attrs)
        except Exception:
            # Audit failed login attempt
            email = attrs.get('email', '')
            AuditLog.log_event(
                action=AuditAction.LOGIN_FAILED,
                entity_type='User',
                entity_id=email,
                change_summary=f"Failed login attempt for {email}"
            )
            # Generic error message to prevent account enumeration
            raise

        # Check if user is active
        if not self.user.is_active:
            raise serializers.ValidationError("This account is inactive. Please contact administration.")

        # Attach user data to login response
        data['user'] = UserSerializer(self.user).data

        # Audit successful login
        AuditLog.log_event(
            actor=self.user,
            action=AuditAction.LOGIN_SUCCESS,
            entity_type='User',
            entity_id=str(self.user.id),
            change_summary=f"User {self.user.email} logged in successfully"
        )
        return data

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        # Audit registration
        AuditLog.log_event(
            actor=user,
            action=AuditAction.CREATE,
            entity_type='User',
            entity_id=str(user.id),
            change_summary=f"New user registered: {user.email} with role {user.role}"
        )

        headers = self.get_success_headers(serializer.data)
        return Response(
            {
                "message": "Registration successful. You can now log in.",
                "user": UserSerializer(user).data
            },
            status=status.HTTP_201_CREATED,
            headers=headers
        )

class CurrentUserView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            request.user.set_password(serializer.validated_data['new_password'])
            request.user.save()

            AuditLog.log_event(
                actor=request.user,
                action=AuditAction.UPDATE,
                entity_type='User',
                entity_id=str(request.user.id),
                change_summary=f"User {request.user.email} changed their password"
            )
            return Response({"message": "Password updated successfully."}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class PasswordResetRequestView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data['email']
            user = User.objects.filter(email=email).first()
            if user:
                # Audit password reset requested
                AuditLog.log_event(
                    actor=user,
                    action=AuditAction.PASSWORD_RESET,
                    entity_type='User',
                    entity_id=str(user.id),
                    change_summary=f"Password reset link generated for {email}"
                )
            # Always return 200 generic response to avoid enumeration
            return Response({
                "message": "If an account matches that email address, password reset instructions have been sent."
            }, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class UserManagementViewSet(viewsets.ModelViewSet):
    """Admin-only viewset for managing hospital staff and user accounts."""
    queryset = User.objects.all().order_by('-created_at')
    permission_classes = [IsAdminUserRole]
    serializer_class = UserSerializer
    filterset_fields = ['role', 'is_active']
    search_fields = ['email', 'first_name', 'last_name']

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        old_role = instance.role
        old_active = instance.is_active

        serializer = UserAdminUpdateSerializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)

        # Audit user modification
        new_role = instance.role
        new_active = instance.is_active
        changes = []
        if old_role != new_role:
            changes.append(f"role: {old_role} -> {new_role}")
        if old_active != new_active:
            changes.append(f"active: {old_active} -> {new_active}")

        AuditLog.log_event(
            actor=request.user,
            action=AuditAction.ROLE_CHANGE if old_role != new_role else AuditAction.UPDATE,
            entity_type='User',
            entity_id=str(instance.id),
            change_summary=f"Admin {request.user.email} updated user {instance.email}: {', '.join(changes)}",
            previous_values={'role': old_role, 'is_active': old_active},
            new_values={'role': new_role, 'is_active': new_active}
        )

        return Response(UserSerializer(instance).data)
