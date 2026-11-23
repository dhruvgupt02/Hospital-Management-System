import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { UserPlus, CheckCircle2, AlertCircle } from 'lucide-react';
import { patientsService } from '../../services/api';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

export const ReceptionistRegisterPatientPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    date_of_birth: '1990-01-01',
    gender: 'Other',
    address: '',
    emergency_contact: '',
    blood_group: '',
    allergies: '',
  });

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const registerMutation = useMutation({
    mutationFn: (data: any) => patientsService.createPatient(data),
    onSuccess: () => {
      setSuccessMsg('Patient admitted and registered successfully!');
      queryClient.invalidateQueries({ queryKey: ['patients-list'] });
      setTimeout(() => {
        navigate('/receptionist/patients');
      }, 1500);
    },
    onError: (err: any) => {
      setErrorMsg(
        err.response?.data?.email?.[0] ||
        err.response?.data?.detail ||
        'Registration could not be completed. Please check your entries.'
      );
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    registerMutation.mutate(formData);
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-navy-900 tracking-tight">Admit & Register Patient</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Create a new patient identity, demographic profile, and emergency record.
        </p>
      </div>

      <Card>
        <CardContent className="p-6">
          {errorMsg && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-2 text-xs">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center gap-2 text-xs">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="First Name"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                required
              />
              <Input
                label="Last Name"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Email Address"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="patient@example.com"
                required
              />
              <Input
                label="Telephone Number"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+1-555-0100"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Date of Birth"
                name="date_of_birth"
                type="date"
                value={formData.date_of_birth}
                onChange={handleChange}
                required
              />
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Gender
                </label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Emergency Contact"
                name="emergency_contact"
                value={formData.emergency_contact}
                onChange={handleChange}
                placeholder="Contact Name & Phone"
              />
              <Input
                label="Blood Group"
                name="blood_group"
                value={formData.blood_group}
                onChange={handleChange}
                placeholder="e.g. O+, A-, B+"
              />
            </div>

            <Input
              label="Known Allergies"
              name="allergies"
              value={formData.allergies}
              onChange={handleChange}
              placeholder="e.g. Penicillin, Latex"
            />

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
                Residential Address
              </label>
              <textarea
                rows={2}
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="Street address, City, ZIP..."
                className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20"
              ></textarea>
            </div>

            <div className="pt-3 flex justify-end gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => navigate('/receptionist')}>
                Cancel
              </Button>
              <Button type="submit" size="sm" isLoading={registerMutation.isPending}>
                Admit Patient
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
