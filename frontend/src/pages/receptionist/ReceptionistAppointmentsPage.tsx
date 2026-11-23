import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Calendar, PlusCircle, Clock, XCircle, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { appointmentsService, patientsService, doctorsService } from '../../services/api';
import { Appointment } from '../../types';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';

export const ReceptionistAppointmentsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [bookModalOpen, setBookModalOpen] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [targetAppt, setTargetAppt] = useState<Appointment | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  // Booking form states
  const [patientId, setPatientId] = useState<number | ''>('');
  const [doctorId, setDoctorId] = useState<number | ''>('');
  const [bookDate, setBookDate] = useState(
    new Date(Date.now() + 86400000).toISOString().split('T')[0]
  );
  const [selectedSlot, setSelectedSlot] = useState<{ start: string; end: string } | null>(null);
  const [reason, setReason] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const { data: apptsData, isLoading } = useQuery({
    queryKey: ['receptionist-all-appts'],
    queryFn: () => appointmentsService.getAppointments(),
  });

  const { data: patientsData } = useQuery({
    queryKey: ['patients-list'],
    queryFn: () => patientsService.getPatients(),
  });

  const { data: doctorsData } = useQuery({
    queryKey: ['doctors-list'],
    queryFn: () => doctorsService.getDoctors(),
  });

  // Fetch slots when doctor and date chosen
  const { data: slotsData, isLoading: slotsLoading } = useQuery({
    queryKey: ['slots', doctorId, bookDate],
    queryFn: () =>
      doctorId ? appointmentsService.getAvailableSlots(Number(doctorId), bookDate) : Promise.resolve([]),
    enabled: !!doctorId && !!bookDate && bookModalOpen,
  });

  const appointments = apptsData?.results || [];
  const patients = patientsData?.results || [];
  const doctors = doctorsData?.results || [];
  const slots = slotsData || [];

  const bookMutation = useMutation({
    mutationFn: (payload: any) => appointmentsService.bookAppointment(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['receptionist-all-appts'] });
      setBookModalOpen(false);
      resetBookingForm();
    },
    onError: (err: any) => {
      setFormError(
        err.response?.data?.detail || 'Booking failed: Time slot conflict detected.'
      );
    },
  });

  const cancelMutation = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) =>
      appointmentsService.cancelAppointment(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['receptionist-all-appts'] });
      setCancelModalOpen(false);
      setTargetAppt(null);
      setCancelReason('');
    },
  });

  const resetBookingForm = () => {
    setPatientId('');
    setDoctorId('');
    setSelectedSlot(null);
    setReason('');
    setFormError(null);
  };

  const handleBookSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientId || !doctorId || !selectedSlot) {
      setFormError('Please select Patient, Doctor, and an available Time Slot.');
      return;
    }
    bookMutation.mutate({
      patient: patientId,
      doctor: doctorId,
      appointment_start: selectedSlot.start,
      appointment_end: selectedSlot.end,
      reason: reason || 'Scheduled via Reception desk',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy-900 tracking-tight">Appointment Desk</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Hospital-wide appointment management, scheduling, and conflict resolution.
          </p>
        </div>

        <Button size="sm" onClick={() => setBookModalOpen(true)}>
          <PlusCircle className="w-4 h-4 mr-1.5" />
          Schedule Appointment
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6">
              <LoadingSkeleton rows={4} />
            </div>
          ) : appointments.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs">No appointments scheduled.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="py-3 px-4">Patient</th>
                    <th className="py-3 px-4">Doctor</th>
                    <th className="py-3 px-4">Specialization</th>
                    <th className="py-3 px-4">Time Window</th>
                    <th className="py-3 px-4">Reason</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {appointments.map((appt) => {
                    const isUpcoming = appt.status === 'Scheduled' || appt.status === 'Confirmed';
                    return (
                      <tr key={appt.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-slate-900">
                          {appt.patient_details?.full_name}
                        </td>
                        <td className="py-3.5 px-4 text-slate-800 font-medium">
                          Dr. {appt.doctor_details?.full_name}
                        </td>
                        <td className="py-3.5 px-4 text-teal-700 font-medium">
                          {appt.doctor_details?.specialization}
                        </td>
                        <td className="py-3.5 px-4 text-slate-600">
                          <div>
                            {new Date(appt.appointment_start).toLocaleDateString([], {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {new Date(appt.appointment_start).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 max-w-xs truncate">{appt.reason}</td>
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
                        <td className="py-3.5 px-4 text-right">
                          {isUpcoming && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-rose-600 border-rose-200 hover:bg-rose-50"
                              onClick={() => {
                                setTargetAppt(appt);
                                setCancelModalOpen(true);
                              }}
                            >
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

      {/* Schedule Appointment Modal */}
      <Modal
        isOpen={bookModalOpen}
        onClose={() => setBookModalOpen(false)}
        title="Schedule Appointment (Desk)"
      >
        <form onSubmit={handleBookSubmit} className="space-y-4 text-xs sm:text-sm">
          {formError && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
              Patient
            </label>
            <select
              value={patientId}
              onChange={(e) => setPatientId(Number(e.target.value))}
              required
              className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            >
              <option value="">-- Select Patient --</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.full_name} ({p.phone || p.email})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
              Attending Physician
            </label>
            <select
              value={doctorId}
              onChange={(e) => {
                setDoctorId(Number(e.target.value));
                setSelectedSlot(null);
              }}
              required
              className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            >
              <option value="">-- Select Doctor --</option>
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>
                  Dr. {d.full_name} ({d.specialization}) - ${d.consultation_fee}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
              Date
            </label>
            <input
              type="date"
              value={bookDate}
              min={new Date().toISOString().split('T')[0]}
              onChange={(e) => {
                setBookDate(e.target.value);
                setSelectedSlot(null);
              }}
              className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            />
          </div>

          {doctorId && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
                Available Time Slots
              </label>
              {slotsLoading ? (
                <LoadingSkeleton rows={2} />
              ) : slots.length === 0 ? (
                <p className="text-xs text-slate-500 italic py-2">
                  No slots available for this physician on selected date.
                </p>
              ) : (
                <div className="grid grid-cols-3 gap-2 max-h-36 overflow-y-auto">
                  {slots.map((s, i) => {
                    const isSelected = selectedSlot?.start === s.start;
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setSelectedSlot(s)}
                        className={`p-2 rounded-lg border text-xs font-medium transition-all ${
                          isSelected
                            ? 'bg-teal-600 text-white border-teal-600'
                            : 'bg-white border-slate-200 hover:bg-teal-50/50'
                        }`}
                      >
                        {s.formatted_start}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
              Consultation Reason
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Follow-up consultation"
              className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setBookModalOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              type="submit"
              disabled={!selectedSlot}
              isLoading={bookMutation.isPending}
            >
              Confirm Booking
            </Button>
          </div>
        </form>
      </Modal>

      {/* Cancellation Modal */}
      <Modal
        isOpen={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        title="Cancel Appointment"
      >
        <div className="space-y-4 text-xs sm:text-sm">
          <p className="text-slate-600">
            Cancel appointment for <strong>{targetAppt?.patient_details?.full_name}</strong> with Dr.{' '}
            <strong>{targetAppt?.doctor_details?.full_name}</strong>?
          </p>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
              Cancellation Reason
            </label>
            <textarea
              rows={3}
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Provide reason for desk records..."
              className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            ></textarea>
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setCancelModalOpen(false)}>
              Keep
            </Button>
            <Button
              variant="danger"
              size="sm"
              isLoading={cancelMutation.isPending}
              onClick={() => {
                if (targetAppt) {
                  cancelMutation.mutate({
                    id: targetAppt.id,
                    reason: cancelReason || 'Desk cancellation',
                  });
                }
              }}
            >
              Cancel Appointment
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
