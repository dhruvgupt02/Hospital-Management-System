import pytest
from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework import status
from apps.accounts.models import UserRole

User = get_user_model()

@pytest.mark.django_db
class TestAuthentication:
    def test_valid_login(self, client):
        user = User.objects.create_user(
            email='testuser@medicare.local',
            password='SecretPassword123!',
            first_name='Test',
            last_name='User',
            role=UserRole.PATIENT
        )
        url = reverse('auth-login')
        response = client.post(url, {
            'email': 'testuser@medicare.local',
            'password': 'SecretPassword123!'
        })
        assert response.status_code == status.HTTP_200_OK
        assert 'access' in response.data
        assert 'refresh' in response.data
        assert response.data['user']['email'] == 'testuser@medicare.local'

    def test_invalid_credentials(self, client):
        User.objects.create_user(
            email='testuser@medicare.local',
            password='SecretPassword123!',
            first_name='Test',
            last_name='User'
        )
        url = reverse('auth-login')
        response = client.post(url, {
            'email': 'testuser@medicare.local',
            'password': 'WrongPassword999!'
        })
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_inactive_account(self, client):
        user = User.objects.create_user(
            email='inactive@medicare.local',
            password='SecretPassword123!',
            first_name='Inactive',
            last_name='User',
            is_active=False
        )
        url = reverse('auth-login')
        response = client.post(url, {
            'email': 'inactive@medicare.local',
            'password': 'SecretPassword123!'
        })
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_unauthorized_access(self, client):
        url = reverse('auth-current-user')
        response = client.get(url)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_registration(self, client):
        url = reverse('auth-register')
        payload = {
            'email': 'newpatient@medicare.local',
            'password': 'SecurePatientPass123!',
            'password_confirm': 'SecurePatientPass123!',
            'first_name': 'New',
            'last_name': 'Patient',
            'phone': '+1-555-9988'
        }
        response = client.post(url, payload)
        assert response.status_code == status.HTTP_201_CREATED
        assert User.objects.filter(email='newpatient@medicare.local').exists()
