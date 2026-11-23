import pytest
from datetime import datetime, timedelta
from django.urls import reverse
from django.utils import timezone
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APIClient
from apps.accounts.models import UserRole
from apps.patients.models import Patient
from apps.doctors.models import Doctor
from apps.appointments.models import Appointment, AppointmentStatus

User = get_user_model()

@pytest.mark.django_db
class TestAppointments:
    @pytest.fixture
    def setup_entities(self):
        p_user = User.objects.create_user(email='patient.test@medicare.local', password='Pass123!', role=UserRole.PATIENT)
        patient = Patient.objects.create(user=p_user)

        d_user = User.objects.create_user(email='doctor.test@medicare.local', password='Pass123!', role=UserRole.DOCTOR)
        doctor = Doctor.objects.create(user=d_user, specialization='Cardiology', license_number='TEST-LIC-1')

        client = APIClient()
        client.force_authenticate(user=p_user)

        return {
            'client': client,
            'p_user': p_user,
            'patient': patient,
            'doctor': doctor,
        }

    def test_successful_booking(self, setup_entities):
        client = setup_entities['client']
        doctor = setup_entities['doctor']
        patient = setup_entities['patient']

        start = timezone.now() + timedelta(days=1, hours=2)
        end = start + timedelta(minutes=30)

        url = reverse('appointments-list')
        response = client.post(url, {
            'patient': patient.id,
            'doctor': doctor.id,
            'appointment_start': start.isoformat(),
            'appointment_end': end.isoformat(),
            'reason': 'Routine health evaluation'
        })

        assert response.status_code == status.HTTP_201_CREATED
        assert Appointment.objects.filter(doctor=doctor, status=AppointmentStatus.SCHEDULED).exists()

    def test_conflicting_appointment_rejection(self, setup_entities):
        client = setup_entities['client']
        doctor = setup_entities['doctor']
        patient = setup_entities['patient']

        start = timezone.now() + timedelta(days=2, hours=3)
        end = start + timedelta(minutes=45)

        # First appointment
        Appointment.objects.create(
            doctor=doctor,
            patient=patient,
            appointment_start=start,
            appointment_end=end,
            status=AppointmentStatus.SCHEDULED,
            reason='Initial booking'
        )

        # Attempt overlapping booking (starts 15 minutes after the first starts)
        overlap_start = start + timedelta(minutes=15)
        overlap_end = overlap_start + timedelta(minutes=30)

        url = reverse('appointments-list')
        response = client.post(url, {
            'patient': patient.id,
            'doctor': doctor.id,
            'appointment_start': overlap_start.isoformat(),
            'appointment_end': overlap_end.isoformat(),
            'reason': 'Overlapping attempt'
        })

        # Must return HTTP 409 Conflict
        assert response.status_code == status.HTTP_409_CONFLICT

    def test_back_to_back_appointments_allowed(self, setup_entities):
        client = setup_entities['client']
        doctor = setup_entities['doctor']
        patient = setup_entities['patient']

        # Patient 2 for second booking
        p2_user = User.objects.create_user(email='p2.test@medicare.local', password='Pass123!', role=UserRole.PATIENT)
        patient2 = Patient.objects.create(user=p2_user)

        start1 = timezone.now() + timedelta(days=3, hours=1)
        end1 = start1 + timedelta(minutes=30)

        # First booking [start1, end1)
        Appointment.objects.create(
            doctor=doctor,
            patient=patient,
            appointment_start=start1,
            appointment_end=end1,
            status=AppointmentStatus.SCHEDULED,
            reason='Slot 1'
        )

        # Back to back booking starts exactly at end1: [end1, end1 + 30m)
        client.force_authenticate(user=p2_user)
        url = reverse('appointments-list')
        response = client.post(url, {
            'patient': patient2.id,
            'doctor': doctor.id,
            'appointment_start': end1.isoformat(),
            'appointment_end': (end1 + timedelta(minutes=30)).isoformat(),
            'reason': 'Back-to-back appointment'
        })

        # Half-open interval must allow exact back-to-back booking
        assert response.status_code == status.HTTP_201_CREATED

    def test_cancellation(self, setup_entities):
        client = setup_entities['client']
        doctor = setup_entities['doctor']
        patient = setup_entities['patient']

        start = timezone.now() + timedelta(days=4)
        end = start + timedelta(minutes=30)

        appt = Appointment.objects.create(
            doctor=doctor,
            patient=patient,
            appointment_start=start,
            appointment_end=end,
            status=AppointmentStatus.SCHEDULED,
            reason='Consultation'
        )

        url = reverse('appointments-cancel', kwargs={'pk': appt.id})
        response = client.post(url, {
            'cancellation_reason': 'Patient emergency came up'
        })

        assert response.status_code == status.HTTP_200_OK
        appt.refresh_from_db()
        assert appt.status == AppointmentStatus.CANCELLED
        assert appt.cancellation_reason == 'Patient emergency came up'
