import {
  User,
  Patient,
  Doctor,
  Appointment,
  MedicalRecord,
  Prescription,
  LaboratoryOrder,
  LaboratoryReport,
  Invoice,
  Payment,
  InsurancePolicy,
  InsuranceClaim,
  AuditLog,
  Notification,
  DashboardMetrics,
} from '../types';

const STORAGE_KEY = 'medicare_mock_database_v2';

export interface MockDatabase {
  users: User[];
  patients: Patient[];
  doctors: Doctor[];
  appointments: Appointment[];
  medicalRecords: MedicalRecord[];
  prescriptions: Prescription[];
  laboratoryOrders: LaboratoryOrder[];
  laboratoryReports: LaboratoryReport[];
  invoices: Invoice[];
  payments: Payment[];
  insurancePolicies: InsurancePolicy[];
  insuranceClaims: InsuranceClaim[];
  auditLogs: AuditLog[];
  notifications: Notification[];
}

const INITIAL_USERS: User[] = [
  {
    id: 1,
    email: 'admin@medicare.local',
    first_name: 'System',
    last_name: 'Administrator',
    full_name: 'System Administrator',
    role: 'ADMIN',
    role_display: 'Hospital Administrator',
    is_active: true,
    created_at: '2026-01-01T08:00:00Z',
  },
  {
    id: 2,
    email: 'sarah.jenkins@medicare.local',
    first_name: 'Sarah',
    last_name: 'Jenkins',
    full_name: 'Dr. Sarah Jenkins',
    role: 'DOCTOR',
    role_display: 'Physician / Specialist',
    is_active: true,
    created_at: '2026-01-05T09:00:00Z',
    doctor_id: 1,
  },
  {
    id: 3,
    email: 'john.doe@medicare.local',
    first_name: 'John',
    last_name: 'Doe',
    full_name: 'John Doe',
    role: 'PATIENT',
    role_display: 'Registered Patient',
    is_active: true,
    created_at: '2026-01-10T10:00:00Z',
    patient_id: 1,
  },
  {
    id: 4,
    email: 'rachel.green@medicare.local',
    first_name: 'Rachel',
    last_name: 'Green',
    full_name: 'Rachel Green',
    role: 'RECEPTIONIST',
    role_display: 'Front Desk Receptionist',
    is_active: true,
    created_at: '2026-01-12T08:30:00Z',
  },
  {
    id: 5,
    email: 'kevin.patel@medicare.local',
    first_name: 'Kevin',
    last_name: 'Patel',
    full_name: 'Kevin Patel',
    role: 'LAB_TECHNICIAN',
    role_display: 'Laboratory Technician',
    is_active: true,
    created_at: '2026-01-15T09:15:00Z',
  },
  {
    id: 6,
    email: 'brian.hall@medicare.local',
    first_name: 'Brian',
    last_name: 'Hall',
    full_name: 'Brian Hall',
    role: 'BILLING_STAFF',
    role_display: 'Billing & Finance Officer',
    is_active: true,
    created_at: '2026-01-18T11:00:00Z',
  },
];

const INITIAL_PATIENTS: Patient[] = [
  {
    id: 1,
    user: 3,
    first_name: 'John',
    last_name: 'Doe',
    email: 'john.doe@medicare.local',
    full_name: 'John Doe',
    date_of_birth: '1988-06-14',
    gender: 'Male',
    phone: '+1 (555) 234-5678',
    address: '742 Evergreen Terrace, Springfield, IL',
    emergency_contact: 'Jane Doe (+1 555-876-5432)',
    blood_group: 'O+',
    allergies: 'Penicillin, Amoxicillin',
    created_at: '2026-01-10T10:00:00Z',
    updated_at: '2026-01-10T10:00:00Z',
  },
  {
    id: 2,
    user: 7,
    first_name: 'Alice',
    last_name: 'Walker',
    email: 'alice.walker@example.com',
    full_name: 'Alice Walker',
    date_of_birth: '1992-11-20',
    gender: 'Female',
    phone: '+1 (555) 345-6789',
    address: '10880 Wilshire Blvd, Los Angeles, CA',
    emergency_contact: 'David Walker (+1 555-444-2222)',
    blood_group: 'A+',
    allergies: 'Latex',
    created_at: '2026-01-15T11:00:00Z',
    updated_at: '2026-01-15T11:00:00Z',
  },
  {
    id: 3,
    user: 8,
    first_name: 'Robert',
    last_name: 'Chen',
    email: 'robert.chen@example.com',
    full_name: 'Robert Chen',
    date_of_birth: '1975-03-08',
    gender: 'Male',
    phone: '+1 (555) 456-7890',
    address: '450 Sutter St, San Francisco, CA',
    emergency_contact: 'May Chen (+1 555-777-8888)',
    blood_group: 'B+',
    allergies: 'Sulfa antibiotics',
    created_at: '2026-01-20T14:30:00Z',
    updated_at: '2026-01-20T14:30:00Z',
  },
];

const INITIAL_DOCTORS: Doctor[] = [
  {
    id: 1,
    user: 2,
    first_name: 'Sarah',
    last_name: 'Jenkins',
    email: 'sarah.jenkins@medicare.local',
    full_name: 'Dr. Sarah Jenkins',
    specialization: 'Cardiology',
    license_number: 'MD-CARD-2024-8891',
    consultation_fee: '150.00',
    biography: 'Board-certified cardiologist with 14 years of clinical experience specializing in preventive cardiology, coronary interventions, and echocardiography.',
    availability_status: true,
    availabilities: [
      { id: 1, doctor: 1, weekday: 0, weekday_display: 'Monday', start_time: '09:00:00', end_time: '17:00:00', is_active: true },
      { id: 2, doctor: 1, weekday: 1, weekday_display: 'Tuesday', start_time: '09:00:00', end_time: '17:00:00', is_active: true },
      { id: 3, doctor: 1, weekday: 2, weekday_display: 'Wednesday', start_time: '09:00:00', end_time: '17:00:00', is_active: true },
      { id: 4, doctor: 1, weekday: 3, weekday_display: 'Thursday', start_time: '09:00:00', end_time: '17:00:00', is_active: true },
      { id: 5, doctor: 1, weekday: 4, weekday_display: 'Friday', start_time: '09:00:00', end_time: '14:00:00', is_active: true },
    ],
  },
  {
    id: 2,
    user: 10,
    first_name: 'Marcus',
    last_name: 'Vance',
    email: 'marcus.vance@medicare.local',
    full_name: 'Dr. Marcus Vance',
    specialization: 'Neurology',
    license_number: 'MD-NEUR-2021-3420',
    consultation_fee: '180.00',
    biography: 'Chief of Neurophysiology, specializing in epilepsy, stroke rehabilitation, and degenerative neurological disorders.',
    availability_status: true,
    availabilities: [
      { id: 6, doctor: 2, weekday: 0, weekday_display: 'Monday', start_time: '10:00:00', end_time: '18:00:00', is_active: true },
      { id: 7, doctor: 2, weekday: 2, weekday_display: 'Wednesday', start_time: '10:00:00', end_time: '18:00:00', is_active: true },
    ],
  },
  {
    id: 3,
    user: 11,
    first_name: 'Elena',
    last_name: 'Rostova',
    email: 'elena.rostova@medicare.local',
    full_name: 'Dr. Elena Rostova',
    specialization: 'Pediatrics',
    license_number: 'MD-PED-2019-1102',
    consultation_fee: '120.00',
    biography: 'Pediatric care expert focused on developmental milestones, adolescent medicine, and immunization pathways.',
    availability_status: true,
    availabilities: [
      { id: 8, doctor: 3, weekday: 1, weekday_display: 'Tuesday', start_time: '08:30:00', end_time: '16:30:00', is_active: true },
    ],
  },
  {
    id: 4,
    user: 12,
    first_name: 'David',
    last_name: 'Chen',
    email: 'david.chen@medicare.local',
    full_name: 'Dr. David Chen',
    specialization: 'Orthopedic Surgery',
    license_number: 'MD-ORTH-2022-7714',
    consultation_fee: '200.00',
    biography: 'Specialist in joint preservation, minimally invasive arthroscopic surgery, and sports trauma management.',
    availability_status: true,
    availabilities: [
      { id: 9, doctor: 4, weekday: 0, weekday_display: 'Monday', start_time: '08:00:00', end_time: '15:00:00', is_active: true },
    ],
  },
];

const INITIAL_APPOINTMENTS: Appointment[] = [
  {
    id: 1,
    patient: 1,
    doctor: 1,
    patient_details: INITIAL_PATIENTS[0],
    doctor_details: INITIAL_DOCTORS[0],
    appointment_start: '2026-11-25T10:00:00Z',
    appointment_end: '2026-11-25T10:30:00Z',
    status: 'Confirmed',
    reason: 'Routine quarterly cardiovascular wellness checkup and blood pressure monitoring.',
    created_at: '2026-11-20T10:00:00Z',
  },
  {
    id: 2,
    patient: 2,
    doctor: 1,
    patient_details: INITIAL_PATIENTS[1],
    doctor_details: INITIAL_DOCTORS[0],
    appointment_start: '2026-11-25T11:00:00Z',
    appointment_end: '2026-11-25T11:30:00Z',
    status: 'Scheduled',
    reason: 'Follow-up consultation after Holter monitor test.',
    created_at: '2026-11-21T09:30:00Z',
  },
  {
    id: 3,
    patient: 3,
    doctor: 2,
    patient_details: INITIAL_PATIENTS[2],
    doctor_details: INITIAL_DOCTORS[1],
    appointment_start: '2026-11-26T14:00:00Z',
    appointment_end: '2026-11-26T14:45:00Z',
    status: 'Confirmed',
    reason: 'Chronic migraine assessment and neurological reflex screening.',
    created_at: '2026-11-22T14:00:00Z',
  },
  {
    id: 4,
    patient: 1,
    doctor: 4,
    patient_details: INITIAL_PATIENTS[0],
    doctor_details: INITIAL_DOCTORS[3],
    appointment_start: '2026-11-10T09:00:00Z',
    appointment_end: '2026-11-10T09:30:00Z',
    status: 'Completed',
    reason: 'Left knee sprain evaluation after athletic injury.',
    created_at: '2026-11-05T11:00:00Z',
  },
];

const INITIAL_RECORDS: MedicalRecord[] = [
  {
    id: 1,
    patient: 1,
    doctor: 1,
    patient_details: INITIAL_PATIENTS[0],
    doctor_details: INITIAL_DOCTORS[0],
    appointment: 4,
    diagnosis: 'Stage 1 Essential Hypertension (ICD-10: I10) with sinus rhythm.',
    clinical_notes: 'Subjective: Patient reports occasional lightheadedness.\nObjective: BP 138/88 mmHg, HR 72 bpm.\nAssessment: Well-controlled Stage 1 HTN.\nPlan: Continue Lisinopril 10mg daily.',
    treatment_plan: 'Continue Lisinopril 10mg daily. Repeat basic metabolic panel in 6 months.',
    recorded_at: '2026-11-10T09:30:00Z',
    created_at: '2026-11-10T09:30:00Z',
    updated_at: '2026-11-10T09:30:00Z',
    version_number: 1,
    is_latest: true,
    amendment_reason: '',
  },
  {
    id: 2,
    patient: 3,
    doctor: 2,
    patient_details: INITIAL_PATIENTS[2],
    doctor_details: INITIAL_DOCTORS[1],
    diagnosis: 'Episodic Migraine without Aura (ICD-10: G43.009).',
    clinical_notes: 'Subjective: Throbbing hemicranial headaches triggered by bright light.\nObjective: Cranial nerves intact.\nAssessment: Episodic migraine.',
    treatment_plan: 'Sumatriptan 50mg at onset of headache. Headache diary maintenance.',
    recorded_at: '2026-11-15T15:00:00Z',
    created_at: '2026-11-15T15:00:00Z',
    updated_at: '2026-11-15T15:00:00Z',
    version_number: 1,
    is_latest: true,
    amendment_reason: '',
  },
];

const INITIAL_PRESCRIPTIONS: Prescription[] = [
  {
    id: 1,
    patient: 1,
    doctor: 1,
    patient_details: INITIAL_PATIENTS[0],
    doctor_details: INITIAL_DOCTORS[0],
    medical_record: 1,
    prescribed_at: '2026-11-10T09:40:00Z',
    instructions: 'Take in the morning with water. Monitor home blood pressure twice weekly.',
    status: 'Active',
    created_at: '2026-11-10T09:40:00Z',
    items: [
      {
        id: 1,
        medicine_name: 'Lisinopril Oral Tablet',
        dosage: '10 mg',
        frequency: 'Once daily',
        duration: '90 days',
        quantity: 90,
        additional_instructions: 'Take every morning before breakfast.',
      },
      {
        id: 2,
        medicine_name: 'Coenzyme Q10',
        dosage: '100 mg',
        frequency: 'Once daily',
        duration: '90 days',
        quantity: 90,
        additional_instructions: 'Cardiovascular antioxidant support with meal.',
      },
    ],
  },
];

const INITIAL_LAB_REPORTS: LaboratoryReport[] = [
  {
    id: 1,
    laboratory_order: 1,
    result: 'Serum potassium 4.2 mEq/L, eGFR > 90 mL/min, Total Cholesterol 185 mg/dL, HDL 54 mg/dL, LDL 108 mg/dL.',
    unit: 'mg/dL',
    reference_range: 'Standard panel reference',
    report_file: null,
    file_url: null,
    reported_at: '2026-11-11T14:30:00Z',
    verified_by: 5,
    verified_by_name: 'Kevin Patel',
    verification_status: 'Verified',
    version_number: 1,
    amendment_notes: '',
  },
];

const INITIAL_LAB_ORDERS: LaboratoryOrder[] = [
  {
    id: 1,
    patient: 1,
    ordered_by: 1,
    patient_details: INITIAL_PATIENTS[0],
    ordered_by_details: INITIAL_DOCTORS[0],
    medical_record: 1,
    test_name: 'Comprehensive Metabolic Panel (CMP) + Lipid Panel',
    clinical_notes: 'Evaluate serum creatinine, electrolytes, and lipid ratios.',
    status: 'Completed',
    ordered_at: '2026-11-10T10:00:00Z',
    reports: INITIAL_LAB_REPORTS,
  },
  {
    id: 2,
    patient: 2,
    ordered_by: 1,
    patient_details: INITIAL_PATIENTS[1],
    ordered_by_details: INITIAL_DOCTORS[0],
    test_name: 'Complete Blood Count (CBC) with Differential',
    clinical_notes: 'Evaluate fatigue and mild pallor.',
    status: 'In_Progress',
    ordered_at: '2026-11-23T08:30:00Z',
    reports: [],
  },
];

const INITIAL_PAYMENTS: Payment[] = [
  {
    id: 1,
    invoice: 1,
    amount: '200.00',
    payment_method: 'Card',
    payment_method_display: 'Credit Card',
    transaction_reference: 'TXN-2026-9901',
    status: 'Completed',
    notes: 'Paid via Visa card ending in 4022.',
    paid_at: '2026-11-10T10:30:00Z',
    created_at: '2026-11-10T10:30:00Z',
  },
  {
    id: 2,
    invoice: 3,
    amount: '100.00',
    payment_method: 'UPI',
    payment_method_display: 'Unified Payments Interface',
    transaction_reference: 'TXN-2026-9902',
    status: 'Completed',
    notes: 'Advance co-payment via gateway.',
    paid_at: '2026-11-22T15:00:00Z',
    created_at: '2026-11-22T15:00:00Z',
  },
];

const INITIAL_INVOICES: Invoice[] = [
  {
    id: 1,
    patient: 1,
    appointment: 4,
    patient_details: INITIAL_PATIENTS[0],
    invoice_number: 'INV-2026-0012',
    subtotal: '200.00',
    tax_amount: '0.00',
    discount_amount: '0.00',
    total_amount: '200.00',
    amount_paid: '200.00',
    balance_due: '0.00',
    status: 'Paid',
    due_date: '2026-11-24',
    created_at: '2026-11-10T10:15:00Z',
    items: [
      { id: 1, description: 'Specialist Orthopedic Consultation', quantity: 1, unit_price: '200.00', line_total: '200.00' },
    ],
    payments: [INITIAL_PAYMENTS[0]],
  },
  {
    id: 2,
    patient: 1,
    appointment: 1,
    patient_details: INITIAL_PATIENTS[0],
    invoice_number: 'INV-2026-0035',
    subtotal: '150.00',
    tax_amount: '0.00',
    discount_amount: '0.00',
    total_amount: '150.00',
    amount_paid: '0.00',
    balance_due: '150.00',
    status: 'Unpaid',
    due_date: '2026-12-05',
    created_at: '2026-11-20T10:00:00Z',
    items: [
      { id: 2, description: 'Cardiology Follow-Up Consultation', quantity: 1, unit_price: '150.00', line_total: '150.00' },
    ],
    payments: [],
  },
  {
    id: 3,
    patient: 3,
    appointment: 3,
    patient_details: INITIAL_PATIENTS[2],
    invoice_number: 'INV-2026-0036',
    subtotal: '280.00',
    tax_amount: '0.00',
    discount_amount: '0.00',
    total_amount: '280.00',
    amount_paid: '100.00',
    balance_due: '180.00',
    status: 'Partially_Paid',
    due_date: '2026-12-10',
    created_at: '2026-11-22T14:30:00Z',
    items: [
      { id: 3, description: 'Neurology Consultation', quantity: 1, unit_price: '180.00', line_total: '180.00' },
      { id: 4, description: 'Cranial Nerve & Reflex Assessment', quantity: 1, unit_price: '100.00', line_total: '100.00' },
    ],
    payments: [INITIAL_PAYMENTS[1]],
  },
];

const INITIAL_POLICIES: InsurancePolicy[] = [
  {
    id: 1,
    patient: 1,
    patient_details: INITIAL_PATIENTS[0],
    insurer_name: 'BlueCross Healthcare Plus',
    policy_number: 'BCBS-IL-8921004',
    coverage_details: '80% coverage for inpatient and specialist consultations, max limit $50,000.',
    valid_from: '2026-01-01',
    valid_until: '2026-12-31',
    status: 'Active',
  },
];

const INITIAL_CLAIMS: InsuranceClaim[] = [
  {
    id: 1,
    invoice: 1,
    insurance_policy: 1,
    invoice_details: INITIAL_INVOICES[0],
    policy_details: INITIAL_POLICIES[0],
    claim_number: 'CLM-2026-0041',
    claim_amount: '160.00',
    approved_amount: '160.00',
    status: 'Approved',
    submitted_at: '2026-11-10T11:00:00Z',
    adjudication_notes: 'Approved under primary specialist copay schedule.',
  },
];

const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 1,
    actor: 1,
    actor_email: 'admin@medicare.local',
    actor_display: 'System Administrator',
    action: 'USER_ROLE_ASSIGNED',
    entity_type: 'User',
    entity_id: '2',
    timestamp: '2026-11-20T08:00:00Z',
    request_id: 'req-88910-1',
    source_ip: '192.168.1.10',
    change_summary: 'Role updated to DOCTOR for Dr. Sarah Jenkins',
    previous_values: {},
    new_values: { role: 'DOCTOR' },
  },
  {
    id: 2,
    actor: 4,
    actor_email: 'rachel.green@medicare.local',
    actor_display: 'Rachel Green',
    action: 'APPOINTMENT_SCHEDULED',
    entity_type: 'Appointment',
    entity_id: '1',
    timestamp: '2026-11-20T10:00:00Z',
    request_id: 'req-88910-2',
    source_ip: '192.168.1.15',
    change_summary: 'Scheduled cardiology consultation for John Doe',
    previous_values: {},
    new_values: { status: 'Confirmed' },
  },
  {
    id: 3,
    actor: 2,
    actor_email: 'sarah.jenkins@medicare.local',
    actor_display: 'Dr. Sarah Jenkins',
    action: 'SOAP_RECORD_FINALIZED',
    entity_type: 'MedicalRecord',
    entity_id: '1',
    timestamp: '2026-11-10T09:30:00Z',
    request_id: 'req-88910-3',
    source_ip: '192.168.1.22',
    change_summary: 'Recorded initial SOAP note for hypertension',
    previous_values: {},
    new_values: { version: 1 },
  },
  {
    id: 4,
    actor: 6,
    actor_email: 'brian.hall@medicare.local',
    actor_display: 'Brian Hall',
    action: 'PAYMENT_RECORDED',
    entity_type: 'Invoice',
    entity_id: '1',
    timestamp: '2026-11-10T10:30:00Z',
    request_id: 'req-88910-4',
    source_ip: '192.168.1.30',
    change_summary: 'Recorded payment of $200.00 for INV-2026-0012',
    previous_values: { balance_due: '200.00' },
    new_values: { balance_due: '0.00', status: 'Paid' },
  },
];

const INITIAL_NOTIFICATIONS: Notification[] = [
  {
    id: 1,
    user: 3,
    title: 'Appointment Confirmed',
    message: 'Your cardiology appointment with Dr. Sarah Jenkins is scheduled for Nov 25, 2026 at 10:00 AM.',
    notification_type: 'Appointment',
    is_read: false,
    created_at: '2026-11-20T10:05:00Z',
  },
  {
    id: 2,
    user: 3,
    title: 'Laboratory Report Verified',
    message: 'Your Comprehensive Metabolic Panel results have been verified and are ready to view.',
    notification_type: 'LabReport',
    is_read: true,
    created_at: '2026-11-11T16:05:00Z',
  },
];

export const getMockDatabase = (): MockDatabase => {
  const existing = localStorage.getItem(STORAGE_KEY);
  if (existing) {
    try {
      return JSON.parse(existing);
    } catch (e) {
      console.warn('Failed to parse mock database, resetting.');
    }
  }

  const initialDb: MockDatabase = {
    users: INITIAL_USERS,
    patients: INITIAL_PATIENTS,
    doctors: INITIAL_DOCTORS,
    appointments: INITIAL_APPOINTMENTS,
    medicalRecords: INITIAL_RECORDS,
    prescriptions: INITIAL_PRESCRIPTIONS,
    laboratoryOrders: INITIAL_LAB_ORDERS,
    laboratoryReports: INITIAL_LAB_REPORTS,
    invoices: INITIAL_INVOICES,
    payments: INITIAL_PAYMENTS,
    insurancePolicies: INITIAL_POLICIES,
    insuranceClaims: INITIAL_CLAIMS,
    auditLogs: INITIAL_AUDIT_LOGS,
    notifications: INITIAL_NOTIFICATIONS,
  };

  saveMockDatabase(initialDb);
  return initialDb;
};

export const saveMockDatabase = (db: MockDatabase) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  } catch (e) {
    console.error('Failed to save mock database', e);
  }
};

export const getMockAnalytics = (db: MockDatabase): DashboardMetrics => {
  const totalRevenue = db.payments.reduce((acc, p) => acc + parseFloat(p.amount || '0'), 0);
  const pendingInvoices = db.invoices.filter((i) => i.status === 'Unpaid' || i.status === 'Partially_Paid').length;

  const statusCounts: Record<string, number> = {};
  db.appointments.forEach((a) => {
    statusCounts[a.status] = (statusCounts[a.status] || 0) + 1;
  });

  const doctorCounts: Record<string, { doctor: string; specialization: string; appointments: number }> = {};
  db.doctors.forEach((d) => {
    doctorCounts[d.full_name] = { doctor: d.full_name, specialization: d.specialization, appointments: 0 };
  });
  db.appointments.forEach((a) => {
    const docName = a.doctor_details?.full_name || 'Dr. Specialist';
    if (doctorCounts[docName]) {
      doctorCounts[docName].appointments += 1;
    }
  });

  return {
    role: 'ADMIN',
    metrics: {
      total_patients: db.patients.length,
      total_doctors: db.doctors.length,
      total_appointments: db.appointments.length,
      total_revenue: totalRevenue.toFixed(2),
      pending_invoices: pendingInvoices,
      active_users: db.users.length,
      audit_events_today: db.auditLogs.length,
      system_health: 'Operational (High Availability)',
    },
    charts: {
      appointment_status: Object.entries(statusCounts).map(([name, value]) => ({ name, value })),
      doctor_workload: Object.values(doctorCounts),
      monthly_billing: [
        { month: 'Jul', billed: 4800, collected: 4200 },
        { month: 'Aug', billed: 5600, collected: 5100 },
        { month: 'Sep', billed: 6900, collected: 6400 },
        { month: 'Oct', billed: 8200, collected: 7800 },
        { month: 'Nov', billed: totalRevenue + 330, collected: totalRevenue },
      ],
    },
    timestamp: new Date().toISOString(),
  };
};
