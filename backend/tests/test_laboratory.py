import pytest
from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APIClient
from apps.accounts.models import UserRole
from apps.patients.models import Patient
from apps.doctors.models import Doctor
from apps.laboratory.models import (
    LaboratoryOrder,
    LaboratoryReport,
    LabOrderStatus,
    LabVerificationStatus,
)

User = get_user_model()

@pytest.mark.django_db
class TestLaboratory:
    @pytest.fixture
    def setup_lab(self):
        p_user = User.objects.create_user(email='lab.patient@medicare.local', password='Pass123!', role=UserRole.PATIENT)
        patient = Patient.objects.create(user=p_user)

        d_user = User.objects.create_user(email='lab.doctor@medicare.local', password='Pass123!', role=UserRole.DOCTOR)
        doctor = Doctor.objects.create(user=d_user, specialization='Pathology', license_number='LAB-DOC-1')

        tech_user = User.objects.create_user(email='lab.tech@medicare.local', password='Pass123!', role=UserRole.LAB_TECHNICIAN)

        order = LaboratoryOrder.objects.create(
            patient=patient,
            ordered_by=doctor,
            test_name='Renal Function Panel'
        )

        return {
            'p_user': p_user,
            'patient': patient,
            'doctor': doctor,
            'tech_user': tech_user,
            'order': order,
        }

    def test_report_creation_and_order_completion(self, setup_lab):
        client = APIClient()
        client.force_authenticate(user=setup_lab['tech_user'])
        order = setup_lab['order']

        url = reverse('lab-reports-list')
        response = client.post(url, {
            'laboratory_order': order.id,
            'result': 'Serum Creatinine: 0.9 mg/dL; BUN: 14 mg/dL; eGFR: >90',
            'unit': 'mg/dL',
            'reference_range': 'Creatinine: 0.7 - 1.3 mg/dL'
        })

        assert response.status_code == status.HTTP_201_CREATED
        order.refresh_from_db()
        assert order.status == LabOrderStatus.COMPLETED

    def test_report_verification(self, setup_lab):
        client = APIClient()
        client.force_authenticate(user=setup_lab['tech_user'])
        order = setup_lab['order']

        report = LaboratoryReport.objects.create(
            laboratory_order=order,
            result='Hemoglobin: 14.2 g/dL',
            verification_status=LabVerificationStatus.PENDING
        )

        url = reverse('lab-reports-verify', kwargs={'pk': report.id})
        response = client.post(url, {'status': LabVerificationStatus.VERIFIED})

        assert response.status_code == status.HTTP_200_OK
        report.refresh_from_db()
        assert report.verification_status == LabVerificationStatus.VERIFIED
        assert report.verified_by == setup_lab['tech_user']
