import React from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Users,
  FileText,
  Pill,
  Clock,
  CheckCircle2,
  Stethoscope,
  Activity,
  PlusCircle,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';
import { appointmentsService, auditService } from '../../services/api';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { StatCard } from '../../components/ui/StatCard';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';

export const DoctorDashboard: React.FC = () => {
  const { user } = useAuth();

  const { data: analyticsData, isLoading: analyticsLoading } = useQuery({
    queryKey: ['doctor-analytics'],
    queryFn: () => auditService.getAnalytics(),
  });

  const { data: apptsData, isLoading: apptsLoading } = useQuery({
    queryKey: ['doctor-appointments'],
    queryFn: () => appointmentsService.getAppointments(),
  });

  const metrics = analyticsData?.metrics || {};
  const appointments = apptsData?.results || [];

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-navy-900 via-navy-800 to-teal-800 rounded-2xl p-6 sm:p-8 text-white shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-teal-300 text-xs font-semibold uppercase tracking-wider">
              Physician Workspace
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold mt-1">
              Dr. {user?.first_name} {user?.last_name}
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm mt-1">
              MediCare Clinical Management Portal
            </p>
          </div>
          <div className="flex flex-wrap gap-2.5">
            <Link to="/doctor/records">
              <Button size="sm" className="bg-teal-500 hover:bg-teal-600 text-white">
                <PlusCircle className="w-4 h-4 mr-1.5" />
                Record SOAP Notes
              </Button>
            </Link>
            <Link to="/doctor/prescriptions">
              <Button size="sm" variant="outline" className="border-white/30 text-white hover:bg-white/10">
                <Pill className="w-4 h-4 mr-1.5" />
                Write Prescription
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Today's Appointments"
          value={metrics.today_appointments ?? 0}
          icon={Calendar}
          colorScheme="teal"
          description="Patients scheduled today"
        />
        <StatCard
          title="Upcoming Consults"
          value={metrics.upcoming_appointments ?? 0}
          icon={Clock}
          colorScheme="navy"
          description="Scheduled & confirmed visits"
        />
        <StatCard
          title="Completed Visits"
          value={metrics.completed_appointments ?? 0}
          icon={CheckCircle2}
          colorScheme="emerald"
          description="Total clinical encounters"
        />
        <StatCard
          title="Patients Treated"
          value={metrics.total_patients_treated ?? 0}
          icon={Users}
          colorScheme="blue"
          description="Unique clinical roster"
        />
      </div>

      {/* Recent Appointments table */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-teal-600" />
            <CardTitle>Assigned Consultations</CardTitle>
          </div>
          <Link to="/doctor/schedule" className="text-xs font-semibold text-teal-600 hover:text-teal-700">
            Open Full Calendar
          </Link>
        </CardHeader>
        <CardContent>
          {apptsLoading ? (
            <LoadingSkeleton rows={3} />
          ) : appointments.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-xs">No appointments scheduled.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="py-2.5 px-3">Patient</th>
                    <th className="py-2.5 px-3">Date & Time</th>
                    <th className="py-2.5 px-3">Chief Complaint</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {appointments.slice(0, 5).map((appt) => (
                    <tr key={appt.id} className="hover:bg-slate-50/50">
                      <td className="py-3 px-3 font-bold text-slate-900">
                        {appt.patient_details?.full_name || 'Patient'}
                      </td>
                      <td className="py-3 px-3 text-slate-600">
                        {new Date(appt.appointment_start).toLocaleString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="py-3 px-3 text-slate-600 max-w-xs truncate">{appt.reason}</td>
                      <td className="py-3 px-3">
                        <Badge
                          variant={
                            appt.status === 'Confirmed'
                              ? 'success'
                              : appt.status === 'Completed'
                              ? 'info'
                              : appt.status === 'Cancelled'
                              ? 'danger'
                              : 'primary'
                          }
                        >
                          {appt.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <Link to="/doctor/records">
                          <Button size="sm" variant="outline">
                            Enter Notes
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
