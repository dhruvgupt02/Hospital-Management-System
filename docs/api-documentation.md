# MediCare — REST API Specification

This document details the MediCare REST API endpoints built with Django REST Framework, JWT authentication, and OpenAPI 3.0 schema generation (`drf-spectacular`).

Interactive OpenAPI documentation is available when running the backend:
- **Swagger UI**: `http://localhost:8000/api/docs/`
- **ReDoc**: `http://localhost:8000/api/redoc/`
- **Raw OpenAPI Schema**: `http://localhost:8000/api/schema/`

---

## 1. Authentication Endpoints (`/api/auth/`)

| Method | Endpoint | Description | Permissions |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/login/` | Authenticate user & issue JWT pair (`access`, `refresh`, `user`) | AllowAny |
| `POST` | `/api/auth/register/` | Register self-service patient account | AllowAny |
| `POST` | `/api/auth/token/refresh/` | Refresh expired access token | AllowAny |
| `POST` | `/api/auth/password-reset/`| Request secure password reset | AllowAny |
| `GET` | `/api/auth/me/` | Retrieve current authenticated user profile | IsAuthenticated |
| `PATCH`| `/api/auth/me/` | Update profile information | IsAuthenticated |
| `POST` | `/api/auth/change-password/`| Change current account password | IsAuthenticated |
| `GET` | `/api/auth/users/` | List system users (filterable by role, query) | IsAdminUser |
| `PATCH`| `/api/auth/users/{id}/` | Toggle account status, update staff roles | IsAdminUser |

---

## 2. Patients Endpoints (`/api/patients/`)

| Method | Endpoint | Description | Permissions |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/patients/` | List patients (Patients only see own record; Staff see list) | IsAuthenticated |
| `POST` | `/api/patients/` | Register new patient (Staff or self) | IsAuthenticated |
| `GET` | `/api/patients/{id}/` | Retrieve patient demographic & medical summary | Authorized Role |
| `PATCH`| `/api/patients/{id}/` | Update patient demographics & emergency contacts | Authorized Role |

---

## 3. Doctors & Availability Endpoints (`/api/doctors/`)

| Method | Endpoint | Description | Permissions |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/doctors/` | List doctors, specializations, fees & bio | AllowAny |
| `POST` | `/api/doctors/` | Create doctor profile | IsAdminUser |
| `GET` | `/api/doctors/{id}/` | Retrieve doctor details & active weekly slots | AllowAny |
| `GET` | `/api/doctors/{id}/availability/` | Check available slots for target date | AllowAny |
| `POST` | `/api/doctors/availability/` | Add recurring availability window | Doctor / Admin |

---

## 4. Appointments & Conflict Detection (`/api/appointments/`)

| Method | Endpoint | Description | Permissions |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/appointments/` | List appointments (Filtered by role) | IsAuthenticated |
| `POST` | `/api/appointments/` | Book new appointment (Enforces GiST exclusion constraint) | Patient / Recept. / Admin |
| `GET` | `/api/appointments/{id}/` | Retrieve appointment details | Authorized Role |
| `POST` | `/api/appointments/{id}/cancel/`| Cancel appointment with mandatory reason | Patient / Recept. / Admin |
| `POST` | `/api/appointments/{id}/reschedule/`| Reschedule to new time interval | Patient / Recept. / Admin |
| `PATCH`| `/api/appointments/{id}/` | Update appointment status (e.g., `Completed`) | Doctor / Staff |

> **Concurrency Response**: If a booking conflicts with an existing active appointment, the database exclusion constraint raises an integrity error, which the backend translates to:
> `HTTP 409 Conflict: {"detail": "Doctor or patient is already booked for this time interval."}`

---

## 5. Medical Records & Versioning (`/api/medical-records/`)

| Method | Endpoint | Description | Permissions |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/medical-records/` | List clinical records (Doctor/Patient scope) | Doctor / Patient |
| `POST` | `/api/medical-records/` | Create new clinical encounter record (v1) | Doctor Only |
| `GET` | `/api/medical-records/{id}/` | Retrieve record with parent/child version history | Doctor / Patient |
| `POST` | `/api/medical-records/{id}/amend/` | Create controlled amendment (v2+) with reason | Doctor Only |

---

## 6. Prescriptions (`/api/prescriptions/`)

| Method | Endpoint | Description | Permissions |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/prescriptions/` | List prescriptions & medicine items | Doctor / Patient |
| `POST` | `/api/prescriptions/` | Write prescription with nested item list | Doctor Only |
| `GET` | `/api/prescriptions/{id}/` | Retrieve full prescription details | Doctor / Patient |

---

## 7. Laboratory (`/api/lab-orders/` & `/api/lab-reports/`)

| Method | Endpoint | Description | Permissions |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/lab-orders/` | List laboratory orders | Doctor / Patient / Lab Tech |
| `POST` | `/api/lab-orders/` | Order laboratory test for patient | Doctor Only |
| `GET` | `/api/lab-reports/` | List reports & results | Authorized Role |
| `POST` | `/api/lab-reports/` | Enter test results & reference ranges | Lab Tech Only |
| `POST` | `/api/lab-reports/{id}/verify/` | Mark report as verified | Lab Tech Only |
| `POST` | `/api/lab-reports/{id}/upload/` | Upload authorized report file (PDF/Image) | Lab Tech Only |

---

## 8. Billing, Invoices & Payments (`/api/invoices/`)

| Method | Endpoint | Description | Permissions |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/invoices/` | List invoices and balance statuses | Billing / Patient |
| `POST` | `/api/invoices/` | Generate itemized invoice | Billing Staff Only |
| `GET` | `/api/invoices/{id}/` | Retrieve invoice line items and payment log | Billing / Patient |
| `POST` | `/api/invoices/{id}/payments/` | Record payment against invoice | Billing / Patient |
| `GET` | `/api/payments/` | List payment transaction logs | Billing Staff Only |

---

## 9. Insurance Policies & Claims (`/api/insurance-claims/`)

| Method | Endpoint | Description | Permissions |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/insurance-policies/` | List patient insurance policies | Billing / Patient |
| `POST` | `/api/insurance-policies/` | Register insurance policy | Billing / Patient |
| `GET` | `/api/insurance-claims/` | List claims and adjudication statuses | Billing / Patient |
| `POST` | `/api/insurance-claims/` | File claim against invoice | Billing Staff Only |
| `POST` | `/api/insurance-claims/{id}/adjudicate/`| Approve/Reject claim & settle balance | Billing Staff Only |

---

## 10. Audit & Analytics (`/api/audit-logs/` & `/api/analytics/`)

| Method | Endpoint | Description | Permissions |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/audit-logs/` | Query immutable audit records (Filtered by actor/date/entity)| Admin Only |
| `GET` | `/api/analytics/dashboard/` | Real-time aggregate metrics & charts | IsAuthenticated (Role-scoped) |
| `GET` | `/api/notifications/` | List user in-app notifications | IsAuthenticated |
| `POST` | `/api/notifications/mark-read/` | Mark notifications as read | IsAuthenticated |
