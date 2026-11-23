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
  DashboardMetrics,
} from '../types';

const API_BASE = '/api';

export const apiClient = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to attach JWT token
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

// Domain API Services
export const authService = {
  login: async (credentials: { email: string; password: string }) => {
    const res = await apiClient.post<{ access: string; refresh: string; user: User }>('/auth/login/', credentials);
    return res.data;
  },
  register: async (payload: any) => {
    const res = await apiClient.post('/auth/register/', payload);
    return res.data;
  },
  getCurrentUser: async () => {
    const res = await apiClient.get<User>('/auth/me/');
    return res.data;
  },
  changePassword: async (passwords: { old_password: string; new_password: string }) => {
    const res = await apiClient.post('/auth/change-password/', passwords);
    return res.data;
  },
  requestPasswordReset: async (email: string) => {
    const res = await apiClient.post('/auth/password-reset/', { email });
    return res.data;
  },
  getUsers: async (params?: Record<string, any>) => {
    const res = await apiClient.get<{ results: User[]; count: number }>('/auth/users/', { params });
    return res.data;
  },
  updateUser: async (id: number, data: Partial<User>) => {
    const res = await apiClient.patch<User>(`/auth/users/${id}/`, data);
    return res.data;
  },
};

export const patientsService = {
  getPatients: async (params?: Record<string, any>) => {
    const res = await apiClient.get<{ results: Patient[]; count: number }>('/patients/', { params });
    return res.data;
  },
  getPatient: async (id: number) => {
    const res = await apiClient.get<Patient>(`/patients/${id}/`);
    return res.data;
  },
  createPatient: async (data: any) => {
    const res = await apiClient.post<Patient>('/patients/', data);
    return res.data;
  },
  updatePatient: async (id: number, data: Partial<Patient>) => {
    const res = await apiClient.patch<Patient>(`/patients/${id}/`, data);
    return res.data;
  },
};

export const doctorsService = {
  getDoctors: async (params?: Record<string, any>) => {
    const res = await apiClient.get<{ results: Doctor[]; count: number }>('/doctors/', { params });
    return res.data;
  },
  getDoctor: async (id: number) => {
    const res = await apiClient.get<Doctor>(`/doctors/${id}/`);
    return res.data;
  },
  createDoctor: async (data: any) => {
    const res = await apiClient.post<Doctor>('/doctors/', data);
    return res.data;
  },
  updateDoctor: async (id: number, data: Partial<Doctor>) => {
    const res = await apiClient.patch<Doctor>(`/doctors/${id}/`, data);
    return res.data;
  },
};

export const appointmentsService = {
  getAppointments: async (params?: Record<string, any>) => {
    const res = await apiClient.get<{ results: Appointment[]; count: number }>('/appointments/', { params });
    return res.data;
  },
  getAvailableSlots: async (doctorId: number, date: string) => {
    const res = await apiClient.get<Array<{ start: string; end: string; formatted_start: string; formatted_end: string }>>(
      '/appointments/available_slots/',
      { params: { doctor_id: doctorId, date } }
    );
    return res.data;
  },
  bookAppointment: async (payload: { patient: number; doctor: number; appointment_start: string; appointment_end: string; reason: string }) => {
    const res = await apiClient.post<Appointment>('/appointments/', payload);
    return res.data;
  },
  rescheduleAppointment: async (id: number, payload: { appointment_start: string; appointment_end: string; reason?: string }) => {
    const res = await apiClient.post<Appointment>(`/appointments/${id}/reschedule/`, payload);
    return res.data;
  },
  cancelAppointment: async (id: number, reason: string) => {
    const res = await apiClient.post<Appointment>(`/appointments/${id}/cancel/`, { cancellation_reason: reason });
    return res.data;
  },
  confirmAppointment: async (id: number) => {
    const res = await apiClient.post<Appointment>(`/appointments/${id}/confirm/`);
    return res.data;
  },
  completeAppointment: async (id: number) => {
    const res = await apiClient.post<Appointment>(`/appointments/${id}/complete/`);
    return res.data;
  },
};

export const medicalRecordsService = {
  getRecords: async (params?: Record<string, any>) => {
    const res = await apiClient.get<{ results: MedicalRecord[]; count: number }>('/medical-records/', { params });
    return res.data;
  },
  getRecord: async (id: number) => {
    const res = await apiClient.get<MedicalRecord>(`/medical-records/${id}/`);
    return res.data;
  },
  createRecord: async (payload: { patient: number; appointment?: number; diagnosis: string; clinical_notes: string; treatment_plan?: string }) => {
    const res = await apiClient.post<MedicalRecord>('/medical-records/', payload);
    return res.data;
  },
  amendRecord: async (id: number, payload: { diagnosis: string; clinical_notes: string; treatment_plan?: string; amendment_reason: string }) => {
    const res = await apiClient.post<MedicalRecord>(`/medical-records/${id}/amend/`, payload);
    return res.data;
  },
};

export const prescriptionsService = {
  getPrescriptions: async (params?: Record<string, any>) => {
    const res = await apiClient.get<{ results: Prescription[]; count: number }>('/prescriptions/', { params });
    return res.data;
  },
  createPrescription: async (payload: any) => {
    const res = await apiClient.post<Prescription>('/prescriptions/', payload);
    return res.data;
  },
};

export const laboratoryService = {
  getOrders: async (params?: Record<string, any>) => {
    const res = await apiClient.get<{ results: LaboratoryOrder[]; count: number }>('/laboratory/orders/', { params });
    return res.data;
  },
  createOrder: async (payload: { patient: number; test_name: string; clinical_notes?: string; medical_record?: number }) => {
    const res = await apiClient.post<LaboratoryOrder>('/laboratory/orders/', payload);
    return res.data;
  },
  updateOrderStatus: async (orderId: number, status: string) => {
    const res = await apiClient.post<LaboratoryOrder>(`/laboratory/orders/${orderId}/update_status/`, { status });
    return res.data;
  },
  getReports: async (params?: Record<string, any>) => {
    const res = await apiClient.get<{ results: LaboratoryReport[]; count: number }>('/laboratory/reports/', { params });
    return res.data;
  },
  createReport: async (formData: FormData) => {
    const res = await apiClient.post<LaboratoryReport>('/laboratory/reports/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },
  verifyReport: async (reportId: number, status: string) => {
    const res = await apiClient.post<LaboratoryReport>(`/laboratory/reports/${reportId}/verify/`, { status });
    return res.data;
  },
};

export const billingService = {
  getInvoices: async (params?: Record<string, any>) => {
    const res = await apiClient.get<{ results: Invoice[]; count: number }>('/billing/invoices/', { params });
    return res.data;
  },
  getInvoice: async (id: number) => {
    const res = await apiClient.get<Invoice>(`/billing/invoices/${id}/`);
    return res.data;
  },
  createInvoice: async (payload: any) => {
    const res = await apiClient.post<Invoice>('/billing/invoices/', payload);
    return res.data;
  },
  recordPayment: async (invoiceId: number, payload: { amount: string; payment_method: string; notes?: string }) => {
    const res = await apiClient.post<{ message: string; payment: Payment; invoice: Invoice }>(
      `/billing/invoices/${invoiceId}/record_payment/`,
      payload
    );
    return res.data;
  },
  cancelInvoice: async (invoiceId: number) => {
    const res = await apiClient.post<Invoice>(`/billing/invoices/${invoiceId}/cancel/`);
    return res.data;
  },
};

export const insuranceService = {
  getPolicies: async (params?: Record<string, any>) => {
    const res = await apiClient.get<{ results: InsurancePolicy[]; count: number }>('/insurance/policies/', { params });
    return res.data;
  },
  getClaims: async (params?: Record<string, any>) => {
    const res = await apiClient.get<{ results: InsuranceClaim[]; count: number }>('/insurance/claims/', { params });
    return res.data;
  },
  createClaim: async (payload: { invoice: number; insurance_policy: number; claim_amount: string }) => {
    const res = await apiClient.post<InsuranceClaim>('/insurance/claims/', payload);
    return res.data;
  },
  adjudicateClaim: async (claimId: number, payload: { status: string; approved_amount?: string; adjudication_notes?: string }) => {
    const res = await apiClient.post<InsuranceClaim>(`/insurance/claims/${claimId}/adjudicate/`, payload);
    return res.data;
  },
};

export const auditService = {
  getLogs: async (params?: Record<string, any>) => {
    const res = await apiClient.get<{ results: AuditLog[]; count: number }>('/audit/logs/', { params });
    return res.data;
  },
  getAnalytics: async () => {
    const res = await apiClient.get<DashboardMetrics>('/audit/analytics/');
    return res.data;
  },
};

export const notificationsService = {
  getNotifications: async () => {
    const res = await apiClient.get<{ results: Notification[]; count: number }>('/notifications/');
    return res.data;
  },
  markAsRead: async (id: number) => {
    const res = await apiClient.post(`/notifications/${id}/mark_as_read/`);
    return res.data;
  },
  markAllAsRead: async () => {
    const res = await apiClient.post('/notifications/mark_all_as_read/');
    return res.data;
  },
};
