import pytest
from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APIClient
from apps.accounts.models import UserRole
from apps.patients.models import Patient
from apps.doctors.models import Doctor
from apps.medical_records.models import MedicalRecord
from apps.audit.models import AuditLog, AuditAction

User = get_user_model()

@pytest.mark.django_db
class TestMedicalRecords:
    @pytest.fixture
    def setup_data(self):
        p_user = User.objects.create_user(email='med.patient@medicare.local', password='Pass123!', role=UserRole.PATIENT)
        patient = Patient.objects.create(user=p_user)

        d_user = User.objects.create_user(email='med.doctor@medicare.local', password='Pass123!', role=UserRole.DOCTOR)
        doctor = Doctor.objects.create(user=d_user, specialization='Internal Medicine', license_number='MED-123')

        client = APIClient()
        client.force_authenticate(user=d_user)

        return {
            'client': client,
            'd_user': d_user,
            'p_user': p_user,
            'doctor': doctor,
            'patient': patient,
        }

    def test_record_creation(self, setup_data):
        client = setup_data['client']
        patient = setup_data['patient']

        url = reverse('medical-records-list')
        response = client.post(url, {
            'patient': patient.id,
            'diagnosis': 'Type 2 Diabetes Mellitus',
            'clinical_notes': 'Fasting blood glucose 145 mg/dL. Microalbumin normal.',
            'treatment_plan': 'Metformin 500mg BID with meals.'
        })

        assert response.status_code == status.HTTP_201_CREATED
        record = MedicalRecord.objects.get(id=response.data['id'])
        assert record.version_number == 1
        assert record.is_latest is True
        assert record.diagnosis == 'Type 2 Diabetes Mellitus'

        # Verify audit event
        assert AuditLog.objects.filter(entity_type='MedicalRecord', entity_id=str(record.id), action=AuditAction.CREATE).exists()

    def test_record_amendment_and_version_preservation(self, setup_data):
        client = setup_data['client']
        doctor = setup_data['doctor']
        patient = setup_data['patient']

        # Initial record v1
        v1 = MedicalRecord.objects.create(
            doctor=doctor,
            patient=patient,
            diagnosis='Borderline Hypertension',
            clinical_notes='BP 138/88 mmHg. Initial observation.',
            treatment_plan='Lifestyle modification.',
            version_number=1,
            is_latest=True
        )

        # Amend to create v2
        url = reverse('medical-records-amend', kwargs={'pk': v1.id})
        response = client.post(url, {
            'diagnosis': 'Stage 1 Hypertension',
            'clinical_notes': 'Follow up BP 144/92 mmHg confirmed on ambulatory monitoring.',
            'treatment_plan': 'Initiated Amlodipine 5mg QD.',
            'amendment_reason': 'Confirmed persistent systolic elevation on 24-hr ambulatory BP report.'
        })

        assert response.status_code == status.HTTP_201_CREATED
        v2 = MedicalRecord.objects.get(id=response.data['id'])

        # Prior version v1 must be preserved and no longer latest
        v1.refresh_from_db()
        assert v1.is_latest is False
        assert v1.version_number == 1
        assert v1.diagnosis == 'Borderline Hypertension'

        # New version v2 must reference parent and have version 2
        assert v2.is_latest is True
        assert v2.version_number == 2
        assert v2.parent_record_id == v1.id
        assert v2.amendment_reason == 'Confirmed persistent systolic elevation on 24-hr ambulatory BP report.'

        # Verify audit event for amendment
        assert AuditLog.objects.filter(entity_type='MedicalRecord', entity_id=str(v2.id), action=AuditAction.RECORD_AMENDED).exists()
