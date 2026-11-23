import React from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Users,
  UserPlus,
  Clock,
  CalendarCheck,
  CheckCircle2,
  Search,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { appointmentsService, auditService } from '../../services/api';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { StatCard } from '../../components/ui/StatCard';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';

export const ReceptionistDashboard: React.FC = () => {
  const { data: analyticsData } = useQuery({
    queryKey: ['receptionist-analytics'],
    queryFn: () => auditService.getAnalytics(),
  });

  const { data: apptsData, isLoading } = useQuery({
    queryKey: ['receptionist-today-appts'],
    queryFn: () => appointmentsService.getAppointments(),
  });

  const metrics = analyticsData?.metrics || {};
  const appointments = apptsData?.results || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy-900 tracking-tight">Reception Operations</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Patient admissions, desk scheduling, and doctor calendar management.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link to="/receptionist/register-patient">
            <Button size="sm">
              <UserPlus className="w-4 h-4 mr-1.5" />
              Register Patient
            </Button>
          </Link>
          <Link to="/receptionist/appointments">
            <Button size="sm" variant="outline">
              <Calendar className="w-4 h-4 mr-1.5" />
              Calendar Desk
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Today's Appointments"
          value={metrics.today_appointments ?? 0}
          icon={Calendar}
          colorScheme="teal"
          description="Patients scheduled today"
        />
        <StatCard
          title="Upcoming Appointments"
          value={metrics.upcoming_appointments ?? 0}
          icon={Clock}
          colorScheme="navy"
          description="Future booked slots"
        />
        <StatCard
          title="Registered Patients"
          value={metrics.total_patients ?? 0}
          icon={Users}
          colorScheme="blue"
          description="Total hospital census"
        />
        <StatCard
          title="Active Doctors"
          value={metrics.active_doctors ?? 0}
          icon={CheckCircle2}
          colorScheme="emerald"
          description="Specialists on roster"
        />
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CalendarCheck className="w-4 h-4 text-teal-600" />
            <CardTitle>Recent Patient Bookings</CardTitle>
          </div>
          <Link to="/receptionist/appointments" className="text-xs font-semibold text-teal-600 hover:text-teal-700">
            View All
          </Link>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <LoadingSkeleton rows={4} />
          ) : appointments.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-xs">No appointments found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="py-2.5 px-3">Patient</th>
                    <th className="py-2.5 px-3">Doctor</th>
                    <th className="py-2.5 px-3">Time</th>
                    <th className="py-2.5 px-3">Reason</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {appointments.slice(0, 6).map((appt) => (
                    <tr key={appt.id} className="hover:bg-slate-50/50">
                      <td className="py-3 px-3 font-bold text-slate-900">
                        {appt.patient_details?.full_name}
                      </td>
                      <td className="py-3 px-3 text-slate-700 font-medium">
                        Dr. {appt.doctor_details?.full_name} ({appt.doctor_details?.specialization})
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
