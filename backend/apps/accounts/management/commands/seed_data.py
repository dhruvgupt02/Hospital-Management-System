import uuid
from decimal import Decimal
from datetime import date, time, timedelta, datetime
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone
from apps.accounts.models import UserRole
from apps.patients.models import Patient, GenderChoices
from apps.doctors.models import Doctor, DoctorAvailability
from apps.appointments.models import Appointment, AppointmentStatus
from apps.medical_records.models import MedicalRecord
from apps.prescriptions.models import Prescription, PrescriptionItem, PrescriptionStatus
from apps.laboratory.models import (
    LaboratoryOrder,
    LaboratoryReport,
    LabOrderStatus,
    LabVerificationStatus,
)
from apps.billing.models import (
    Invoice,
    InvoiceItem,
    Payment,
    InvoiceStatus,
    PaymentMethod,
    PaymentStatus,
)
from apps.insurance.models import InsurancePolicy, InsuranceClaim, ClaimStatus, PolicyStatus
from apps.notifications.models import Notification, NotificationType
from apps.audit.models import AuditLog, AuditAction

User = get_user_model()

DEFAULT_PASSWORD = "Password123!"

class Command(BaseCommand):
    help = 'Seeds synthetic test data safely and idempotently for MediCare development.'

    def handle(self, *args, **options):
        self.stdout.write("Beginning MediCare synthetic database seeding...")

        # 1. Admin Account
        admin_user, _ = User.objects.get_or_create(
            email='admin@medicare.local',
            defaults={
                'first_name': 'System',
                'last_name': 'Admin',
                'role': UserRole.ADMIN,
                'is_staff': True,
                'is_superuser': True,
                'is_active': True,
            }
        )
        admin_user.set_password(DEFAULT_PASSWORD)
        admin_user.save()

        # 2. Receptionists
        receptionists_data = [
            ('rachel.green@medicare.local', 'Rachel', 'Green'),
            ('mark.vance@medicare.local', 'Mark', 'Vance'),
        ]
        receptionists = []
        for email, fn, ln in receptionists_data:
            u, _ = User.objects.get_or_create(
                email=email,
                defaults={
                    'first_name': fn,
                    'last_name': ln,
                    'role': UserRole.RECEPTIONIST,
                    'is_active': True,
                }
            )
            u.set_password(DEFAULT_PASSWORD)
            u.save()
            receptionists.append(u)

        # 3. Lab Technicians
        lab_data = [
            ('kevin.patel@medicare.local', 'Kevin', 'Patel'),
            ('laura.bailey@medicare.local', 'Laura', 'Bailey'),
        ]
        lab_techs = []
        for email, fn, ln in lab_data:
            u, _ = User.objects.get_or_create(
                email=email,
                defaults={
                    'first_name': fn,
                    'last_name': ln,
                    'role': UserRole.LAB_TECHNICIAN,
                    'is_active': True,
                }
            )
            u.set_password(DEFAULT_PASSWORD)
            u.save()
            lab_techs.append(u)

        # 4. Billing Staff
        billing_data = [
            ('brian.hall@medicare.local', 'Brian', 'Hall'),
            ('chloe.bennett@medicare.local', 'Chloe', 'Bennett'),
        ]
        billing_staff = []
        for email, fn, ln in billing_data:
            u, _ = User.objects.get_or_create(
                email=email,
                defaults={
                    'first_name': fn,
                    'last_name': ln,
                    'role': UserRole.BILLING_STAFF,
                    'is_active': True,
                }
            )
            u.set_password(DEFAULT_PASSWORD)
            u.save()
            billing_staff.append(u)

        # 5. Doctors
        doctors_info = [
            ('sarah.jenkins@medicare.local', 'Sarah', 'Jenkins', 'Cardiology', 'MD-CARD-10101', Decimal('150.00'), 'Cardiologist with 14 years specializing in preventive cardiology and heart failure management.'),
            ('robert.chen@medicare.local', 'Robert', 'Chen', 'Neurology', 'MD-NEUR-20202', Decimal('180.00'), 'Board-certified Neurologist focusing on cerebrovascular disorders, headaches, and neuro-diagnostics.'),
            ('emily.rodriguez@medicare.local', 'Emily', 'Rodriguez', 'Pediatrics', 'MD-PEDI-30303', Decimal('120.00'), 'Compassionate pediatrician dedicated to child wellness, developmental milestones, and adolescent health.'),
            ('james.wilson@medicare.local', 'James', 'Wilson', 'Orthopedics', 'MD-ORTH-40404', Decimal('160.00'), 'Orthopedic surgeon specializing in sports medicine, joint replacements, and rehabilitation.'),
            ('lisa.patel@medicare.local', 'Lisa', 'Patel', 'Dermatology', 'MD-DERM-50505', Decimal('130.00'), 'Clinical dermatologist offering medical skin screenings, psoriasis care, and allergy testing.'),
        ]
        doctors = []
        for email, fn, ln, spec, lic, fee, bio in doctors_info:
            u, _ = User.objects.get_or_create(
                email=email,
                defaults={
                    'first_name': fn,
                    'last_name': ln,
                    'role': UserRole.DOCTOR,
                    'is_active': True,
                }
            )
            u.set_password(DEFAULT_PASSWORD)
            u.save()

            doc, _ = Doctor.objects.get_or_create(
                user=u,
                defaults={
                    'specialization': spec,
                    'license_number': lic,
                    'consultation_fee': fee,
                    'biography': bio,
                    'availability_status': True
                }
            )
            # Add availability for Monday through Friday (09:00-13:00, 14:00-18:00)
            for day in range(5):
                DoctorAvailability.objects.get_or_create(
                    doctor=doc,
                    weekday=day,
                    start_time=time(9, 0),
                    end_time=time(13, 0),
                    defaults={'is_active': True}
                )
                DoctorAvailability.objects.get_or_create(
                    doctor=doc,
                    weekday=day,
                    start_time=time(14, 0),
                    end_time=time(18, 0),
                    defaults={'is_active': True}
                )
            doctors.append(doc)

        # 6. Patients (10 Patients)
        patients_info = [
            ('john.doe@medicare.local', 'Johnathan', 'Doe', date(1985, 4, 12), GenderChoices.MALE, '+1-555-0101', '742 Evergreen Terrace, Springfield', 'Mary Doe (+1-555-0102)', 'O+', 'Penicillin'),
            ('jane.smith@medicare.local', 'Jane', 'Smith', date(1990, 8, 23), GenderChoices.FEMALE, '+1-555-0201', '124 Conch Street, Bikini Bottom', 'Peter Smith (+1-555-0202)', 'A+', 'None'),
            ('alice.johnson@medicare.local', 'Alice', 'Johnson', date(1978, 11, 5), GenderChoices.FEMALE, '+1-555-0301', '221B Baker Street, London', 'Robert Johnson (+1-555-0302)', 'B+', 'Sulfa drugs'),
            ('michael.brown@medicare.local', 'Michael', 'Brown', date(1995, 2, 17), GenderChoices.MALE, '+1-555-0401', '4 Privet Drive, Little Whinging', 'Sandra Brown (+1-555-0402)', 'AB+', 'Latex'),
            ('david.miller@medicare.local', 'David', 'Miller', date(1968, 6, 30), GenderChoices.MALE, '+1-555-0501', '31 Spooner Street, Quahog', 'Patricia Miller (+1-555-0502)', 'O-', 'Aspirin'),
            ('emma.davis@medicare.local', 'Emma', 'Davis', date(2001, 9, 14), GenderChoices.FEMALE, '+1-555-0601', '744 Elm Street, Springwood', 'George Davis (+1-555-0602)', 'A-', 'Peanuts'),
            ('oliver.garcia@medicare.local', 'Oliver', 'Garcia', date(1982, 12, 1), GenderChoices.MALE, '+1-555-0701', '1313 Mockingbird Lane, Mockingbird Heights', 'Elena Garcia (+1-555-0702)', 'B-', 'None'),
            ('sophia.martinez@medicare.local', 'Sophia', 'Martinez', date(1992, 7, 19), GenderChoices.FEMALE, '+1-555-0801', '1048 Ocean Avenue, Santa Monica', 'Carlos Martinez (+1-555-0802)', 'O+', 'Iodine'),
            ('lucas.anderson@medicare.local', 'Lucas', 'Anderson', date(1989, 3, 8), GenderChoices.MALE, '+1-555-0901', '404 West 43rd Street, New York', 'Hannah Anderson (+1-555-0902)', 'A+', 'None'),
            ('mia.taylor@medicare.local', 'Mia', 'Taylor', date(1998, 10, 25), GenderChoices.FEMALE, '+1-555-1001', '888 Grand Avenue, Chicago', 'William Taylor (+1-555-1002)', 'AB-', 'Codeine'),
        ]
        patients = []
        for email, fn, ln, dob, gen, phone, addr, emerg, bg, allergies in patients_info:
            u, _ = User.objects.get_or_create(
                email=email,
                defaults={
                    'first_name': fn,
                    'last_name': ln,
                    'role': UserRole.PATIENT,
                    'is_active': True,
                }
            )
            u.set_password(DEFAULT_PASSWORD)
            u.save()

            p, _ = Patient.objects.get_or_create(
                user=u,
                defaults={
                    'date_of_birth': dob,
                    'gender': gen,
                    'phone': phone,
                    'address': addr,
                    'emergency_contact': emerg,
                    'blood_group': bg,
                    'allergies': allergies,
                }
            )
            patients.append(p)

        # 7. Insurance Policies
        insurers = [
            ('BlueCross BlueShield', 'BCBS-987654321', 'Comprehensive PPO. $20 co-pay, 80% coverage.'),
            ('Aetna Health', 'AET-456789123', 'Open Access HMO. Full preventive, 85% specialist co-insurance.'),
            ('Cigna Healthcare', 'CIG-321654987', 'High Deductible Plan with HSA. 75% diagnostic coverage.'),
        ]
        policies = []
        for i, patient in enumerate(patients[:6]):
            ins_name, pol_num, cov_det = insurers[i % len(insurers)]
            pol, _ = InsurancePolicy.objects.get_or_create(
                patient=patient,
                policy_number=f"{pol_num}-{patient.id}",
                defaults={
                    'insurer_name': ins_name,
                    'coverage_details': cov_det,
                    'valid_from': date(2026, 1, 1),
                    'valid_until': date(2027, 12, 31),
                    'status': PolicyStatus.ACTIVE
                }
            )
            policies.append(pol)

        # 8. Appointments, Medical Records, Prescriptions, Lab Orders, Invoices
        now = timezone.now()

        # A. Past Completed Appointment 1 (John Doe with Dr. Sarah Jenkins)
        p1 = patients[0]
        d1 = doctors[0]
        start1 = now - timedelta(days=5, hours=3)
        end1 = start1 + timedelta(minutes=45)

        appt1, _ = Appointment.objects.get_or_create(
            patient=p1,
            doctor=d1,
            appointment_start=start1,
            defaults={
                'appointment_end': end1,
                'status': AppointmentStatus.COMPLETED,
                'reason': 'Routine cardiac wellness check and mild exertional shortness of breath.',
                'created_by': p1.user
            }
        )

        # Medical Record for Appt 1
        rec1, rec1_created = MedicalRecord.objects.get_or_create(
            patient=p1,
            doctor=d1,
            appointment=appt1,
            defaults={
                'diagnosis': 'Essential Hypertension and Sinus Tachycardia',
                'clinical_notes': 'S: 41yo male presents with occasional palpitations after exertion. No chest pressure. O: BP 142/92 mmHg, HR 88 bpm regular. Heart sounds S1/S2 normal without murmurs. A: Moderate essential hypertension. P: Recommend dietary sodium restriction, initiation of Lisinopril, and baseline lipid panel.',
                'treatment_plan': '1. Low-sodium Mediterranean diet. 2. 30 minutes daily aerobic exercise. 3. Lisinopril 10mg daily.',
                'recorded_at': start1,
                'version_number': 1,
                'is_latest': False, # Will be amended to demonstrate temporal versioning!
            }
        )

        # Amended version of Medical Record 1 (demonstrating version 2)
        rec1_v2, _ = MedicalRecord.objects.get_or_create(
            parent_record=rec1,
            version_number=2,
            defaults={
                'patient': p1,
                'doctor': d1,
                'appointment': appt1,
                'diagnosis': 'Stage 1 Essential Hypertension with mild hyperlipidemia',
                'clinical_notes': 'Amended after laboratory findings received: Lipid panel shows borderline LDL (138 mg/dL). Added Atorvastatin recommendation and confirmed normal renal function.',
                'treatment_plan': '1. Lisinopril 10mg PO QD. 2. Atorvastatin 20mg PO QHS. 3. Recheck blood pressure and lipid profile in 8 weeks.',
                'recorded_at': start1,
                'is_latest': True,
                'amendment_reason': 'Integrated follow-up lipid laboratory findings and adjusted pharmacotherapy.'
            }
        )

        # Prescription for Appt 1
        rx1, _ = Prescription.objects.get_or_create(
            medical_record=rec1_v2,
            patient=p1,
            doctor=d1,
            defaults={
                'instructions': 'Take medication regularly at the same time each morning. Monitor BP twice weekly.',
                'status': PrescriptionStatus.ACTIVE,
                'prescribed_at': start1
            }
        )
        PrescriptionItem.objects.get_or_create(
            prescription=rx1,
            medicine_name='Lisinopril',
            defaults={
                'dosage': '10 mg',
                'frequency': 'Once daily in the morning',
                'duration': '30 days',
                'quantity': 30,
                'additional_instructions': 'Take with full glass of water. Report persistent dry cough.'
            }
        )
        PrescriptionItem.objects.get_or_create(
            prescription=rx1,
            medicine_name='Atorvastatin',
            defaults={
                'dosage': '20 mg',
                'frequency': 'Once daily at bedtime',
                'duration': '30 days',
                'quantity': 30,
                'additional_instructions': 'Avoid grapefruit juice during therapy.'
            }
        )

        # Laboratory Order & Report for Appt 1
        lab_order1, _ = LaboratoryOrder.objects.get_or_create(
            patient=p1,
            ordered_by=d1,
            medical_record=rec1_v2,
            test_name='Comprehensive Lipid Profile',
            defaults={
                'clinical_notes': 'Evaluate cardiac risk markers and baseline cholesterol fractions.',
                'status': LabOrderStatus.COMPLETED
            }
        )
        LaboratoryReport.objects.get_or_create(
            laboratory_order=lab_order1,
            defaults={
                'result': 'Total Cholesterol: 215 mg/dL; Triglycerides: 160 mg/dL; HDL: 45 mg/dL; LDL: 138 mg/dL',
                'unit': 'mg/dL',
                'reference_range': 'Total < 200, LDL < 100, HDL > 40',
                'verified_by': lab_techs[0],
                'verification_status': LabVerificationStatus.VERIFIED,
                'version_number': 1
            }
        )

        # Invoice and Paid Payment for Appt 1
        inv1, inv1_created = Invoice.objects.get_or_create(
            patient=p1,
            appointment=appt1,
            defaults={
                'subtotal': Decimal('180.00'),
                'tax_amount': Decimal('0.00'),
                'discount_amount': Decimal('0.00'),
                'total_amount': Decimal('180.00'),
                'amount_paid': Decimal('180.00'),
                'status': InvoiceStatus.PAID,
                'due_date': (now + timedelta(days=25)).date()
            }
        )
        if inv1_created or not inv1.payments.exists():
            InvoiceItem.objects.get_or_create(invoice=inv1, description='Specialist Consultation - Cardiology', defaults={'quantity': 1, 'unit_price': Decimal('150.00'), 'line_total': Decimal('150.00')})
            InvoiceItem.objects.get_or_create(invoice=inv1, description='Electrocardiogram (12-Lead ECG)', defaults={'quantity': 1, 'unit_price': Decimal('30.00'), 'line_total': Decimal('30.00')})
            Payment.objects.get_or_create(
                transaction_reference='TXN-SIM-7890124',
                defaults={
                    'invoice': inv1,
                    'amount': Decimal('180.00'),
                    'payment_method': PaymentMethod.CREDIT_CARD,
                    'status': PaymentStatus.SUCCESS,
                    'notes': 'Simulated card payment settled at checkout.'
                }
            )

        # B. Past Completed Appointment 2 (Jane Smith with Dr. Robert Chen)
        p2 = patients[1]
        d2 = doctors[1]
        start2 = now - timedelta(days=2, hours=4)
        end2 = start2 + timedelta(minutes=30)
        appt2, _ = Appointment.objects.get_or_create(
            patient=p2,
            doctor=d2,
            appointment_start=start2,
            defaults={
                'appointment_end': end2,
                'status': AppointmentStatus.COMPLETED,
                'reason': 'Chronic migraine evaluation with visual auras.',
                'created_by': p2.user
            }
        )
        rec2, _ = MedicalRecord.objects.get_or_create(
            patient=p2,
            doctor=d2,
            appointment=appt2,
            defaults={
                'diagnosis': 'Migraine with Aura, Intractable without Status Migrainosus',
                'clinical_notes': 'Patient reports 3-4 severe hemicranial throbbing headache episodes per month preceded by scintillating scotoma. Neurological exam cranial nerves II-XII intact, no focal deficits.',
                'treatment_plan': '1. Sumatriptan 50mg PO at onset of aura. 2. Magnesium glycinate 400mg daily. 3. Sleep hygiene and trigger diary.',
                'recorded_at': start2,
                'version_number': 1,
                'is_latest': True
            }
        )
        rx2, _ = Prescription.objects.get_or_create(
            medical_record=rec2,
            patient=p2,
            doctor=d2,
            defaults={
                'instructions': 'Take at earliest warning sign of migraine. Do not exceed 200mg in 24 hours.',
                'status': PrescriptionStatus.ACTIVE,
                'prescribed_at': start2
            }
        )
        PrescriptionItem.objects.get_or_create(
            prescription=rx2,
            medicine_name='Sumatriptan Succinate',
            defaults={
                'dosage': '50 mg',
                'frequency': 'As needed for acute attack',
                'duration': 'As needed',
                'quantity': 9,
                'additional_instructions': 'May repeat once after 2 hours if headache recurs.'
            }
        )

        # Unpaid Invoice for Appt 2
        inv2, inv2_created = Invoice.objects.get_or_create(
            patient=p2,
            appointment=appt2,
            defaults={
                'subtotal': Decimal('180.00'),
                'tax_amount': Decimal('0.00'),
                'discount_amount': Decimal('20.00'),
                'total_amount': Decimal('160.00'),
                'amount_paid': Decimal('0.00'),
                'status': InvoiceStatus.UNPAID,
                'due_date': (now + timedelta(days=14)).date()
            }
        )
        if inv2_created or not inv2.items.exists():
            InvoiceItem.objects.get_or_create(invoice=inv2, description='Neurological Diagnostic Consultation', defaults={'quantity': 1, 'unit_price': Decimal('180.00'), 'line_total': Decimal('180.00')})

        # Submit insurance claim for Invoice 2 if not already submitted
        if len(policies) > 1 and not inv2.insurance_claims.exists():
            InsuranceClaim.objects.create(
                invoice=inv2,
                insurance_policy=policies[1],
                claim_amount=Decimal('160.00'),
                approved_amount=Decimal('0.00'),
                status=ClaimStatus.SUBMITTED,
                adjudication_notes='Awaiting primary payer clearinghouse adjudication.'
            )

        # C. Today's Appointments (Scheduled & Confirmed)
        today = now.date()
        # Appointment 3: Alice Johnson with Dr. Emily Rodriguez today at 10:00
        p3 = patients[2]
        d3 = doctors[2]
        start3 = timezone.make_aware(datetime.combine(today, time(10, 0)))
        end3 = start3 + timedelta(minutes=30)
        Appointment.objects.get_or_create(
            doctor=d3,
            appointment_start=start3,
            defaults={
                'patient': p3,
                'appointment_end': end3,
                'status': AppointmentStatus.CONFIRMED,
                'reason': 'Pediatric annual physical examination and immunization check.',
                'created_by': receptionists[0]
            }
        )

        # Appointment 4: Michael Brown with Dr. James Wilson today at 11:30
        p4 = patients[3]
        d4 = doctors[3]
        start4 = timezone.make_aware(datetime.combine(today, time(11, 30)))
        end4 = start4 + timedelta(minutes=30)
        Appointment.objects.get_or_create(
            doctor=d4,
            appointment_start=start4,
            defaults={
                'patient': p4,
                'appointment_end': end4,
                'status': AppointmentStatus.SCHEDULED,
                'reason': 'Right knee sprain rehabilitation review.',
                'created_by': p4.user
            }
        )

        # D. Upcoming Appointments
        p5 = patients[4]
        d5 = doctors[4]
        start5 = timezone.make_aware(datetime.combine(today + timedelta(days=2), time(14, 0)))
        end5 = start5 + timedelta(minutes=30)
        Appointment.objects.get_or_create(
            doctor=d5,
            appointment_start=start5,
            defaults={
                'patient': p5,
                'appointment_end': end5,
                'status': AppointmentStatus.SCHEDULED,
                'reason': 'Dermatological screening for suspicious mole.',
                'created_by': p5.user
            }
        )

        # E. Cancelled Appointment
        start_canc = timezone.make_aware(datetime.combine(today + timedelta(days=3), time(9, 30)))
        end_canc = start_canc + timedelta(minutes=30)
        Appointment.objects.get_or_create(
            doctor=d1,
            appointment_start=start_canc,
            defaults={
                'patient': p2,
                'appointment_end': end_canc,
                'status': AppointmentStatus.CANCELLED,
                'cancellation_reason': 'Patient had conflicting work schedule; rebooking next week.',
                'reason': 'Cardiac follow-up.',
                'created_by': p2.user
            }
        )

        # 9. In-Progress Laboratory Order
        LaboratoryOrder.objects.get_or_create(
            patient=p3,
            ordered_by=d3,
            test_name='Complete Blood Count (CBC) with Differential',
            defaults={
                'clinical_notes': 'Screen for anemia and pediatric systemic markers.',
                'status': LabOrderStatus.IN_PROGRESS
            }
        )

        # 10. Sample Notifications
        Notification.objects.get_or_create(
            user=p1.user,
            title='Prescription Updated',
            defaults={
                'message': 'Dr. Sarah Jenkins has renewed your prescription for Lisinopril and Atorvastatin.',
                'notification_type': NotificationType.PRESCRIPTION,
                'is_read': False
            }
        )
        Notification.objects.get_or_create(
            user=p1.user,
            title='Invoice Paid Successfully',
            defaults={
                'message': 'Your invoice for appointment with Dr. Sarah Jenkins has been settled in full.',
                'notification_type': NotificationType.BILLING,
                'is_read': True
            }
        )
        Notification.objects.get_or_create(
            user=d1.user,
            title='New Appointment Scheduled',
            defaults={
                'message': f'Patient Johnathan Doe has completed consultation follow-up scheduling.',
                'notification_type': NotificationType.APPOINTMENT,
                'is_read': False
            }
        )

        # 11. Initial Audit Logs
        AuditLog.log_event(
            actor=admin_user,
            action=AuditAction.CREATE,
            entity_type='System',
            entity_id='SEED',
            change_summary='Hospital seed data generation completed successfully with 10 patients, 5 doctors, appointments, lab reports, and invoices.'
        )

        self.stdout.write(self.style.SUCCESS("MediCare synthetic test database populated successfully!"))
        self.stdout.write(self.style.SUCCESS(f"Default password for all test accounts: {DEFAULT_PASSWORD}"))
        self.stdout.write(self.style.NOTICE("Test accounts ready:"))
        self.stdout.write("  Admin:        admin@medicare.local")
        self.stdout.write("  Doctor:       sarah.jenkins@medicare.local")
        self.stdout.write("  Patient:      john.doe@medicare.local")
        self.stdout.write("  Receptionist: rachel.green@medicare.local")
        self.stdout.write("  Lab Tech:     kevin.patel@medicare.local")
        self.stdout.write("  Billing:      brian.hall@medicare.local")
