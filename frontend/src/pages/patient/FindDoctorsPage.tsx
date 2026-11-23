import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Stethoscope, Calendar, Clock, DollarSign, Search, CheckCircle2, AlertCircle } from 'lucide-react';
import { doctorsService, appointmentsService } from '../../services/api';
import { Doctor } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';

export const FindDoctorsPage: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpecialization, setSelectedSpecialization] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [bookingDate, setBookingDate] = useState(
    new Date(Date.now() + 86400000).toISOString().split('T')[0]
  );
  const [selectedSlot, setSelectedSlot] = useState<{ start: string; end: string } | null>(null);
  const [bookingReason, setBookingReason] = useState('');
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [bookingSuccess, setBookingSuccess] = useState<string | null>(null);

  const { data: doctorsData, isLoading } = useQuery({
    queryKey: ['doctors', selectedSpecialization],
    queryFn: () =>
      doctorsService.getDoctors(
        selectedSpecialization ? { specialization: selectedSpecialization } : undefined
      ),
  });

  const doctors = doctorsData?.results || [];

  // Query available slots when doctor and date are chosen
  const { data: slotsData, isLoading: slotsLoading } = useQuery({
    queryKey: ['slots', selectedDoctor?.id, bookingDate],
    queryFn: () =>
      selectedDoctor
        ? appointmentsService.getAvailableSlots(selectedDoctor.id, bookingDate)
        : Promise.resolve([]),
    enabled: !!selectedDoctor && !!bookingDate && bookingModalOpen,
  });

  const slots = slotsData || [];

  const bookMutation = useMutation({
    mutationFn: (payload: any) => appointmentsService.bookAppointment(payload),
    onSuccess: () => {
      setBookingSuccess('Appointment booked successfully!');
      queryClient.invalidateQueries({ queryKey: ['patient-appointments'] });
      queryClient.invalidateQueries({ queryKey: ['slots'] });
      setTimeout(() => {
        setBookingModalOpen(false);
        setBookingSuccess(null);
        setSelectedSlot(null);
        setBookingReason('');
      }, 1500);
    },
    onError: (err: any) => {
      setBookingError(
        err.response?.data?.detail ||
          'Appointment booking failed. The slot may have been concurrently reserved.'
      );
    },
  });

  const handleOpenBooking = (doc: Doctor) => {
    setSelectedDoctor(doc);
    setSelectedSlot(null);
    setBookingError(null);
    setBookingSuccess(null);
    setBookingModalOpen(true);
  };

  const handleConfirmBooking = () => {
    if (!selectedDoctor || !selectedSlot) return;
    if (!user?.patient_id) {
      setBookingError('Patient profile not linked to account.');
      return;
    }
    setBookingError(null);
    bookMutation.mutate({
      patient: user.patient_id,
      doctor: selectedDoctor.id,
      appointment_start: selectedSlot.start,
      appointment_end: selectedSlot.end,
      reason: bookingReason || 'General medical consultation',
    });
  };

  const filteredDoctors = doctors.filter((d) =>
    `${d.full_name} ${d.specialization} ${d.biography}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  const specializations = Array.from(new Set(doctors.map((d) => d.specialization)));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy-900 tracking-tight">Find Specialists & Doctors</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Browse verified physicians, review consultation fees, and schedule an appointment in real-time.
        </p>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search doctor by name, specialty, or condition..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
          />
        </div>
        <select
          value={selectedSpecialization}
          onChange={(e) => setSelectedSpecialization(e.target.value)}
          className="px-4 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
        >
          <option value="">All Specializations</option>
          {specializations.map((spec) => (
            <option key={spec} value={spec}>
              {spec}
            </option>
          ))}
        </select>
      </div>

      {/* Doctor Cards Grid */}
      {isLoading ? (
        <LoadingSkeleton rows={4} />
      ) : filteredDoctors.length === 0 ? (
        <div className="text-center py-12 text-slate-500 text-sm">
          No doctors found matching your criteria.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredDoctors.map((doc) => (
            <Card key={doc.id} className="flex flex-col justify-between">
              <CardContent className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="w-12 h-12 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-700 font-bold text-lg flex-shrink-0">
                    <Stethoscope className="w-6 h-6" />
                  </div>
                  <Badge variant={doc.availability_status ? 'success' : 'secondary'}>
                    {doc.availability_status ? 'Available' : 'Unavailable'}
                  </Badge>
                </div>

                <div>
                  <h3 className="font-bold text-base text-slate-900">Dr. {doc.full_name}</h3>
                  <p className="text-xs font-semibold text-teal-700 mt-0.5">{doc.specialization}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">License: {doc.license_number}</p>
                </div>

                <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">{doc.biography}</p>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Consultation Fee</span>
                    <span className="text-sm font-bold text-navy-900">${doc.consultation_fee}</span>
                  </div>
                  <Button size="sm" onClick={() => handleOpenBooking(doc)}>
                    <Calendar className="w-3.5 h-3.5 mr-1.5" />
                    Book Slot
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Booking Modal */}
      <Modal
        isOpen={bookingModalOpen}
        onClose={() => setBookingModalOpen(false)}
        title={selectedDoctor ? `Book Appointment with Dr. ${selectedDoctor.full_name}` : 'Book Appointment'}
      >
        <div className="space-y-4 text-xs sm:text-sm">
          {bookingError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{bookingError}</span>
            </div>
          )}

          {bookingSuccess && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{bookingSuccess}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
              Select Appointment Date
            </label>
            <input
              type="date"
              value={bookingDate}
              min={new Date().toISOString().split('T')[0]}
              onChange={(e) => {
                setBookingDate(e.target.value);
                setSelectedSlot(null);
              }}
              className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
              Available 30-Minute Time Slots
            </label>
            {slotsLoading ? (
              <LoadingSkeleton rows={2} />
            ) : slots.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-3 bg-slate-50 rounded-lg text-center">
                No open slots available for this doctor on the selected date. Please choose another date.
              </p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-1">
                {slots.map((slot, i) => {
                  const isSelected = selectedSlot?.start === slot.start;
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setSelectedSlot(slot)}
                      className={`p-2 rounded-lg border text-xs font-medium transition-all ${
                        isSelected
                          ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                          : 'bg-white border-slate-200 hover:border-teal-400 hover:bg-teal-50/50 text-slate-700'
                      }`}
                    >
                      {slot.formatted_start}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
              Reason / Chief Complaint
            </label>
            <textarea
              rows={3}
              value={bookingReason}
              onChange={(e) => setBookingReason(e.target.value)}
              placeholder="Describe your symptoms or reason for visit..."
              className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
            ></textarea>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setBookingModalOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={!selectedSlot || bookMutation.isPending}
              isLoading={bookMutation.isPending}
              onClick={handleConfirmBooking}
            >
              Confirm Appointment
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
