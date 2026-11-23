import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Stethoscope, PlusCircle, CheckCircle2, AlertCircle, Edit2 } from 'lucide-react';
import { doctorsService } from '../../services/api';
import { Doctor } from '../../types';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';

export const DoctorManagementPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [createModalOpen, setCreateModalOpen] = useState(false);

  // New Doctor fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [specialization, setSpecialization] = useState('General Medicine');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [consultationFee, setConsultationFee] = useState('100.00');
  const [biography, setBiography] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const { data: doctorsData, isLoading } = useQuery({
    queryKey: ['admin-doctors-list'],
    queryFn: () => doctorsService.getDoctors(),
  });

  const doctors = doctorsData?.results || [];

  const createDoctorMutation = useMutation({
    mutationFn: (payload: any) => doctorsService.createDoctor(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-doctors-list'] });
      setCreateModalOpen(false);
      resetForm();
    },
    onError: (err: any) => {
      setFormError(err.response?.data?.detail || 'Failed to create doctor profile.');
    },
  });

  const resetForm = () => {
    setFirstName('');
    setLastName('');
    setEmail('');
    setSpecialization('General Medicine');
    setLicenseNumber('');
    setConsultationFee('100.00');
    setBiography('');
    setFormError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createDoctorMutation.mutate({
      first_name: firstName,
      last_name: lastName,
      email,
      specialization,
      license_number: licenseNumber,
      consultation_fee: consultationFee,
      biography,
      availability_status: true,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy-900 tracking-tight">Physician & Specialist Roster</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Maintain physician medical licenses, consultation tariffs, and clinical specializations.
          </p>
        </div>

        <Button size="sm" onClick={() => setCreateModalOpen(true)}>
          <PlusCircle className="w-4 h-4 mr-1.5" />
          Onboard New Physician
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6">
              <LoadingSkeleton rows={4} />
            </div>
          ) : doctors.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs">No doctors on roster.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="py-3 px-4">Doctor Name</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">Specialization</th>
                    <th className="py-3 px-4">Medical License #</th>
                    <th className="py-3 px-4">Consultation Fee</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {doctors.map((d) => (
                    <tr key={d.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-900">Dr. {d.full_name}</td>
                      <td className="py-3.5 px-4 text-slate-600 font-mono">{d.email}</td>
                      <td className="py-3.5 px-4 font-semibold text-teal-700">{d.specialization}</td>
                      <td className="py-3.5 px-4 font-mono text-slate-700">{d.license_number}</td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">${d.consultation_fee}</td>
                      <td className="py-3.5 px-4">
                        <Badge variant={d.availability_status ? 'success' : 'secondary'}>
                          {d.availability_status ? 'Active Roster' : 'Inactive'}
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

      {/* Onboard Physician Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Onboard New Physician"
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm">
          {formError && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="First Name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
            />
            <Input
              label="Last Name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
            />
          </div>

          <Input
            label="Physician Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="doctor@medicare.local"
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Specialization"
              value={specialization}
              onChange={(e) => setSpecialization(e.target.value)}
              placeholder="e.g. Cardiology"
              required
            />
            <Input
              label="Medical License #"
              value={licenseNumber}
              onChange={(e) => setLicenseNumber(e.target.value)}
              placeholder="e.g. MD-12345"
              required
            />
          </div>

          <Input
            label="Consultation Tariff Fee ($)"
            type="number"
            step="0.01"
            value={consultationFee}
            onChange={(e) => setConsultationFee(e.target.value)}
            required
          />

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
              Physician Biography & Qualifications
            </label>
            <textarea
              rows={3}
              value={biography}
              onChange={(e) => setBiography(e.target.value)}
              placeholder="Fellowship training, clinical interests, board certifications..."
              className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            ></textarea>
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" type="submit" isLoading={createDoctorMutation.isPending}>
              Onboard Physician
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
