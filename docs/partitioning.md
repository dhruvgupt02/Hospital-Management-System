# MediCare — PostgreSQL Table Partitioning Strategy

This document details the database engineering strategy, mathematical rationale, operational tradeoffs, and migration plan for partitioning historical clinical records in the MediCare system.

---

## 1. Rationale and When Partitioning Is Appropriate

### Why Partition `medical_records_medicalrecord`?
In clinical hospital environments, active clinical encounters represent a tiny working set (e.g., current day or current calendar quarter), while historical medical records grow monotonically into millions of rows over decades.

- **Partition Pruning**: When doctors or analytics queries filter by encounter date range (`WHERE recorded_at >= '2026-01-01' AND recorded_at < '2026-04-01'`), the PostgreSQL query planner evaluates partition constraints and excludes non-matching partitions entirely from the query tree without loading their index pages into `shared_buffers`.
- **Cache Efficiency**: Active clinical partitions remain hot in memory, drastically reducing I/O wait times.
- **Bulk Archival & Zero-Downtime Purging**: At the end of statutory retention periods (e.g., 7 or 10 years), older partitions can be detached (`ALTER TABLE ... DETACH PARTITION`) and exported to cold object storage (Azure Blob Archive Tier) with zero impact on active transactions.

### Tables That Should NOT Be Partitioned
Partitioning incurs overhead and should not be applied indiscriminately:
- `accounts_user`, `doctors_doctor`, `patients_patient`: Dimensions with frequent point lookups by Primary Key.
- Small reference tables or operational queues with low row volumes.

---

## 2. Partition Key and Architecture

- **Partitioning Method**: Declarative Range Partitioning by `recorded_at` (Encounter Clinical Timestamp).
- **Partition Granularity**: Annual partitions (e.g., `records_2024`, `records_2025`, `records_2026`, `records_future`).

### Partition Schema Definition
```sql
-- 1. Create Root Partitioned Table
CREATE TABLE medical_records_medicalrecord_partitioned (
    id BIGSERIAL,
    patient_id BIGINT NOT NULL,
    doctor_id BIGINT NOT NULL,
    appointment_id BIGINT,
    parent_record_id BIGINT,
    version_number INT NOT NULL DEFAULT 1,
    is_latest BOOLEAN NOT NULL DEFAULT TRUE,
    amendment_reason TEXT,
    diagnosis TEXT NOT NULL,
    clinical_notes TEXT NOT NULL,
    treatment_plan TEXT,
    recorded_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (id, recorded_at)
) PARTITION BY RANGE (recorded_at);

-- 2. Create Annual Child Partitions
CREATE TABLE medical_records_2024 PARTITION OF medical_records_medicalrecord_partitioned
    FOR VALUES FROM ('2024-01-01 00:00:00+00') TO ('2025-01-01 00:00:00+00');

CREATE TABLE medical_records_2025 PARTITION OF medical_records_medicalrecord_partitioned
    FOR VALUES FROM ('2025-01-01 00:00:00+00') TO ('2026-01-01 00:00:00+00');

CREATE TABLE medical_records_2026 PARTITION OF medical_records_medicalrecord_partitioned
    FOR VALUES FROM ('2026-01-01 00:00:00+00') TO ('2027-01-01 00:00:00+00');

-- Default Partition for future records
CREATE TABLE medical_records_future PARTITION OF medical_records_medicalrecord_partitioned
    DEFAULT;
```

---

## 3. RDBMS Trade-Offs & Foreign Key Considerations

In PostgreSQL 11+:
1. **Primary Key Requirement**: A unique constraint or primary key on a partitioned table **must include all partition key columns**. Therefore, the composite key `(id, recorded_at)` is required.
2. **Referencing Foreign Keys**: In PostgreSQL 12+, foreign keys can point to partitioned tables if the reference matches the composite unique constraint `(id, recorded_at)`.
3. **Full-Text Search Across Partitions**: Local GIN indexes on `to_tsvector('english', diagnosis || ' ' || clinical_notes)` are created on each partition automatically, ensuring fast full-text searching across all historical encounters.

---

## 4. Multi-Stage Zero-Downtime Migration Plan

For production migration from the current unpartitioned table:
1. **Phase 1**: Deploy the partitioned table alongside the existing table.
2. **Phase 2**: Dual-write via PostgreSQL trigger or application routing layer.
3. **Phase 3**: Backfill historical rows in chunks using `INSERT INTO ... SELECT ... WHERE recorded_at BETWEEN ...`.
4. **Phase 4**: In a maintenance window, rename tables inside a single transaction:
   ```sql
   BEGIN;
   LOCK TABLE medical_records_medicalrecord IN ACCESS EXCLUSIVE MODE;
   ALTER TABLE medical_records_medicalrecord RENAME TO medical_records_legacy;
   ALTER TABLE medical_records_medicalrecord_partitioned RENAME TO medical_records_medicalrecord;
   COMMIT;
   ```
5. **Phase 5**: Verify application queries and drop the legacy staging table.
