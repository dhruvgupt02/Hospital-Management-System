import axios from 'axios';
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
} from '../types';
import {
  getMockDatabase,
  saveMockDatabase,
  getMockAnalytics,
} from './mockData';

// Standalone mode: runs completely inside the browser with localStorage persistence.
// If VITE_USE_BACKEND === 'true', it falls back to a real backend server.
const USE_STANDALONE_MOCK = import.meta.env.VITE_USE_BACKEND !== 'true';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

export const apiClient = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to attach JWT token (for live backend mode)
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('medicare_access_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor to handle token refresh on 401
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/login/') &&
      !originalRequest.url?.includes('/auth/refresh/')
    ) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('medicare_refresh_token');
      if (refreshToken) {
        try {
          const res = await axios.post(`${API_BASE}/auth/refresh/`, { refresh: refreshToken });
          const newAccessToken = res.data.access;
          localStorage.setItem('medicare_access_token', newAccessToken);
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return apiClient(originalRequest);
        } catch (refreshErr) {
          localStorage.removeItem('medicare_access_token');
          localStorage.removeItem('medicare_refresh_token');
          localStorage.removeItem('medicare_user');
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

// Helper for simulated network delay (feels like a fast responsive app)
const delay = (ms = 80) => new Promise((resolve) => setTimeout(resolve, ms));

// ==========================================
// 1. AUTHENTICATION & USER MANAGEMENT
// ==========================================
export const authService = {
  login: async (credentials: { email: string; password: string }) => {
    if (!USE_STANDALONE_MOCK) {
      try {
        const res = await apiClient.post<{ access: string; refresh: string; user: User }>('/auth/login/', credentials);
        return res.data;
      } catch (err) {
        console.warn('Backend unavailable, falling back to standalone mock authentication.');
      }
    }

    await delay(100);
    const db = getMockDatabase();
    const query = credentials.email.trim().toLowerCase();

    // Look for existing user
    let user = db.users.find(
      (u) =>
        u.email.toLowerCase() === query ||
        u.email.toLowerCase().startsWith(query.split('@')[0])
    );

    // If logging in as an unseeded demo email, automatically create user with appropriate role
    if (!user) {
      let role: User['role'] = 'PATIENT';
      if (query.includes('admin')) role = 'ADMIN';
      else if (query.includes('doctor') || query.includes('sarah')) role = 'DOCTOR';
      else if (query.includes('reception') || query.includes('rachel')) role = 'RECEPTIONIST';
      else if (query.includes('lab') || query.includes('kevin')) role = 'LAB_TECHNICIAN';
      else if (query.includes('billing') || query.includes('brian')) role = 'BILLING_STAFF';

      user = {
        id: db.users.length + 1,
        email: credentials.email,
        first_name: credentials.email.split('@')[0].split('.')[0] || 'Demo',
        last_name: credentials.email.split('@')[0].split('.')[1] || 'User',
        full_name: `${credentials.email.split('@')[0]}`,
        role,
        role_display: role.replace('_', ' '),
        is_active: true,
        created_at: new Date().toISOString(),
        patient_id: role === 'PATIENT' ? 1 : null,
        doctor_id: role === 'DOCTOR' ? 1 : null,
      };
      db.users.push(user);
      saveMockDatabase(db);
    }

    return {
      access: 'mock-jwt-access-token-medicare-2026',
      refresh: 'mock-jwt-refresh-token-medicare-2026',
      user,
    };
  },

  register: async (payload: any) => {
    if (!USE_STANDALONE_MOCK) {
      try {
        const res = await apiClient.post('/auth/register/', payload);
        return res.data;
      } catch (err) {
        console.warn('Backend unavailable, registering user in standalone mock database.');
      }
    }

    await delay(120);
    const db = getMockDatabase();
    const newUserId = db.users.length + 1;
    const newPatientId = db.patients.length + 1;

    const newUser: User = {
      id: newUserId,
      email: payload.email,
      first_name: payload.first_name,
      last_name: payload.last_name,
      full_name: `${payload.first_name} ${payload.last_name}`.trim(),
      role: 'PATIENT',
      role_display: 'Registered Patient',
      is_active: true,
      created_at: new Date().toISOString(),
      patient_id: newPatientId,
    };

    const newPatient: Patient = {
      id: newPatientId,
      user: newUserId,
      first_name: payload.first_name,
      last_name: payload.last_name,
      email: payload.email,
      full_name: `${payload.first_name} ${payload.last_name}`.trim(),
      date_of_birth: payload.date_of_birth || '1995-01-01',
      gender: payload.gender || 'Other',
      phone: payload.phone || '+1 (555) 000-0000',
      address: payload.address || 'Address on file',
      emergency_contact: payload.emergency_contact || 'None',
      blood_group: payload.blood_group || 'O+',
      allergies: payload.allergies || 'None',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    db.users.push(newUser);
    db.patients.push(newPatient);

    db.auditLogs.unshift({
      id: db.auditLogs.length + 1,
      actor: newUserId,
      actor_email: payload.email,
      actor_display: newUser.full_name,
      action: 'PATIENT_SELF_REGISTERED',
      entity_type: 'Patient',
      entity_id: String(newPatientId),
      timestamp: new Date().toISOString(),
      request_id: `req-${Date.now()}`,
      source_ip: '127.0.0.1 (Web Browser)',
      change_summary: 'Self registered as patient',
      previous_values: {},
      new_values: { email: payload.email, patient_id: newPatientId },
    });

    saveMockDatabase(db);
    return { message: 'Patient account created successfully.', user: newUser };
  },

  getCurrentUser: async () => {
    const saved = localStorage.getItem('medicare_user');
    if (saved) {
      try {
        return JSON.parse(saved) as User;
      } catch (e) {
        // fallback
      }
    }
    const db = getMockDatabase();
    return db.users[0];
  },

  changePassword: async (_passwords: { old_password: string; new_password: string }) => {
    await delay(50);
    return { detail: 'Password successfully updated.' };
  },

  requestPasswordReset: async (_email: string) => {
    await delay(50);
    return { detail: 'Password reset link has been dispatched to your email address.' };
  },

  getUsers: async (params?: Record<string, any>) => {
    await delay(50);
    const db = getMockDatabase();
    let list = [...db.users];
    if (params?.role) {
      list = list.filter((u) => u.role === params.role);
    }
    if (params?.search) {
      const q = params.search.toLowerCase();
      list = list.filter((u) => u.email.toLowerCase().includes(q) || u.full_name.toLowerCase().includes(q));
    }
    return { results: list, count: list.length };
  },

  updateUser: async (id: number, data: Partial<User>) => {
    await delay(50);
    const db = getMockDatabase();
    const index = db.users.findIndex((u) => u.id === id);
    if (index !== -1) {
      db.users[index] = { ...db.users[index], ...data };
      saveMockDatabase(db);
      return db.users[index];
    }
    throw new Error('User not found');
  },
};

// ==========================================
// 2. PATIENTS SERVICE
// ==========================================
export const patientsService = {
  getPatients: async (params?: Record<string, any>) => {
    await delay(50);
    const db = getMockDatabase();
    let results = [...db.patients];
    if (params?.search) {
      const q = params.search.toLowerCase();
      results = results.filter(
        (p) =>
          p.full_name.toLowerCase().includes(q) ||
          p.email.toLowerCase().includes(q) ||
          p.phone.toLowerCase().includes(q)
      );
    }
    return { results, count: results.length };
  },

  getPatient: async (id: number) => {
    await delay(40);
    const db = getMockDatabase();
    const patient = db.patients.find((p) => p.id === Number(id));
    if (patient) return patient;
    return db.patients[0];
  },

  createPatient: async (data: any) => {
    await delay(80);
    const db = getMockDatabase();
    const newId = db.patients.length + 1;
    const newPatient: Patient = {
      id: newId,
      user: db.users.length + 1,
      first_name: data.first_name,
      last_name: data.last_name,
      email: data.email,
      full_name: `${data.first_name} ${data.last_name}`.trim(),
      date_of_birth: data.date_of_birth || null,
      gender: data.gender || 'Other',
      phone: data.phone || '',
      address: data.address || '',
      emergency_contact: data.emergency_contact || '',
      blood_group: data.blood_group || 'O+',
      allergies: data.allergies || 'None',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    db.patients.push(newPatient);
    saveMockDatabase(db);
    return newPatient;
  },

  updatePatient: async (id: number, data: Partial<Patient>) => {
    await delay(60);
    const db = getMockDatabase();
    const index = db.patients.findIndex((p) => p.id === Number(id));
    if (index !== -1) {
      db.patients[index] = { ...db.patients[index], ...data, updated_at: new Date().toISOString() };
      saveMockDatabase(db);
      return db.patients[index];
    }
    throw new Error('Patient not found');
  },
};

// ==========================================
// 3. DOCTORS SERVICE
// ==========================================
export const doctorsService = {
  getDoctors: async (params?: Record<string, any>) => {
    await delay(50);
    const db = getMockDatabase();
    let results = [...db.doctors];
    if (params?.search) {
      const q = params.search.toLowerCase();
      results = results.filter(
        (d) =>
          d.full_name.toLowerCase().includes(q) ||
          d.specialization.toLowerCase().includes(q)
      );
    }
    return { results, count: results.length };
  },

  getDoctor: async (id: number) => {
    await delay(40);
    const db = getMockDatabase();
    const doc = db.doctors.find((d) => d.id === Number(id));
    if (doc) return doc;
    return db.doctors[0];
  },

  createDoctor: async (data: any) => {
    await delay(80);
    const db = getMockDatabase();
    const newId = db.doctors.length + 1;
    const newDoc: Doctor = {
      id: newId,
      user: db.users.length + 1,
      first_name: data.first_name,
      last_name: data.last_name,
      email: data.email,
      full_name: `Dr. ${data.first_name} ${data.last_name}`.trim(),
      specialization: data.specialization || 'General Medicine',
      license_number: data.license_number || `MD-${Date.now()}`,
      consultation_fee: data.consultation_fee || '150.00',
      biography: data.biography || 'Consultant clinician',
      availability_status: true,
      availabilities: [],
    };
    db.doctors.push(newDoc);
    saveMockDatabase(db);
    return newDoc;
  },

  updateDoctor: async (id: number, data: Partial<Doctor>) => {
    await delay(60);
    const db = getMockDatabase();
    const index = db.doctors.findIndex((d) => d.id === Number(id));
    if (index !== -1) {
      db.doctors[index] = { ...db.doctors[index], ...data };
      saveMockDatabase(db);
      return db.doctors[index];
    }
    throw new Error('Doctor not found');
  },
};

// ==========================================
// 4. APPOINTMENTS SERVICE
// ==========================================
export const appointmentsService = {
  getAppointments: async (params?: Record<string, any>) => {
    await delay(50);
    const db = getMockDatabase();
    let results = [...db.appointments];
    if (params?.doctor) {
      results = results.filter((a) => a.doctor === Number(params.doctor));
    }
    if (params?.patient) {
      results = results.filter((a) => a.patient === Number(params.patient));
    }
    if (params?.status) {
      results = results.filter((a) => a.status === params.status);
    }
    return { results, count: results.length };
  },

  getAvailableSlots: async (_doctorId: number, date: string) => {
    await delay(60);
    const baseDate = date || new Date().toISOString().split('T')[0];
    const times = [
      { start: '09:00', end: '09:30' },
      { start: '09:30', end: '10:00' },
      { start: '10:00', end: '10:30' },
      { start: '10:30', end: '11:00' },
      { start: '11:00', end: '11:30' },
      { start: '11:30', end: '12:00' },
      { start: '14:00', end: '14:30' },
      { start: '14:30', end: '15:00' },
      { start: '15:00', end: '15:30' },
      { start: '15:30', end: '16:00' },
      { start: '16:00', end: '16:30' },
    ];

    return times.map((t) => ({
      start: `${baseDate}T${t.start}:00Z`,
      end: `${baseDate}T${t.end}:00Z`,
      formatted_start: `${t.start} AM`,
      formatted_end: `${t.end} AM`,
    }));
  },

  bookAppointment: async (payload: {
    patient: number;
    doctor: number;
    appointment_start: string;
    appointment_end: string;
    reason: string;
  }) => {
    await delay(100);
    const db = getMockDatabase();
    const patientDetails = db.patients.find((p) => p.id === Number(payload.patient)) || db.patients[0];
    const doctorDetails = db.doctors.find((d) => d.id === Number(payload.doctor)) || db.doctors[0];

    const newAppointment: Appointment = {
      id: Date.now(),
      patient: Number(payload.patient),
      doctor: Number(payload.doctor),
      patient_details: patientDetails,
      doctor_details: doctorDetails,
      appointment_start: payload.appointment_start,
      appointment_end: payload.appointment_end,
      status: 'Confirmed',
      reason: payload.reason || 'General Clinical Consultation',
      created_at: new Date().toISOString(),
    };

    db.appointments.unshift(newAppointment);

    // Also generate a pending invoice for this appointment
    const newInvoice: Invoice = {
      id: Date.now(),
      patient: Number(payload.patient),
      appointment: newAppointment.id,
      patient_details: patientDetails,
      invoice_number: `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      subtotal: doctorDetails.consultation_fee || '150.00',
      tax_amount: '0.00',
      discount_amount: '0.00',
      total_amount: doctorDetails.consultation_fee || '150.00',
      amount_paid: '0.00',
      balance_due: doctorDetails.consultation_fee || '150.00',
      status: 'Unpaid',
      due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      created_at: new Date().toISOString(),
      items: [
        {
          id: Date.now(),
          description: `Clinical Consultation with ${doctorDetails.full_name}`,
          quantity: 1,
          unit_price: doctorDetails.consultation_fee || '150.00',
          line_total: doctorDetails.consultation_fee || '150.00',
        },
      ],
      payments: [],
    };
    db.invoices.unshift(newInvoice);

    db.notifications.unshift({
      id: Date.now(),
      user: patientDetails.user,
      title: 'Appointment Booked',
      message: `Your appointment with ${doctorDetails.full_name} is confirmed for ${new Date(payload.appointment_start).toLocaleDateString()}.`,
      notification_type: 'Appointment',
      is_read: false,
      created_at: new Date().toISOString(),
    });

    saveMockDatabase(db);
    return newAppointment;
  },

  rescheduleAppointment: async (id: number, payload: { appointment_start: string; appointment_end: string; reason?: string }) => {
    await delay(80);
    const db = getMockDatabase();
    const appt = db.appointments.find((a) => a.id === Number(id));
    if (appt) {
      appt.appointment_start = payload.appointment_start;
      appt.appointment_end = payload.appointment_end;
      if (payload.reason) appt.reason = `${appt.reason} (Rescheduled: ${payload.reason})`;
      saveMockDatabase(db);
      return appt;
    }
    throw new Error('Appointment not found');
  },

  cancelAppointment: async (id: number, reason: string) => {
    await delay(70);
    const db = getMockDatabase();
    const appt = db.appointments.find((a) => a.id === Number(id));
    if (appt) {
      appt.status = 'Cancelled';
      appt.cancellation_reason = reason;
      saveMockDatabase(db);
      return appt;
    }
    throw new Error('Appointment not found');
  },

  confirmAppointment: async (id: number) => {
    await delay(60);
    const db = getMockDatabase();
    const appt = db.appointments.find((a) => a.id === Number(id));
    if (appt) {
      appt.status = 'Confirmed';
      saveMockDatabase(db);
      return appt;
    }
    throw new Error('Appointment not found');
  },

  completeAppointment: async (id: number) => {
    await delay(60);
    const db = getMockDatabase();
    const appt = db.appointments.find((a) => a.id === Number(id));
    if (appt) {
      appt.status = 'Completed';
      saveMockDatabase(db);
      return appt;
    }
    throw new Error('Appointment not found');
  },
};

// ==========================================
// 5. MEDICAL RECORDS SERVICE (SOAP NOTES)
// ==========================================
export const medicalRecordsService = {
  getRecords: async (params?: Record<string, any>) => {
    await delay(50);
    const db = getMockDatabase();
    let results = [...db.medicalRecords];
    if (params?.search) {
      const q = params.search.toLowerCase();
      results = results.filter(
        (r) =>
          r.diagnosis.toLowerCase().includes(q) ||
          r.clinical_notes.toLowerCase().includes(q) ||
          r.patient_details?.full_name.toLowerCase().includes(q)
      );
    }
    return { results, count: results.length };
  },

  getRecord: async (id: number) => {
    await delay(40);
    const db = getMockDatabase();
    const rec = db.medicalRecords.find((r) => r.id === Number(id));
    if (rec) return rec;
    return db.medicalRecords[0];
  },

  createRecord: async (payload: {
    patient: number;
    appointment?: number;
    diagnosis: string;
    clinical_notes: string;
    treatment_plan?: string;
  }) => {
    await delay(90);
    const db = getMockDatabase();
    const patientDetails = db.patients.find((p) => p.id === Number(payload.patient)) || db.patients[0];
    const doctorDetails = db.doctors[0];

    const newRecord: MedicalRecord = {
      id: Date.now(),
      patient: Number(payload.patient),
      doctor: doctorDetails.id,
      patient_details: patientDetails,
      doctor_details: doctorDetails,
      appointment: payload.appointment || null,
      diagnosis: payload.diagnosis,
      clinical_notes: payload.clinical_notes,
      treatment_plan: payload.treatment_plan || 'Continue prescribed care protocol.',
      recorded_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      version_number: 1,
      is_latest: true,
      amendment_reason: '',
    };

    db.medicalRecords.unshift(newRecord);
    saveMockDatabase(db);
    return newRecord;
  },

  amendRecord: async (
    id: number,
    payload: {
      diagnosis: string;
      clinical_notes: string;
      treatment_plan?: string;
      amendment_reason: string;
    }
  ) => {
    await delay(90);
    const db = getMockDatabase();
    const existing = db.medicalRecords.find((r) => r.id === Number(id));
    if (existing) {
      existing.diagnosis = payload.diagnosis;
      existing.clinical_notes = payload.clinical_notes;
      if (payload.treatment_plan) existing.treatment_plan = payload.treatment_plan;
      existing.amendment_reason = payload.amendment_reason;
      existing.version_number = (existing.version_number || 1) + 1;
      existing.updated_at = new Date().toISOString();
      saveMockDatabase(db);
      return existing;
    }
    throw new Error('Medical record not found');
  },
};

// ==========================================
// 6. PRESCRIPTIONS SERVICE
// ==========================================
export const prescriptionsService = {
  getPrescriptions: async (_params?: Record<string, any>) => {
    await delay(50);
    const db = getMockDatabase();
    return { results: db.prescriptions, count: db.prescriptions.length };
  },

  createPrescription: async (payload: any) => {
    await delay(80);
    const db = getMockDatabase();
    const patientDetails = db.patients.find((p) => p.id === Number(payload.patient)) || db.patients[0];
    const doctorDetails = db.doctors[0];

    const newPrescription: Prescription = {
      id: Date.now(),
      patient: Number(payload.patient),
      doctor: doctorDetails.id,
      patient_details: patientDetails,
      doctor_details: doctorDetails,
      instructions: payload.instructions || payload.notes || 'Take as indicated by physician.',
      status: 'Active',
      prescribed_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      items: payload.items || [
        {
          id: Date.now(),
          medicine_name: payload.medication_name || 'Standard Medication 500mg',
          dosage: payload.dosage || '1 tablet',
          frequency: payload.frequency || 'Twice daily',
          duration: '7 days',
          quantity: 14,
          additional_instructions: payload.instructions || 'Take with water after meals.',
        },
      ],
    };

    db.prescriptions.unshift(newPrescription);
    saveMockDatabase(db);
    return newPrescription;
  },
};

// ==========================================
// 7. LABORATORY SERVICE
// ==========================================
export const laboratoryService = {
  getOrders: async (_params?: Record<string, any>) => {
    await delay(50);
    const db = getMockDatabase();
    return { results: db.laboratoryOrders, count: db.laboratoryOrders.length };
  },

  createOrder: async (payload: { patient: number; test_name: string; clinical_notes?: string; medical_record?: number }) => {
    await delay(80);
    const db = getMockDatabase();
    const patientDetails = db.patients.find((p) => p.id === Number(payload.patient)) || db.patients[0];

    const newOrder: LaboratoryOrder = {
      id: Date.now(),
      patient: Number(payload.patient),
      ordered_by: 1,
      patient_details: patientDetails,
      ordered_by_details: db.doctors[0],
      test_name: payload.test_name,
      clinical_notes: payload.clinical_notes || '',
      status: 'Ordered',
      ordered_at: new Date().toISOString(),
      reports: [],
    };

    db.laboratoryOrders.unshift(newOrder);
    saveMockDatabase(db);
    return newOrder;
  },

  updateOrderStatus: async (orderId: number, status: string) => {
    await delay(60);
    const db = getMockDatabase();
    const order = db.laboratoryOrders.find((o) => o.id === Number(orderId));
    if (order) {
      order.status = status as any;
      saveMockDatabase(db);
      return order;
    }
    throw new Error('Lab order not found');
  },

  getReports: async (_params?: Record<string, any>) => {
    await delay(50);
    const db = getMockDatabase();
    return { results: db.laboratoryReports, count: db.laboratoryReports.length };
  },

  createReport: async (formData: FormData) => {
    await delay(100);
    const db = getMockDatabase();
    const orderId = Number(formData.get('order') || db.laboratoryOrders[0]?.id || 1);
    const summary = String(formData.get('results_summary') || 'Clinical analysis completed. Values within normal reference interval.');

    const newReport: LaboratoryReport = {
      id: Date.now(),
      laboratory_order: orderId,
      result: summary,
      unit: 'mg/dL',
      reference_range: 'Standard Reference Interval',
      reported_at: new Date().toISOString(),
      verified_by: 5,
      verified_by_name: 'Kevin Patel',
      verification_status: 'Verified',
      version_number: 1,
      amendment_notes: '',
    };

    db.laboratoryReports.unshift(newReport);
    saveMockDatabase(db);
    return newReport;
  },

  verifyReport: async (reportId: number, status: string) => {
    await delay(60);
    const db = getMockDatabase();
    const report = db.laboratoryReports.find((r) => r.id === Number(reportId));
    if (report) {
      report.verification_status = (status === 'Verified' ? 'Verified' : 'Rejected') as any;
      saveMockDatabase(db);
      return report;
    }
    throw new Error('Report not found');
  },
};

// ==========================================
// 8. BILLING & INVOICING SERVICE
// ==========================================
export const billingService = {
  getInvoices: async (params?: Record<string, any>) => {
    await delay(50);
    const db = getMockDatabase();
    let results = [...db.invoices];
    if (params?.status) {
      results = results.filter((i) => i.status === params.status);
    }
    return { results, count: results.length };
  },

  getInvoice: async (id: number) => {
    await delay(40);
    const db = getMockDatabase();
    const inv = db.invoices.find((i) => i.id === Number(id));
    if (inv) return inv;
    return db.invoices[0];
  },

  createInvoice: async (payload: any) => {
    await delay(80);
    const db = getMockDatabase();
    const patientDetails = db.patients.find((p) => p.id === Number(payload.patient)) || db.patients[0];
    const amount = String(payload.total_amount || '150.00');

    const newInvoice: Invoice = {
      id: Date.now(),
      patient: Number(payload.patient),
      appointment: payload.appointment || null,
      patient_details: patientDetails,
      invoice_number: `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      subtotal: amount,
      tax_amount: '0.00',
      discount_amount: '0.00',
      total_amount: amount,
      amount_paid: '0.00',
      balance_due: amount,
      status: 'Unpaid',
      due_date: payload.due_date || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      created_at: new Date().toISOString(),
      items: payload.items || [
        { id: Date.now(), description: 'Hospital Clinical Services', quantity: 1, unit_price: amount, line_total: amount },
      ],
      payments: [],
    };

    db.invoices.unshift(newInvoice);
    saveMockDatabase(db);
    return newInvoice;
  },

  recordPayment: async (invoiceId: number, payload: { amount: string; payment_method: string; notes?: string }) => {
    await delay(100);
    const db = getMockDatabase();
    const inv = db.invoices.find((i) => i.id === Number(invoiceId));
    if (!inv) throw new Error('Invoice not found');

    const payAmt = parseFloat(payload.amount);
    const currentPaid = parseFloat(inv.amount_paid || '0');
    const total = parseFloat(inv.total_amount);

    const newPaid = currentPaid + payAmt;
    const newBalance = Math.max(0, total - newPaid);

    inv.amount_paid = newPaid.toFixed(2);
    inv.balance_due = newBalance.toFixed(2);
    inv.status = newBalance <= 0.01 ? 'Paid' : 'Partially_Paid';

    const newPayment: Payment = {
      id: Date.now(),
      invoice: inv.id,
      amount: payload.amount,
      payment_method: payload.payment_method,
      payment_method_display: payload.payment_method === 'Card' ? 'Credit / Debit Card' : payload.payment_method,
      transaction_reference: `TXN-${Date.now().toString().slice(-6)}`,
      status: 'Completed',
      notes: payload.notes || 'Recorded via electronic billing system.',
      paid_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    };

    inv.payments.push(newPayment);
    db.payments.unshift(newPayment);
    saveMockDatabase(db);

    return {
      message: 'Payment successfully processed and applied to invoice balance.',
      payment: newPayment,
      invoice: inv,
    };
  },

  cancelInvoice: async (invoiceId: number) => {
    await delay(60);
    const db = getMockDatabase();
    const inv = db.invoices.find((i) => i.id === Number(invoiceId));
    if (inv) {
      inv.status = 'Cancelled';
      saveMockDatabase(db);
      return inv;
    }
    throw new Error('Invoice not found');
  },
};

// ==========================================
// 9. INSURANCE SERVICE
// ==========================================
export const insuranceService = {
  getPolicies: async (_params?: Record<string, any>) => {
    await delay(40);
    const db = getMockDatabase();
    return { results: db.insurancePolicies, count: db.insurancePolicies.length };
  },

  getClaims: async (_params?: Record<string, any>) => {
    await delay(40);
    const db = getMockDatabase();
    return { results: db.insuranceClaims, count: db.insuranceClaims.length };
  },

  createClaim: async (payload: { invoice: number; insurance_policy: number; claim_amount: string }) => {
    await delay(90);
    const db = getMockDatabase();
    const newClaim: InsuranceClaim = {
      id: Date.now(),
      invoice: payload.invoice,
      insurance_policy: payload.insurance_policy,
      claim_number: `CLM-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      claim_amount: payload.claim_amount,
      approved_amount: '0.00',
      status: 'Submitted',
      submitted_at: new Date().toISOString(),
    };
    db.insuranceClaims.unshift(newClaim);
    saveMockDatabase(db);
    return newClaim;
  },

  adjudicateClaim: async (claimId: number, payload: { status: string; approved_amount?: string; adjudication_notes?: string }) => {
    await delay(80);
    const db = getMockDatabase();
    const claim = db.insuranceClaims.find((c) => c.id === Number(claimId));
    if (claim) {
      claim.status = payload.status as any;
      if (payload.approved_amount) claim.approved_amount = payload.approved_amount;
      if (payload.adjudication_notes) claim.adjudication_notes = payload.adjudication_notes;
      saveMockDatabase(db);
      return claim;
    }
    throw new Error('Claim not found');
  },
};

// ==========================================
// 10. AUDIT & ANALYTICS SERVICE
// ==========================================
export const auditService = {
  getLogs: async (params?: Record<string, any>) => {
    await delay(50);
    const db = getMockDatabase();
    let results = [...db.auditLogs];
    if (params?.action) {
      results = results.filter((l) => l.action === params.action);
    }
    return { results, count: results.length };
  },

  getAnalytics: async () => {
    await delay(60);
    const db = getMockDatabase();
    return getMockAnalytics(db);
  },
};

// ==========================================
// 11. NOTIFICATIONS SERVICE
// ==========================================
export const notificationsService = {
  getNotifications: async () => {
    await delay(40);
    const db = getMockDatabase();
    return { results: db.notifications, count: db.notifications.length };
  },

  markAsRead: async (id: number) => {
    const db = getMockDatabase();
    const notif = db.notifications.find((n) => n.id === Number(id));
    if (notif) {
      notif.is_read = true;
      saveMockDatabase(db);
    }
    return { status: 'ok' };
  },

  markAllAsRead: async () => {
    const db = getMockDatabase();
    db.notifications.forEach((n) => (n.is_read = true));
    saveMockDatabase(db);
    return { status: 'ok' };
  },
};
