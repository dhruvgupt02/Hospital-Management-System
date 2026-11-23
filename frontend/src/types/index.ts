export type UserRole =
  | 'ADMIN'
  | 'DOCTOR'
  | 'PATIENT'
  | 'RECEPTIONIST'
  | 'LAB_TECHNICIAN'
  | 'BILLING_STAFF';

export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  role: UserRole;
  role_display: string;
  is_active: boolean;
  created_at: string;
  patient_id?: number | null;
  doctor_id?: number | null;
}

export interface Patient {
  id: number;
  user: number;
  first_name: string;
  last_name: string;
  email: string;
  full_name: string;
  date_of_birth: string | null;
  gender: string;
  phone: string;
  address: string;
  emergency_contact: string;
  blood_group: string;
  allergies: string;
  created_at: string;
  updated_at: string;
}

export interface DoctorAvailability {
  id: number;
  doctor: number;
  weekday: number;
  weekday_display: string;
  start_time: string;
  end_time: string;
  is_active: boolean;
}

export interface Doctor {
  id: number;
  user: number;
  first_name: string;
  last_name: string;
  email: string;
  full_name: string;
  specialization: string;
  license_number: string;
  consultation_fee: string;
  biography: string;
  availability_status: boolean;
  availabilities?: DoctorAvailability[];
}

export type AppointmentStatus =
  | 'Scheduled'
  | 'Confirmed'
  | 'Completed'
  | 'Cancelled'
  | 'No-show';

export interface Appointment {
  id: number;
  patient: number;
  doctor: number;
  patient_details?: Patient;
  doctor_details?: Doctor;
  appointment_start: string;
  appointment_end: string;
  status: AppointmentStatus;
  reason: string;
  cancellation_reason?: string;
  created_by?: number;
  created_by_email?: string;
  created_at: string;
}

export interface MedicalRecord {
  id: number;
  patient: number;
  doctor: number;
  patient_details?: Patient;
  doctor_details?: Doctor;
  appointment?: number | null;
  diagnosis: string;
  clinical_notes: string;
  treatment_plan: string;
  recorded_at: string;
  created_at: string;
  updated_at: string;
  version_number: number;
  is_latest: boolean;
  parent_record?: number | null;
  amendment_reason?: string;
  amendment_history?: MedicalRecordHistory[];
}

export interface MedicalRecordHistory {
  id: number;
  version_number: number;
  diagnosis: string;
  clinical_notes: string;
  treatment_plan: string;
  recorded_at: string;
  created_at: string;
  amendment_reason?: string;
  doctor_name: string;
}

export interface PrescriptionItem {
  id?: number;
  medicine_name: string;
  dosage: string;
  frequency: string;
  duration: string;
  quantity: number;
  additional_instructions?: string;
}

export interface Prescription {
  id: number;
  medical_record?: number;
  doctor: number;
  patient: number;
  patient_details?: Patient;
  doctor_details?: Doctor;
  prescribed_at: string;
  instructions: string;
  status: 'Active' | 'Discontinued' | 'Completed';
  items: PrescriptionItem[];
  created_at: string;
}

export interface LaboratoryReport {
  id: number;
  laboratory_order: number;
  result: string;
  unit: string;
  reference_range: string;
  report_file?: string | null;
  file_url?: string | null;
  reported_at: string;
  verified_by?: number;
  verified_by_name?: string;
  verification_status: 'Pending' | 'Verified' | 'Rejected';
  version_number: number;
  amendment_notes?: string;
}

export interface LaboratoryOrder {
  id: number;
  patient: number;
  medical_record?: number | null;
  ordered_by: number;
  patient_details?: Patient;
  ordered_by_details?: Doctor;
  test_name: string;
  clinical_notes: string;
  status: 'Ordered' | 'In_Progress' | 'Completed' | 'Cancelled';
  ordered_at: string;
  reports?: LaboratoryReport[];
}

export interface InvoiceItem {
  id?: number;
  description: string;
  quantity: number;
  unit_price: string;
  line_total?: string;
}

export interface Payment {
  id: number;
  invoice: number;
  amount: string;
  payment_method: string;
  payment_method_display: string;
  transaction_reference: string;
  status: string;
  notes?: string;
  paid_at: string;
  created_at: string;
}

export interface Invoice {
  id: number;
  patient: number;
  appointment?: number | null;
  patient_details?: Patient;
  invoice_number: string;
  subtotal: string;
  tax_amount: string;
  discount_amount: string;
  total_amount: string;
  amount_paid: string;
  balance_due: string;
  status: 'Unpaid' | 'Partially_Paid' | 'Paid' | 'Cancelled';
  due_date?: string | null;
  items: InvoiceItem[];
  payments: Payment[];
  created_at: string;
}

export interface InsurancePolicy {
  id: number;
  patient: number;
  patient_details?: Patient;
  insurer_name: string;
  policy_number: string;
  coverage_details: string;
  valid_from: string;
  valid_until: string;
  status: 'Active' | 'Expired' | 'Terminated';
}

export interface InsuranceClaim {
  id: number;
  invoice: number;
  insurance_policy: number;
  invoice_details?: Invoice;
  policy_details?: InsurancePolicy;
  claim_number: string;
  claim_amount: string;
  approved_amount: string;
  status: 'Submitted' | 'Under_Review' | 'Approved' | 'Rejected' | 'Settled';
  adjudication_notes?: string;
  submitted_at: string;
}

export interface AuditLog {
  id: number;
  actor: number | null;
  actor_email: string;
  actor_display: string;
  action: string;
  entity_type: string;
  entity_id: string;
  timestamp: string;
  request_id: string;
  source_ip: string;
  change_summary: string;
  previous_values: Record<string, any>;
  new_values: Record<string, any>;
}

export interface Notification {
  id: number;
  user: number;
  title: string;
  message: string;
  notification_type: 'Appointment' | 'Prescription' | 'LabReport' | 'Billing' | 'System';
  is_read: boolean;
  created_at: string;
}

export interface DashboardMetrics {
  role: UserRole;
  metrics: Record<string, number | string>;
  charts: {
    monthly_billing?: Array<{ month: string; billed: number; collected: number }>;
    appointment_status?: Array<{ name: string; value: number }>;
    doctor_workload?: Array<{ doctor: string; specialization: string; appointments: number }>;
  };
  timestamp: string;
}
