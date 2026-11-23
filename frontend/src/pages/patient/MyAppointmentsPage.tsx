import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Calendar, Clock, XCircle, RefreshCw, AlertCircle, CheckCircle2, User } from 'lucide-react';
import { appointmentsService } from '../../services/api';
import { Appointment } from '../../types';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';

export const MyAppointmentsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [selectedAppt, setSelectedAppt] = useState<Appointment | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { data: apptsData, isLoading } = useQuery({
    queryKey: ['patient-appointments'],
    queryFn: () => appointmentsService.getAppointments(),
  });

  const appointments = apptsData?.results || [];

  const cancelMutation = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) =>
      appointmentsService.cancelAppointment(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient-appointments'] });
      setCancelModalOpen(false);
      setSelectedAppt(null);
      setCancelReason('');
    },
    onError: (err: any) => {
      setErrorMsg(err.response?.data?.detail || 'Failed to cancel appointment.');
    },
  });

  const handleOpenCancel = (appt: Appointment) => {
    setSelectedAppt(appt);
    setCancelReason('');
    setErrorMsg(null);
    setCancelModalOpen(true);
  };

  const handleConfirmCancel = () => {
    if (!selectedAppt) return;
    cancelMutation.mutate({ id: selectedAppt.id, reason: cancelReason || 'Patient request' });
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'Confirmed':
        return 'success';
      case 'Scheduled':
        return 'primary';
      case 'Completed':
        return 'info';
      case 'Cancelled':
        return 'danger';
      default:
        return 'secondary';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy-900 tracking-tight">My Appointments</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Track consultation schedules, cancellation policies, and visit statuses.
          </p>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6">
              <LoadingSkeleton rows={4} />
            </div>
          ) : appointments.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              No appointments found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="py-3 px-4">Doctor</th>
                    <th className="py-3 px-4">Specialization</th>
                    <th className="py-3 px-4">Date & Time</th>
                    <th className="py-3 px-4">Reason</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {appointments.map((appt) => {
                    const isUpcoming = appt.status === 'Scheduled' || appt.status === 'Confirmed';
                    return (
                      <tr key={appt.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-slate-900">
                          Dr. {appt.doctor_details?.full_name || 'Physician'}
                        </td>
                        <td className="py-3.5 px-4 text-teal-700 font-medium">
                          {appt.doctor_details?.specialization || 'Consultant'}
                        </td>
                        <td className="py-3.5 px-4 text-slate-600">
                          <div>
                            {new Date(appt.appointment_start).toLocaleDateString([], {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
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
                        <td className="py-3.5 px-4 text-slate-600 max-w-xs truncate">
                          {appt.reason}
                          {appt.cancellation_reason && (
                            <span className="block text-[10px] text-rose-500 italic mt-0.5">
                              Cancelled: {appt.cancellation_reason}
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <Badge variant={getStatusVariant(appt.status)}>{appt.status}</Badge>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          {isUpcoming && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-rose-600 border-rose-200 hover:bg-rose-50"
                              onClick={() => handleOpenCancel(appt)}
                            >
                              <XCircle className="w-3.5 h-3.5 mr-1" />
                              Cancel
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cancellation Modal */}
      <Modal
        isOpen={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        title="Cancel Appointment"
      >
        <div className="space-y-4 text-xs sm:text-sm">
          {errorMsg && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              <span>{errorMsg}</span>
            </div>
          )}
          <p className="text-slate-600">
            Are you sure you want to cancel your appointment with Dr.{' '}
            <strong>{selectedAppt?.doctor_details?.full_name}</strong> on{' '}
            {selectedAppt && new Date(selectedAppt.appointment_start).toLocaleDateString()}?
          </p>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
              Reason for Cancellation
            </label>
            <textarea
              rows={3}
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Please provide the cancellation reason..."
              className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
            ></textarea>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setCancelModalOpen(false)}>
              Keep Appointment
            </Button>
            <Button
              variant="danger"
              size="sm"
              isLoading={cancelMutation.isPending}
              onClick={handleConfirmCancel}
            >
              Confirm Cancellation
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
