# MediCare — Entity-Relationship (ER) Diagram

This document illustrates the relational structure and foreign-key topology of the MediCare database.

```mermaid
erDiagram
    USER ||--o| PATIENT : "has profile"
    USER ||--o| DOCTOR : "has profile"
    USER ||--o{ AUDIT_LOG : "initiates action"
    USER ||--o{ NOTIFICATION : "receives"

    DOCTOR ||--o{ DOCTOR_AVAILABILITY : "defines slots"
    DOCTOR ||--o{ APPOINTMENT : "attends"
    DOCTOR ||--o{ MEDICAL_RECORD : "records"
    DOCTOR ||--o{ PRESCRIPTION : "issues"
    DOCTOR ||--o{ LAB_ORDER : "requests"

    PATIENT ||--o{ APPOINTMENT : "books"
    PATIENT ||--o{ MEDICAL_RECORD : "subject of"
    PATIENT ||--o{ INVOICE : "billed for"
    PATIENT ||--o{ INSURANCE_POLICY : "holds"
    PATIENT ||--o{ LAB_ORDER : "undergoes"

    APPOINTMENT ||--o| MEDICAL_RECORD : "originates"
    APPOINTMENT ||--o| INVOICE : "charges for"

    MEDICAL_RECORD ||--o{ MEDICAL_RECORD : "amends (version tree)"
    MEDICAL_RECORD ||--o{ PRESCRIPTION : "contains"
    MEDICAL_RECORD ||--o{ LAB_ORDER : "associates"

    PRESCRIPTION ||--|{ PRESCRIPTION_ITEM : "specifies medicines"

    LAB_ORDER ||--o| LAB_REPORT : "results in"
    USER ||--o{ LAB_REPORT : "verifies"

    INVOICE ||--|{ INVOICE_ITEM : "composed of"
    INVOICE ||--o{ PAYMENT : "settled via"
    INVOICE ||--o{ INSURANCE_CLAIM : "claimed against"
    INSURANCE_POLICY ||--o{ INSURANCE_CLAIM : "covers"
```

---

## Referential Integrity & Deletion Policies

1. **`on_delete=models.PROTECT` for Clinical & Financial Entities**:
   - A `Patient` record cannot be deleted if historical `Appointment`, `MedicalRecord`, `Invoice`, or `LabOrder` entries exist.
   - A `Doctor` cannot be dropped if clinical encounters or active prescriptions reference them.
   - An `Invoice` cannot be purged if `Payment` records have been executed.
2. **`on_delete=models.CASCADE` for Pure Child Weak Entities**:
   - `DoctorAvailability` belongs strictly to its parent `Doctor`.
   - `PrescriptionItem` belongs strictly to its parent `Prescription`.
   - `InvoiceItem` belongs strictly to its parent `Invoice`.
3. **`on_delete=models.SET_NULL` for Auditing & Amendments**:
   - If a staff user account is deactivated or deleted, their referenced entries in `AuditLog` and `MedicalRecord.parent_record` preserve auditability by retaining historical IDs without breaking foreign-key cascades.
