import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { DashboardLayout } from './layouts/DashboardLayout';
import { UserRole } from './types';

// Public Pages
import { LandingPage } from './pages/public/LandingPage';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';

// Patient Pages
import { PatientDashboard } from './pages/patient/PatientDashboard';
import { FindDoctorsPage } from './pages/patient/FindDoctorsPage';
import { MyAppointmentsPage } from './pages/patient/MyAppointmentsPage';
import { MedicalHistoryPage } from './pages/patient/MedicalHistoryPage';
import { PrescriptionsPage } from './pages/patient/PrescriptionsPage';
import { LabReportsPage } from './pages/patient/LabReportsPage';
import { BillingPage } from './pages/patient/BillingPage';
import { ProfilePage } from './pages/patient/ProfilePage';

// Doctor Pages
import { DoctorDashboard } from './pages/doctor/DoctorDashboard';
import { DoctorSchedulePage } from './pages/doctor/DoctorSchedulePage';
import { AuthorizedPatientsPage } from './pages/doctor/AuthorizedPatientsPage';
import { DoctorMedicalRecordsPage } from './pages/doctor/DoctorMedicalRecordsPage';
import { DoctorPrescriptionsPage } from './pages/doctor/DoctorPrescriptionsPage';
import { DoctorLabOrdersPage } from './pages/doctor/DoctorLabOrdersPage';

// Receptionist Pages
import { ReceptionistDashboard } from './pages/receptionist/ReceptionistDashboard';
import { ReceptionistPatientsPage } from './pages/receptionist/ReceptionistPatientsPage';
import { ReceptionistRegisterPatientPage } from './pages/receptionist/ReceptionistRegisterPatientPage';
import { ReceptionistAppointmentsPage } from './pages/receptionist/ReceptionistAppointmentsPage';

// Laboratory Pages
import { LabDashboard } from './pages/laboratory/LabDashboard';
import { LabOrdersPage } from './pages/laboratory/LabOrdersPage';
import { LabReportsHistoryPage } from './pages/laboratory/LabReportsHistoryPage';

// Billing Pages
import { BillingDashboard } from './pages/billing/BillingDashboard';
import { InvoicesManagementPage } from './pages/billing/InvoicesManagementPage';
import { RecordedPaymentsPage } from './pages/billing/RecordedPaymentsPage';
import { InsuranceClaimsPage } from './pages/billing/InsuranceClaimsPage';

// Admin Pages
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { UserManagementPage } from './pages/admin/UserManagementPage';
import { DoctorManagementPage } from './pages/admin/DoctorManagementPage';
import { AuditLogsPage } from './pages/admin/AuditLogsPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 1000 * 60 * 2, // 2 minutes
    },
  },
});

export const getRoleHome = (role: UserRole | null): string => {
  switch (role) {
    case 'PATIENT':
      return '/patient';
    case 'DOCTOR':
      return '/doctor';
    case 'RECEPTIONIST':
      return '/receptionist';
    case 'LAB_TECHNICIAN':
      return '/lab';
    case 'BILLING_STAFF':
      return '/billing';
    case 'ADMIN':
      return '/admin';
    default:
      return '/login';
  }
};

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { isAuthenticated, isLoading, role } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-medium text-slate-500">Authenticating MediCare session...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && role && !allowedRoles.includes(role)) {
    return <Navigate to={getRoleHome(role)} replace />;
  }

  return <>{children}</>;
};

const PublicOnlyRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading, role } = useAuth();

  if (isLoading) {
    return null;
  }

  if (isAuthenticated && role) {
    return <Navigate to={getRoleHome(role)} replace />;
  }

  return <>{children}</>;
};

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Marketing & Auth */}
            <Route path="/" element={<LandingPage />} />
            <Route
              path="/login"
              element={
                <PublicOnlyRoute>
                  <LoginPage />
                </PublicOnlyRoute>
              }
            />
            <Route
              path="/register"
              element={
                <PublicOnlyRoute>
                  <RegisterPage />
                </PublicOnlyRoute>
              }
            />
            <Route
              path="/forgot-password"
              element={
                <PublicOnlyRoute>
                  <ForgotPasswordPage />
                </PublicOnlyRoute>
              }
            />

            {/* Protected App Routes inside DashboardLayout */}
            <Route
              element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              {/* Patient Routes */}
              <Route
                path="/patient"
                element={
                  <ProtectedRoute allowedRoles={['PATIENT']}>
                    <PatientDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/patient/doctors"
                element={
                  <ProtectedRoute allowedRoles={['PATIENT']}>
                    <FindDoctorsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/patient/appointments"
                element={
                  <ProtectedRoute allowedRoles={['PATIENT']}>
                    <MyAppointmentsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/patient/records"
                element={
                  <ProtectedRoute allowedRoles={['PATIENT']}>
                    <MedicalHistoryPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/patient/prescriptions"
                element={
                  <ProtectedRoute allowedRoles={['PATIENT']}>
                    <PrescriptionsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/patient/lab-reports"
                element={
                  <ProtectedRoute allowedRoles={['PATIENT']}>
                    <LabReportsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/patient/billing"
                element={
                  <ProtectedRoute allowedRoles={['PATIENT']}>
                    <BillingPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/patient/profile"
                element={
                  <ProtectedRoute allowedRoles={['PATIENT']}>
                    <ProfilePage />
                  </ProtectedRoute>
                }
              />

              {/* Doctor Routes */}
              <Route
                path="/doctor"
                element={
                  <ProtectedRoute allowedRoles={['DOCTOR']}>
                    <DoctorDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/doctor/schedule"
                element={
                  <ProtectedRoute allowedRoles={['DOCTOR']}>
                    <DoctorSchedulePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/doctor/patients"
                element={
                  <ProtectedRoute allowedRoles={['DOCTOR']}>
                    <AuthorizedPatientsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/doctor/records"
                element={
                  <ProtectedRoute allowedRoles={['DOCTOR']}>
                    <DoctorMedicalRecordsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/doctor/prescriptions"
                element={
                  <ProtectedRoute allowedRoles={['DOCTOR']}>
                    <DoctorPrescriptionsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/doctor/lab-orders"
                element={
                  <ProtectedRoute allowedRoles={['DOCTOR']}>
                    <DoctorLabOrdersPage />
                  </ProtectedRoute>
                }
              />

              {/* Receptionist Routes */}
              <Route
                path="/receptionist"
                element={
                  <ProtectedRoute allowedRoles={['RECEPTIONIST']}>
                    <ReceptionistDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/receptionist/patients"
                element={
                  <ProtectedRoute allowedRoles={['RECEPTIONIST']}>
                    <ReceptionistPatientsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/receptionist/register-patient"
                element={
                  <ProtectedRoute allowedRoles={['RECEPTIONIST']}>
                    <ReceptionistRegisterPatientPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/receptionist/appointments"
                element={
                  <ProtectedRoute allowedRoles={['RECEPTIONIST']}>
                    <ReceptionistAppointmentsPage />
                  </ProtectedRoute>
                }
              />

              {/* Laboratory Routes */}
              <Route
                path="/lab"
                element={
                  <ProtectedRoute allowedRoles={['LAB_TECHNICIAN']}>
                    <LabDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/lab/orders"
                element={
                  <ProtectedRoute allowedRoles={['LAB_TECHNICIAN']}>
                    <LabOrdersPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/lab/reports"
                element={
                  <ProtectedRoute allowedRoles={['LAB_TECHNICIAN']}>
                    <LabReportsHistoryPage />
                  </ProtectedRoute>
                }
              />

              {/* Billing Routes */}
              <Route
                path="/billing"
                element={
                  <ProtectedRoute allowedRoles={['BILLING_STAFF']}>
                    <BillingDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/billing/invoices"
                element={
                  <ProtectedRoute allowedRoles={['BILLING_STAFF']}>
                    <InvoicesManagementPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/billing/payments"
                element={
                  <ProtectedRoute allowedRoles={['BILLING_STAFF']}>
                    <RecordedPaymentsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/billing/claims"
                element={
                  <ProtectedRoute allowedRoles={['BILLING_STAFF']}>
                    <InsuranceClaimsPage />
                  </ProtectedRoute>
                }
              />

              {/* Admin Routes */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/users"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN']}>
                    <UserManagementPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/doctors"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN']}>
                    <DoctorManagementPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/audit"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN']}>
                    <AuditLogsPage />
                  </ProtectedRoute>
                }
              />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
