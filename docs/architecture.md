# MediCare — Architecture & System Design Document

## 1. System Overview

**MediCare** is an enterprise-grade Hospital Appointment and Medical Records Management System designed to provide high-availability healthcare workflows, robust clinical record integrity, strict role-based access control, and mathematical concurrency safety for appointments and financial transactions.

The platform is designed in accordance with Microsoft Azure Data Fundamentals (DP-900) cloud principles, separating relational transactional data (OLTP), private object storage for medical artifacts, and audit telemetry.

```
                    +------------------------------------------+
                    |           React 18 + Vite Client         |
                    |  (TypeScript, Tailwind CSS, Lucide,      |
                    |   TanStack Query, Recharts, React Router)|
                    +--------------------+---------------------+
                                         | HTTPS / JSON (JWT)
                                         v
                    +--------------------+---------------------+
                    |       Django 6.1 REST Framework API      |
                    |  - Custom User & Role RBAC               |
                    |  - drf-spectacular (OpenAPI 3.0)         |
                    |  - Atomic Service Transactions           |
                    |  - Audit Trail Middleware & Interceptors |
                    +---------+--------------------+-----------+
                              |                    |
             Private Storage  |                    | Relational OLTP
             Abstraction      |                    | (SQL, btree_gist,
                              v                    |  ExclusionConstraints)
        +---------------------+----+               v
        | Document Storage Service |   +-----------+---------------+
        | - Local Protected Media  |   | PostgreSQL 18 / Azure     |
        | - Azure Blob Storage     |   | Flexible Server Database  |
        |   (SAS Private Access)   |   | - Range Exclusion (gist)  |
        +--------------------------+   | - Versioned Medical Hist. |
                                       | - Full-Text Search Vector |
                                       | - Row-Level Locking       |
                                       +---------------------------+
```

---

## 2. Layered Architecture

### A. Presentation Layer (Frontend)
- **Framework**: React 18 with TypeScript and Vite bundler.
- **Routing**: Client-side single page routing via `react-router-dom` with strict `ProtectedRoute` role guarding.
- **State Management**: TanStack Query (React Query) for server-state caching, automatic invalidation, and background synchronization.
- **Visual System**: Bespoke healthcare design system crafted with Tailwind CSS and responsive UI primitives (Cards, Badges, Modals, StatCards, LoadingSkeletons).
- **Analytics Visualization**: Recharts for dynamic visual distribution of appointments, doctor workloads, and monthly revenue trends.

### B. Application & Domain Layer (Backend)
- **Framework**: Python 3.14 with Django 6.1 and Django REST Framework.
- **Authentication**: Stateless RFC 7519 JSON Web Tokens (JWT) using `djangorestframework-simplejwt` with 60-minute access token lifespan and sliding-window token rotation.
- **Service Layer Pattern**: Business operations (such as appointment booking, medical record versioning, payment adjudication, and insurance settlement) are encapsulated in dedicated domain services (`AppointmentService`, `BillingService`, `MedicalRecordService`) rather than being buried in views or serializers.
- **Transactional Integrity**: Every critical state change (booking an appointment, writing versioned SOAP records, settling payments) executes inside atomic database transactions (`@transaction.atomic`) with row-level locking (`select_for_update()`) to prevent race conditions.
- **Auditing**: Every sensitive create, update, or delete emits an immutable `AuditLog` row tracking `actor_user_id`, `source_ip`, `action`, `entity_type`, `entity_id`, and JSON diff snapshots (`previous_values` vs `new_values`).

### C. Data Persistence Layer (Database)
- **Engine**: PostgreSQL 18.
- **Concurrency & Exclusion Constraints**: Uses PostgreSQL's `btree_gist` extension to enforce database-level `ExclusionConstraint` on doctor and patient time intervals (`tstzrange`) for active appointments (`status IN ('Scheduled', 'Confirmed')`).
- **Clinical Immutability & Temporal History**: Finalized medical records are never overwritten in place. Amendments generate child version records with explicit amendment justifications, retaining parent pointer references.
- **Decimal Precision**: All monetary calculations (invoices, tax, discounts, payments, balances) use Python `Decimal` and PostgreSQL `DecimalField(max_digits=10, decimal_places=2)` to prevent IEEE 754 floating-point inaccuracies.

---

## 3. Role-Based Access Control (RBAC) Matrix

| Feature / Domain | Patient | Doctor | Receptionist | Lab Tech | Billing Staff | Administrator |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Authentication & Profile** | Own profile | Own profile | Own profile | Own profile | Own profile | Manage all users |
| **Doctor Directory** | Read only | Read all | Read all | Read all | Read all | Full CRUD |
| **Appointments** | Book / Cancel Own | View Assigned | Book / Reschedule / Cancel | Read only | Read only | View All & Metrics |
| **Medical Records (SOAP)** | View Own Authorized | Create & Amend Assigned | **No Access** | **No Access** | **No Access** | View Audit Summary Only |
| **Prescriptions** | View Own | Create & Amend Assigned | **No Access** | **No Access** | **No Access** | Read only |
| **Laboratory Orders** | View Own Reports | Order Tests & Review | View Orders | Process & Upload Reports | **No Access** | Read only |
| **Invoices & Billing** | Pay / View Own | **No Access** | **No Access** | **No Access** | Full CRUD & Payments | System financial stats |
| **Insurance Claims** | View Own Claims | **No Access** | **No Access** | **No Access** | File & Adjudicate Claims | Audit claim states |
| **Audit Logs** | **No Access** | **No Access** | **No Access** | **No Access** | **No Access** | Full Read & Inspection |
