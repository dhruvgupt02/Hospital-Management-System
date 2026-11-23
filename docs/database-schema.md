# MediCare — Relational Database Schema Specification

This document details the complete relational schema implemented in MediCare, demonstrating core Relational Database Management System (RDBMS) concepts: Third Normal Form (3NF) normalization, referential integrity rules, btree_gist range constraints, indexing strategies, and check constraints.

---

## 1. Table Definitions

### A. Accounts & Identity (`apps.accounts`)

#### Table: `accounts_user`
- `id` (BigAutoField, Primary Key)
- `email` (CharField(255), Unique, Indexed)
- `password` (CharField(128), Django PBKDF2-SHA256 hashed)
- `first_name` (CharField(150))
- `last_name` (CharField(150))
- `role` (CharField(30), Choices: `ADMIN`, `DOCTOR`, `PATIENT`, `RECEPTIONIST`, `LAB_TECHNICIAN`, `BILLING_STAFF`, Indexed)
- `is_active` (BooleanField, Default=True)
- `is_staff` (BooleanField, Default=False)
- `is_superuser` (BooleanField, Default=False)
- `created_at` (DateTimeField, Default=Now)
- `updated_at` (DateTimeField, Auto-now)

---

### B. Patients (`apps.patients`)

#### Table: `patients_patient`
- `id` (BigAutoField, Primary Key)
- `user_id` (ForeignKey -> `accounts_user.id`, OneToOne, OnDelete=CASCADE)
- `date_of_birth` (DateField)
- `gender` (CharField(20), Choices: `Male`, `Female`, `Other`, `Undisclosed`)
- `phone` (CharField(30), Indexed)
- `address` (TextField)
- `emergency_contact` (CharField(100))
- `blood_group` (CharField(10), Choices: `A+`, `A-`, `B+`, `B-`, `AB+`, `AB-`, `O+`, `O-`)
- `allergies` (TextField, Blank=True)
- `created_at` (DateTimeField, Default=Now)
- `updated_at` (DateTimeField, Auto-now)

---

### C. Doctors & Availability (`apps.doctors`)

#### Table: `doctors_doctor`
- `id` (BigAutoField, Primary Key)
- `user_id` (ForeignKey -> `accounts_user.id`, OneToOne, OnDelete=CASCADE)
- `specialization` (CharField(100), Indexed)
- `license_number` (CharField(50), Unique, Indexed)
- `consultation_fee` (DecimalField(10, 2), MinValue=0.00)
- `biography` (TextField)
- `availability_status` (CharField(20), Choices: `Available`, `OnLeave`, `InConsultation`, Default=`Available`)
- `created_at` (DateTimeField, Default=Now)
- `updated_at` (DateTimeField, Auto-now)

#### Table: `doctors_doctoravailability`
- `id` (BigAutoField, Primary Key)
- `doctor_id` (ForeignKey -> `doctors_doctor.id`, OnDelete=CASCADE, Indexed)
- `weekday` (SmallIntegerField, Choices: 0=Mon, 1=Tue, ..., 6=Sun)
- `start_time` (TimeField)
- `end_time` (TimeField)
- `effective_from` (DateField)
- `effective_until` (DateField, Nullable)
- `is_active` (BooleanField, Default=True)

---

### D. Appointments (`apps.appointments`)

#### Table: `appointments_appointment`
- `id` (BigAutoField, Primary Key)
- `patient_id` (ForeignKey -> `patients_patient.id`, OnDelete=PROTECT, Indexed)
- `doctor_id` (ForeignKey -> `doctors_doctor.id`, OnDelete=PROTECT, Indexed)
- `appointment_start` (DateTimeField, Indexed)
- `appointment_end` (DateTimeField, Indexed)
- `status` (CharField(20), Choices: `Scheduled`, `Confirmed`, `Completed`, `Cancelled`, `No-show`, Default=`Scheduled`, Indexed)
- `reason` (TextField)
- `cancellation_reason` (TextField, Nullable)
- `created_by_id` (ForeignKey -> `accounts_user.id`, OnDelete=SET_NULL, Nullable)
- `created_at` (DateTimeField, Default=Now)
- `updated_at` (DateTimeField, Auto-now)

**PostgreSQL Range & Exclusion Constraints**:
1. `exclude_overlapping_doctor_appointments`:
   ```sql
   EXCLUDE USING gist (
       doctor_id WITH =,
       tstzrange(appointment_start, appointment_end, '[)') WITH &&
   ) WHERE (status IN ('Scheduled', 'Confirmed'));
   ```
2. `exclude_overlapping_patient_appointments`:
   ```sql
   EXCLUDE USING gist (
       patient_id WITH =,
       tstzrange(appointment_start, appointment_end, '[)') WITH &&
   ) WHERE (status IN ('Scheduled', 'Confirmed'));
   ```

---

### E. Medical Records (`apps.medical_records`)

#### Table: `medical_records_medicalrecord`
- `id` (BigAutoField, Primary Key)
- `patient_id` (ForeignKey -> `patients_patient.id`, OnDelete=PROTECT, Indexed)
- `doctor_id` (ForeignKey -> `doctors_doctor.id`, OnDelete=PROTECT, Indexed)
- `appointment_id` (ForeignKey -> `appointments_appointment.id`, OnDelete=SET_NULL, Nullable, Indexed)
- `parent_record_id` (ForeignKey -> `medical_records_medicalrecord.id`, OnDelete=SET_NULL, Nullable)
- `version_number` (PositiveIntegerField, Default=1)
- `is_latest` (BooleanField, Default=True, Indexed)
- `amendment_reason` (TextField, Nullable)
- `diagnosis` (TextField)
- `clinical_notes` (TextField)
- `treatment_plan` (TextField, Nullable)
- `recorded_at` (DateTimeField, Encounter Clinical Date, Indexed)
- `created_at` (DateTimeField, System Ingestion Date, Default=Now)
- `updated_at` (DateTimeField, Auto-now)

---

### F. Prescriptions (`apps.prescriptions`)

#### Table: `prescriptions_prescription`
- `id` (BigAutoField, Primary Key)
- `medical_record_id` (ForeignKey -> `medical_records_medicalrecord.id`, OnDelete=PROTECT, Indexed)
- `doctor_id` (ForeignKey -> `doctors_doctor.id`, OnDelete=PROTECT, Indexed)
- `prescribed_at` (DateTimeField, Default=Now)
- `instructions` (TextField)
- `status` (CharField(20), Choices: `Active`, `Dispensed`, `Discontinued`, `Expired`, Default=`Active`)
- `created_at` (DateTimeField, Default=Now)

#### Table: `prescriptions_prescriptionitem`
- `id` (BigAutoField, Primary Key)
- `prescription_id` (ForeignKey -> `prescriptions_prescription.id`, OnDelete=CASCADE, Indexed)
- `medicine_name` (CharField(150), Indexed)
- `dosage` (CharField(50))
- `frequency` (CharField(50))
- `duration` (CharField(50))
- `quantity` (PositiveIntegerField, Default=1)
- `additional_instructions` (TextField, Blank=True)

---

### G. Laboratory (`apps.laboratory`)

#### Table: `laboratory_laboratoryorder`
- `id` (BigAutoField, Primary Key)
- `patient_id` (ForeignKey -> `patients_patient.id`, OnDelete=PROTECT, Indexed)
- `medical_record_id` (ForeignKey -> `medical_records_medicalrecord.id`, OnDelete=SET_NULL, Nullable)
- `ordered_by_id` (ForeignKey -> `doctors_doctor.id`, OnDelete=PROTECT, Indexed)
- `test_name` (CharField(150), Indexed)
- `status` (CharField(20), Choices: `Pending`, `SampleCollected`, `Processing`, `Completed`, `Cancelled`, Default=`Pending`, Indexed)
- `priority` (CharField(20), Choices: `Normal`, `Urgent`, `Emergency`, Default=`Normal`)
- `ordered_at` (DateTimeField, Default=Now)

#### Table: `laboratory_laboratoryreport`
- `id` (BigAutoField, Primary Key)
- `laboratory_order_id` (OneToOne -> `laboratory_laboratoryorder.id`, OnDelete=PROTECT)
- `result` (TextField)
- `unit` (CharField(50), Blank=True)
- `reference_range` (CharField(100), Blank=True)
- `report_file` (FileField, UploadTo=`laboratory_reports/%Y/%m/`, Blank=True, Nullable)
- `verified_by_id` (ForeignKey -> `accounts_user.id`, OnDelete=SET_NULL, Nullable)
- `verification_status` (CharField(20), Choices: `Unverified`, `Verified`, `Rejected`, Default=`Unverified`)
- `reported_at` (DateTimeField, Default=Now)
- `amendment_history` (JSONField, Default=List)

---

### H. Billing, Invoices & Payments (`apps.billing`)

#### Table: `billing_invoice`
- `id` (BigAutoField, Primary Key)
- `patient_id` (ForeignKey -> `patients_patient.id`, OnDelete=PROTECT, Indexed)
- `appointment_id` (ForeignKey -> `appointments_appointment.id`, OnDelete=SET_NULL, Nullable)
- `invoice_number` (CharField(50), Unique, Indexed)
- `subtotal` (DecimalField(10, 2), Default=0.00)
- `tax_amount` (DecimalField(10, 2), Default=0.00)
- `discount_amount` (DecimalField(10, 2), Default=0.00)
- `total_amount` (DecimalField(10, 2), Default=0.00)
- `amount_paid` (DecimalField(10, 2), Default=0.00)
- `status` (CharField(20), Choices: `Draft`, `Unpaid`, `PartiallyPaid`, `Paid`, `Cancelled`, Default=`Unpaid`, Indexed)
- `due_date` (DateField)
- `created_at` (DateTimeField, Default=Now)

#### Table: `billing_invoiceitem`
- `id` (BigAutoField, Primary Key)
- `invoice_id` (ForeignKey -> `billing_invoice.id`, OnDelete=CASCADE, Indexed)
- `description` (CharField(255))
- `quantity` (PositiveIntegerField, Default=1)
- `unit_price` (DecimalField(10, 2))
- `line_total` (DecimalField(10, 2))

#### Table: `billing_payment`
- `id` (BigAutoField, Primary Key)
- `invoice_id` (ForeignKey -> `billing_invoice.id`, OnDelete=PROTECT, Indexed)
- `amount` (DecimalField(10, 2), MinValue=0.01)
- `payment_method` (CharField(30), Choices: `Cash`, `CreditCard`, `DebitCard`, `BankTransfer`, `Insurance`, `Online`)
- `transaction_reference` (CharField(100), Unique, Indexed)
- `status` (CharField(20), Choices: `Pending`, `Successful`, `Failed`, `Refunded`, Default=`Successful`)
- `paid_at` (DateTimeField, Default=Now)

---

### I. Insurance Policies & Claims (`apps.insurance`)

#### Table: `insurance_insurancepolicy`
- `id` (BigAutoField, Primary Key)
- `patient_id` (ForeignKey -> `patients_patient.id`, OnDelete=CASCADE, Indexed)
- `insurer_name` (CharField(100), Indexed)
- `policy_number` (CharField(100), Unique, Indexed)
- `coverage_details` (TextField)
- `valid_from` (DateField)
- `valid_until` (DateField)
- `status` (CharField(20), Choices: `Active`, `Expired`, `Suspended`, Default=`Active`)

#### Table: `insurance_insuranceclaim`
- `id` (BigAutoField, Primary Key)
- `invoice_id` (ForeignKey -> `billing_invoice.id`, OnDelete=PROTECT, Indexed)
- `insurance_policy_id` (ForeignKey -> `insurance_insurancepolicy.id`, OnDelete=PROTECT, Indexed)
- `claim_number` (CharField(50), Unique, Indexed)
- `claim_amount` (DecimalField(10, 2))
- `approved_amount` (DecimalField(10, 2), Default=0.00)
- `status` (CharField(20), Choices: `Submitted`, `UnderReview`, `Approved`, `PartiallyApproved`, `Rejected`, Default=`Submitted`, Indexed)
- `submitted_at` (DateTimeField, Default=Now)
- `adjudicated_at` (DateTimeField, Nullable)

---

### J. Security & Audit Logging (`apps.audit`)

#### Table: `audit_auditlog`
- `id` (BigAutoField, Primary Key)
- `actor_user_id` (ForeignKey -> `accounts_user.id`, OnDelete=SET_NULL, Nullable, Indexed)
- `action` (CharField(50), Indexed)
- `entity_type` (CharField(50), Indexed)
- `entity_id` (CharField(50), Indexed)
- `timestamp` (DateTimeField, Default=Now, Indexed)
- `request_id` (CharField(64), Blank=True, Indexed)
- `source_ip` (GenericIPAddressField, Nullable)
- `change_summary` (TextField)
- `previous_values` (JSONField, Nullable)
- `new_values` (JSONField, Nullable)
