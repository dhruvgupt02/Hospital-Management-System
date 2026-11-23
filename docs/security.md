# MediCare — Cloud Security & Data Protection Specification

This document outlines the multi-layered security architecture of MediCare, addressing confidentiality, integrity, availability, least privilege, and compliance considerations.

---

## 1. Authentication & Identity Protection

### Password Hashing
- MediCare uses Django's cryptographic password hasher: **PBKDF2 with SHA-256**, utilizing 600,000+ iterations and per-user cryptographic salts. Plaintext passwords are never logged, stored, or transmitted in responses.

### Brute Force & Enumeration Prevention
- **Generic Authentication Responses**: Login attempts with incorrect passwords or non-existent emails return identical generic errors (`"Invalid email or password"`), preventing username enumeration attacks.
- **Login Throttling**: DRF `AnonRateThrottle` limits anonymous authentication attempts to 5 requests per minute per IP address.
- **Account State Checking**: Deactivated accounts (`is_active=False`) are blocked from authentication regardless of password correctness.

---

## 2. Authorization & Insecure Direct Object Reference (IDOR) Prevention

MediCare enforces authorization on the **backend application layer** within `get_queryset()` and explicit DRF `BasePermission` classes:

1. **Patient Isolation**:
   ```python
   # apps/patients/views.py
   def get_queryset(self):
       user = self.request.user
       if user.role == UserRole.PATIENT:
           return Patient.objects.filter(user=user)
       return Patient.objects.all()
   ```
   A patient changing `id=4` to `id=9` in `GET /api/patients/9/` receives an immediate **HTTP 404 / 403 Forbidden**, completely preventing cross-tenant data leakage.

2. **Clinical Separation of Concerns**:
   - Receptionists, Billing staff, and Lab technicians cannot access clinical diagnoses or SOAP progress notes.
   - Administrators cannot view clinical notes unless explicitly assigned a clinical care role.

---

## 3. Cryptographic Storage & Document Protection

### Uploaded File Validation
- **MIME Type Whitelisting**: Uploads are restricted to `application/pdf`, `image/png`, and `image/jpeg`.
- **Server-Side File Renaming**: Uploaded files are stripped of user-supplied paths and assigned server-generated UUID paths:
  `laboratory_reports/%Y/%m/<uuid>.pdf`
- **Private Access Control**: Media files are hosted outside the public web root. In local environments, media files are served through authorized view endpoints; in Azure environments, access is granted via short-lived, time-limited Shared Access Signature (SAS) tokens.

---

## 4. Tamper-Evident Audit Trails

- **Transaction Coupling**: Financial settlements and clinical amendments write their business records and corresponding `AuditLog` rows inside the **same atomic database transaction**. If either fails, the entire transaction rolls back.
- **Immutable Log Safeguards**: The `AuditLog` model rejects `update()` and `delete()` operations from standard application views.
- **Sensitive Field Masking**: Passwords, refresh tokens, and credit card CVVs are strictly excluded from audit payloads.

---

## 5. Production Security Checklist

- [ ] Disable `DEBUG = False` in `config/settings.py`.
- [ ] Rotate `SECRET_KEY` using Azure Key Vault or environment secret managers.
- [ ] Enforce `SECURE_SSL_REDIRECT = True` and HTTP Strict Transport Security (`HSTS`).
- [ ] Set `SESSION_COOKIE_SECURE = True` and `CSRF_COOKIE_SECURE = True`.
- [ ] Configure PostgreSQL with SSL encryption (`sslmode=require`).
- [ ] Limit CORS to trusted production origins.
- [ ] Enable Azure Defender for Cloud to monitor database and container anomalies.
