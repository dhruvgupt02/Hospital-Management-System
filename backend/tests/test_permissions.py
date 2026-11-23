import pytest
from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APIClient
from apps.accounts.models import UserRole
from apps.patients.models import Patient
from apps.doctors.models import Doctor

User = get_user_model()

@pytest.mark.django_db
class TestRolePermissions:
    @pytest.fixture
    def setup_users(self):
        patient1_user = User.objects.create_user(email='p1@medicare.local', password='Pass123!', role=UserRole.PATIENT)
        p1 = Patient.objects.create(user=patient1_user)

        patient2_user = User.objects.create_user(email='p2@medicare.local', password='Pass123!', role=UserRole.PATIENT)
        p2 = Patient.objects.create(user=patient2_user)

        doctor_user = User.objects.create_user(email='doc@medicare.local', password='Pass123!', role=UserRole.DOCTOR)
        doc = Doctor.objects.create(user=doctor_user, specialization='General', license_number='LIC-999')

        receptionist_user = User.objects.create_user(email='rec@medicare.local', password='Pass123!', role=UserRole.RECEPTIONIST)
        billing_user = User.objects.create_user(email='bill@medicare.local', password='Pass123!', role=UserRole.BILLING_STAFF)

        return {
            'p1_user': patient1_user, 'p1': p1,
            'p2_user': patient2_user, 'p2': p2,
            'doc_user': doctor_user, 'doc': doc,
            'rec_user': receptionist_user,
            'bill_user': billing_user,
        }

    def test_patient_cannot_view_another_patient(self, setup_users):
        client = APIClient()
        client.force_authenticate(user=setup_users['p1_user'])

        # Attempt to access Patient 2's profile
        url = reverse('patients-detail', kwargs={'pk': setup_users['p2'].id})
        response = client.get(url)
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_receptionist_cannot_create_medical_records(self, setup_users):
        client = APIClient()
        client.force_authenticate(user=setup_users['rec_user'])

        url = reverse('medical-records-list')
        response = client.post(url, {
            'patient': setup_users['p1'].id,
            'diagnosis': 'Unauthorized diagnosis',
            'clinical_notes': 'Notes'
        })
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_ordinary_user_cannot_access_admin_endpoints(self, setup_users):
        client = APIClient()
        client.force_authenticate(user=setup_users['p1_user'])

        url = reverse('admin-users-list')
        response = client.get(url)
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_billing_staff_cannot_create_medical_records(self, setup_users):
        client = APIClient()
        client.force_authenticate(user=setup_users['bill_user'])

        url = reverse('medical-records-list')
        response = client.post(url, {
            'patient': setup_users['p1'].id,
            'diagnosis': 'Diagnosis',
            'clinical_notes': 'Notes'
        })
        assert response.status_code == status.HTTP_403_FORBIDDEN
