# MediCare — Hospital Appointment & Medical Records Management System

MediCare is a full-stack, enterprise-grade healthcare management platform built with **Python 3 / Django REST Framework**, **PostgreSQL 18**, and **React 18 / TypeScript**.

The system demonstrates essential Relational Database Management System (RDBMS) concepts—including **PostgreSQL GiST range exclusion constraints for conflict prevention**, **temporal medical record versioning**, **atomic financial transactions with row-level locking**, **immutable audit trails**, and **declarative table partitioning**. The cloud architecture is designed in alignment with Microsoft's **DP-900 Azure Data Fundamentals** framework.

---

## 1. Key Features & Architectural Highlights

### Strict Concurrency & Appointment Collision Prevention
- Prevents double-booking at the database engine level using PostgreSQL range types (`tstzrange`) and the `btree_gist` extension:
  ```sql
  EXCLUDE USING gist (
      doctor_id WITH =,
      tstzrange(appointment_start, appointment_end, '[)') WITH &&
  ) WHERE (status IN ('Scheduled', 'Confirmed'));
  ```
- The half-open interval `[)` ensures back-to-back appointments (e.g., 09:00–09:30 and 09:30–10:00) succeed while any overlapping interval raises an integrity error, mapped by DRF to `HTTP 409 Conflict`.

### Temporal Clinical Record History (SOAP Notes)
- Finalized medical records are immutable. When a doctor updates a diagnosis or clinical note, the system retains the prior version (`version_number=1`), creates a new version (`version_number=2`), sets `is_latest=True`, and records the doctor's explicit `amendment_reason`.
- Full auditability distinguishes between encounter time (`recorded_at`), database ingestion time (`created_at`), and subsequent amendments (`updated_at`).

### Decimal Billing & Concurrency-Safe Payments
- Server-side monetary arithmetic using `DecimalField(10, 2)` eliminates floating-point rounding inaccuracies.
- Payments use transactional row-level locking (`select_for_update()`), ensuring that concurrent payments against the same invoice correctly compute balances without race conditions.

### Comprehensive Six-Role RBAC
- **Administrator**: User provisioning, role management, doctor credentials, and immutable audit inspection.
- **Doctor**: Clinical schedules, SOAP notes, controlled amendments, multi-item prescriptions, and lab orders.
- **Patient**: Self-service booking, cancellation, medical history, lab report downloads, and simulated bill pay.
- **Receptionist**: Patient directory, admission registration, doctor schedule calendar, booking, and rescheduling.
- **Laboratory Technician**: Test order queue, results entry with reference ranges, PDF report uploads, and verification.
- **Billing Staff**: Itemized invoice creation, payment recording, insurance claim submission, and balance tracking.

---

## 2. Technology Stack

| Domain | Technologies |
| :--- | :--- |
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, Lucide React, Recharts, TanStack Query, React Router |
| **Backend** | Python 3.12+, Django 6.1, Django REST Framework, SimpleJWT, django-filter, drf-spectacular |
| **Database** | PostgreSQL 18, `btree_gist` extension, Range Types, GIN Full-Text Indexes, Declarative Partitioning |
| **Cloud (DP-900)**| Azure Database for PostgreSQL Flexible Server, Azure Blob Storage, Azure Key Vault, App Insights |
| **DevOps & QA** | Docker, Docker Compose, Pytest, Pytest-Django, Vitest, Nginx |

---

## 3. Quick Start — Local Development Setup

### Prerequisites
- Python 3.12+ (or 3.14+)
- Node.js 18+ and npm
- PostgreSQL 16+ or 18 (with `btree_gist` extension available)

### Step 1: Database Setup
Connect to PostgreSQL and create the database:
```sql
CREATE DATABASE medicare_db;
-- btree_gist extension is automatically enabled by Django migration 0001_initial
```

### Step 2: Backend Setup
```bash
# From workspace root
cd backend

# Create and activate virtual environment
python -m venv ../venv
..\venv\Scripts\activate      # On Windows
# source ../venv/bin/activate  # On Linux/macOS

# Install dependencies
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Seed synthetic database (10 patients, 5 doctors, schedules, records, invoices)
python manage.py seed_data

# Start backend server
python manage.py runserver 127.0.0.1:8000
```

### Step 3: Frontend Setup
```bash
# Open a new terminal in workspace root
cd frontend

# Install npm packages
npm install

# Start Vite dev server
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 4. Quick Start — Docker Compose Setup

Run the full stack (PostgreSQL + Django API + React/Nginx) with a single command:

```bash
docker compose up --build
```
- **Frontend App**: [http://localhost:5173](http://localhost:5173) (or [http://localhost](http://localhost))
- **Backend API**: [http://localhost:8000/api/](http://localhost:8000/api/)
- **Interactive Swagger Docs**: [http://localhost:8000/api/docs/](http://localhost:8000/api/docs/)

---

## 5. Seed Accounts & One-Click Demo Logins

The application includes synthetic test accounts for all six roles. The login page features **Quick Demo Login buttons** to sign in instantly with any role.

| Role | Email | Password |
| :--- | :--- | :--- |
| **Administrator** | `admin@medicare.local` | `Password123!` |
| **Doctor** (Cardiology) | `sarah.jenkins@medicare.local` | `Password123!` |
| **Patient** | `john.doe@medicare.local` | `Password123!` |
| **Receptionist** | `rachel.green@medicare.local` | `Password123!` |
| **Laboratory Technician** | `kevin.patel@medicare.local` | `Password123!` |
| **Billing Staff** | `brian.hall@medicare.local` | `Password123!` |

### Creating a New Administrator Account
To create an administrative user manually via the CLI:
```bash
python manage.py create_admin --email admin2@hospital.org --password MySecurePass123! --first-name Admin --last-name User
```

---

## 6. Automated Testing

The backend includes a comprehensive test suite covering authentication, permissions, appointment range conflict rejection, back-to-back booking, billing arithmetic, and laboratory verification.

```bash
# Run test suite
python -m pytest -v backend/tests
```

**Test Results Summary**:
```text
backend/tests/test_appointments.py::TestAppointments::test_successful_booking PASSED
backend/tests/test_appointments.py::TestAppointments::test_conflicting_appointment_rejection PASSED
backend/tests/test_appointments.py::TestAppointments::test_back_to_back_appointments_allowed PASSED
backend/tests/test_appointments.py::TestAppointments::test_cancellation PASSED
backend/tests/test_auth.py::TestAuthentication::test_valid_login PASSED
backend/tests/test_auth.py::TestAuthentication::test_invalid_credentials PASSED
backend/tests/test_auth.py::TestAuthentication::test_inactive_account PASSED
backend/tests/test_auth.py::TestAuthentication::test_unauthorized_access PASSED
backend/tests/test_auth.py::TestAuthentication::test_registration PASSED
backend/tests/test_billing.py::TestBilling::test_invoice_creation_and_server_side_totals PASSED
backend/tests/test_billing.py::TestBilling::test_multiple_payments_and_balance_tracking PASSED
backend/tests/test_billing.py::TestBilling::test_overpayment_rejection PASSED
backend/tests/test_billing.py::TestBilling::test_duplicate_transaction_prevention PASSED
backend/tests/test_laboratory.py::TestLaboratory::test_report_creation_and_order_completion PASSED
backend/tests/test_laboratory.py::TestLaboratory::test_report_verification PASSED
backend/tests/test_medical_records.py::TestMedicalRecords::test_record_creation PASSED
backend/tests/test_medical_records.py::TestMedicalRecords::test_record_amendment_and_version_preservation PASSED
backend/tests/test_permissions.py::TestRolePermissions::test_patient_cannot_view_another_patient PASSED
backend/tests/test_permissions.py::TestRolePermissions::test_receptionist_cannot_create_medical_records PASSED
backend/tests/test_permissions.py::TestRolePermissions::test_ordinary_user_cannot_access_admin_endpoints PASSED
backend/tests/test_permissions.py::TestRolePermissions::test_billing_staff_cannot_create_medical_records PASSED

============================= 21 passed in 29.63s =============================
```

To verify the frontend build:
```bash
cd frontend
npm run build
# Built in 3.62s with zero TypeScript errors
```

---

## 7. Project Documentation Index

Detailed architectural and technical documents are located in the `docs/` directory:

- [System Architecture & System Design](file:///c:/Users/Asus/OneDrive/Desktop/RDBMS-Project/docs/architecture.md)
- [Relational Database Schema](file:///c:/Users/Asus/OneDrive/Desktop/RDBMS-Project/docs/database-schema.md)
- [Entity-Relationship Diagram](file:///c:/Users/Asus/OneDrive/Desktop/RDBMS-Project/docs/er-diagram.md)
- [PostgreSQL Table Partitioning Strategy](file:///c:/Users/Asus/OneDrive/Desktop/RDBMS-Project/docs/partitioning.md)
- [Cloud Security & Data Protection](file:///c:/Users/Asus/OneDrive/Desktop/RDBMS-Project/docs/security.md)
- [Microsoft Azure & DP-900 Integration Guide](file:///c:/Users/Asus/OneDrive/Desktop/RDBMS-Project/docs/azure-deployment.md)
- [REST API Specification](file:///c:/Users/Asus/OneDrive/Desktop/RDBMS-Project/docs/api-documentation.md)
