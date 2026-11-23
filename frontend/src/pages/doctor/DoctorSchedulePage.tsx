import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CalendarCheck, Clock, CheckCircle2, XCircle, RefreshCw, User } from 'lucide-react';
import { appointmentsService } from '../../services/api';
import { Appointment } from '../../types';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';

export const DoctorSchedulePage: React.FC = () => {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('');

  const { data: apptsData, isLoading } = useQuery({
    queryKey: ['doctor-schedule', statusFilter],
    queryFn: () => appointmentsService.getAppointments(statusFilter ? { status: statusFilter } : undefined),
  });

  const appointments = apptsData?.results || [];

  const confirmMutation = useMutation({
    mutationFn: (id: number) => appointmentsService.confirmAppointment(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['doctor-schedule'] }),
  });

  const completeMutation = useMutation({
    mutationFn: (id: number) => appointmentsService.completeAppointment(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['doctor-schedule'] }),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy-900 tracking-tight">Clinical Schedule</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage your daily appointments, confirm slots, and mark visits as completed.
          </p>
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3.5 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20"
        >
          <option value="">All Statuses</option>
          <option value="Scheduled">Scheduled</option>
          <option value="Confirmed">Confirmed</option>
          <option value="Completed">Completed</option>
          <option value="Cancelled">Cancelled</option>
        </select>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6">
              <LoadingSkeleton rows={4} />
            </div>
          ) : appointments.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs">No schedule entries found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="py-3 px-4">Patient Name</th>
                    <th className="py-3 px-4">Slot Time</th>
                    <th className="py-3 px-4">Reason</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {appointments.map((appt) => (
                    <tr key={appt.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {appt.patient_details?.full_name || 'Patient'}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        <div className="font-medium text-slate-800">
                          {new Date(appt.appointment_start).toLocaleDateString([], {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {new Date(appt.appointment_start).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}{' '}
                          -{' '}
                          {new Date(appt.appointment_end).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 max-w-sm truncate">{appt.reason}</td>
                      <td className="py-3.5 px-4">
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
                      <td className="py-3.5 px-4 text-right space-x-1.5">
                        {appt.status === 'Scheduled' && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-teal-700 border-teal-200 hover:bg-teal-50"
                            onClick={() => confirmMutation.mutate(appt.id)}
                            isLoading={confirmMutation.isPending}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                            Confirm
                          </Button>
                        )}
                        {appt.status === 'Confirmed' && (
                          <Button
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700 text-white"
                            onClick={() => completeMutation.mutate(appt.id)}
                            isLoading={completeMutation.isPending}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                            Complete Visit
                          </Button>
                        )}
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
