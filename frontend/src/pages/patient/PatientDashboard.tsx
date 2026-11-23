import React from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  FileText,
  Pill,
  CreditCard,
  Clock,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Stethoscope,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';
import {
  appointmentsService,
  prescriptionsService,
  medicalRecordsService,
  billingService,
} from '../../services/api';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { StatCard } from '../../components/ui/StatCard';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';

export const PatientDashboard: React.FC = () => {
  const { user } = useAuth();

  const { data: apptsData, isLoading: apptsLoading } = useQuery({
    queryKey: ['patient-appointments'],
    queryFn: () => appointmentsService.getAppointments(),
  });

  const { data: recordsData, isLoading: recordsLoading } = useQuery({
    queryKey: ['patient-records'],
    queryFn: () => medicalRecordsService.getRecords(),
  });

  const { data: rxData, isLoading: rxLoading } = useQuery({
    queryKey: ['patient-prescriptions'],
    queryFn: () => prescriptionsService.getPrescriptions(),
  });

  const { data: invoicesData, isLoading: invLoading } = useQuery({
    queryKey: ['patient-invoices'],
    queryFn: () => billingService.getInvoices(),
  });

  const appointments = apptsData?.results || [];
  const records = recordsData?.results || [];
  const prescriptions = rxData?.results || [];
  const invoices = invoicesData?.results || [];

  const upcomingAppts = appointments.filter(
    (a) => a.status === 'Scheduled' || a.status === 'Confirmed'
  );
  const unpaidInvoices = invoices.filter(
    (i) => i.status === 'Unpaid' || i.status === 'Partially_Paid'
  );

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-teal-700 via-teal-600 to-navy-800 rounded-2xl p-6 sm:p-8 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <span className="text-teal-200 text-xs font-semibold uppercase tracking-wider">
            Patient Portal
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold mt-1">
            Welcome back, {user?.first_name}!
          </h1>
          <p className="text-teal-100/90 text-xs sm:text-sm mt-2 leading-relaxed">
            Manage your medical appointments, review physician diagnoses, download verified lab
            reports, and settle billing securely.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link to="/patient/doctors">
              <Button variant="secondary" size="sm" className="bg-white text-teal-800 hover:bg-teal-50">
                <Stethoscope className="w-4 h-4 mr-1.5" />
                Book New Appointment
              </Button>
            </Link>
            <Link to="/patient/records">
              <Button variant="outline" size="sm" className="border-white/40 text-white hover:bg-white/10">
                <FileText className="w-4 h-4 mr-1.5" />
                View Health Records
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Upcoming Visits"
          value={upcomingAppts.length}
          icon={Calendar}
          colorScheme="teal"
          description={upcomingAppts.length > 0 ? 'Next visit scheduled' : 'No upcoming visits'}
        />
        <StatCard
          title="Clinical Records"
          value={records.length}
          icon={FileText}
          colorScheme="navy"
          description="Electronic history on file"
        />
        <StatCard
          title="Active Prescriptions"
          value={prescriptions.filter((p) => p.status === 'Active').length}
          icon={Pill}
          colorScheme="emerald"
          description="Medications currently active"
        />
        <StatCard
          title="Unpaid Invoices"
          value={unpaidInvoices.length}
          icon={CreditCard}
          colorScheme={unpaidInvoices.length > 0 ? 'amber' : 'teal'}
          description={unpaidInvoices.length > 0 ? 'Action required' : 'All accounts settled'}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Appointments Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-teal-600" />
              <CardTitle>Upcoming Appointments</CardTitle>
            </div>
            <Link to="/patient/appointments" className="text-xs font-semibold text-teal-600 hover:text-teal-700">
              View all
            </Link>
          </CardHeader>
          <CardContent>
            {apptsLoading ? (
              <LoadingSkeleton rows={3} />
            ) : upcomingAppts.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-xs">
                No upcoming appointments.{' '}
                <Link to="/patient/doctors" className="text-teal-600 underline font-medium">
                  Schedule one now
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingAppts.slice(0, 3).map((appt) => (
                  <div
                    key={appt.id}
                    className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/50 flex items-center justify-between gap-4"
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-800">
                        Dr. {appt.doctor_details?.user ? appt.doctor_details?.full_name : 'Specialist'}
                      </p>
                      <p className="text-[11px] text-teal-700 font-medium">
                        {appt.doctor_details?.specialization || 'Clinical Consult'}
                      </p>
                      <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {new Date(appt.appointment_start).toLocaleDateString([], {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                        })}{' '}
                        at{' '}
                        {new Date(appt.appointment_start).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                    <Badge variant={appt.status === 'Confirmed' ? 'success' : 'primary'}>
                      {appt.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Medical Diagnoses Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-navy-700" />
              <CardTitle>Recent Clinical Records</CardTitle>
            </div>
            <Link to="/patient/records" className="text-xs font-semibold text-teal-600 hover:text-teal-700">
              Full history
            </Link>
          </CardHeader>
          <CardContent>
            {recordsLoading ? (
              <LoadingSkeleton rows={3} />
            ) : records.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-xs">
                No medical records recorded yet.
              </div>
            ) : (
              <div className="space-y-3">
                {records.slice(0, 3).map((rec) => (
                  <div key={rec.id} className="p-3.5 rounded-xl border border-slate-200/80 bg-white">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-slate-900">{rec.diagnosis}</span>
                      <Badge variant="outline" className="text-[10px]">
                        v{rec.version_number}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-600 line-clamp-2">{rec.treatment_plan || rec.clinical_notes}</p>
                    <p className="text-[10px] text-slate-400 mt-2">
                      Encounter Date: {new Date(rec.recorded_at).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
