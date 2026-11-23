from rest_framework import permissions
from .models import UserRole

class IsAdminUserRole(permissions.BasePermission):
    """Allows access only to users with the ADMIN role or superusers."""
    def has_permission(self, request, view):
        return bool(
            request.user and request.user.is_authenticated and
            (request.user.role == UserRole.ADMIN or request.user.is_superuser)
        )

class IsDoctorRole(permissions.BasePermission):
    """Allows access only to users with the DOCTOR role."""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == UserRole.DOCTOR)

class IsPatientRole(permissions.BasePermission):
    """Allows access only to users with the PATIENT role."""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == UserRole.PATIENT)

class IsReceptionistRole(permissions.BasePermission):
    """Allows access only to users with the RECEPTIONIST role."""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == UserRole.RECEPTIONIST)

class IsLabTechnicianRole(permissions.BasePermission):
    """Allows access only to users with the LAB_TECHNICIAN role."""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == UserRole.LAB_TECHNICIAN)

class IsBillingStaffRole(permissions.BasePermission):
    """Allows access only to users with the BILLING_STAFF role."""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == UserRole.BILLING_STAFF)

class IsClinicalStaff(permissions.BasePermission):
    """Allows access to Doctors and Lab Technicians."""
    def has_permission(self, request, view):
        return bool(
            request.user and request.user.is_authenticated and
            request.user.role in [UserRole.DOCTOR, UserRole.LAB_TECHNICIAN]
        )

class IsStaffRole(permissions.BasePermission):
    """Allows access to any hospital staff (Admin, Doctor, Receptionist, Lab Tech, Billing)."""
    def has_permission(self, request, view):
        return bool(
            request.user and request.user.is_authenticated and
            request.user.role in [
                UserRole.ADMIN,
                UserRole.DOCTOR,
                UserRole.RECEPTIONIST,
                UserRole.LAB_TECHNICIAN,
                UserRole.BILLING_STAFF
            ]
        )

class IsOwnerOrStaff(permissions.BasePermission):
    """
    Object-level permission: allows patient to view their own object,
    or hospital staff to access it.
    """
    def has_object_permission(self, request, view, obj):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.role != UserRole.PATIENT:
            return True
        # For patient, check if object belongs to patient
        if hasattr(obj, 'patient') and hasattr(obj.patient, 'user'):
            return obj.patient.user == request.user
        if hasattr(obj, 'user'):
            return obj.user == request.user
        return False
