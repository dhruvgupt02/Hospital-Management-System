import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { User, Phone, MapPin, AlertTriangle, Heart, Shield, CheckCircle2, AlertCircle } from 'lucide-react';
import { patientsService } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';

export const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    phone: '',
    address: '',
    emergency_contact: '',
    blood_group: '',
    allergies: '',
  });

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { data: patient, isLoading } = useQuery({
    queryKey: ['patient-profile', user?.patient_id],
    queryFn: () => (user?.patient_id ? patientsService.getPatient(user.patient_id) : Promise.resolve(null)),
    enabled: !!user?.patient_id,
  });

  useEffect(() => {
    if (patient) {
      setFormData({
        phone: patient.phone || '',
        address: patient.address || '',
        emergency_contact: patient.emergency_contact || '',
        blood_group: patient.blood_group || '',
        allergies: patient.allergies || '',
      });
    }
  }, [patient]);

  const updateMutation = useMutation({
    mutationFn: (data: any) => patientsService.updatePatient(user!.patient_id!, data),
    onSuccess: () => {
      setSavedSuccess(true);
      setErrorMsg(null);
      queryClient.invalidateQueries({ queryKey: ['patient-profile'] });
      setTimeout(() => setSavedSuccess(false), 2500);
    },
    onError: (err: any) => {
      setErrorMsg('Failed to update profile information.');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.patient_id) return;
    updateMutation.mutate(formData);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-navy-900 tracking-tight">Patient Demographic Profile</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Maintain your confidential contact details, clinical allergies, and emergency notification directives.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-700 font-bold text-lg">
              {user?.first_name?.[0]}
              {user?.last_name?.[0]}
            </div>
            <div>
              <CardTitle>{user?.full_name}</CardTitle>
              <p className="text-xs text-slate-500 mt-0.5">{user?.email}</p>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <LoadingSkeleton rows={4} />
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {savedSuccess && (
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center gap-2 text-xs">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  <span>Profile updated and audited successfully.</span>
                </div>
              )}

              {errorMsg && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-2 text-xs">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Contact Phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+1-555-0100"
                />

                <Input
                  label="Emergency Contact"
                  value={formData.emergency_contact}
                  onChange={(e) => setFormData({ ...formData, emergency_contact: e.target.value })}
                  placeholder="e.g. Mary Doe (+1-555-0102)"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Blood Group"
                  value={formData.blood_group}
                  onChange={(e) => setFormData({ ...formData, blood_group: e.target.value })}
                  placeholder="e.g. O+, A-, B+"
                />

                <Input
                  label="Known Clinical Allergies"
                  value={formData.allergies}
                  onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                  placeholder="e.g. Penicillin, Sulfa, Peanuts"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Residential Address
                </label>
                <textarea
                  rows={2}
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Street address, City, State, ZIP..."
                  className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                ></textarea>
              </div>

              <div className="pt-2 flex justify-end">
                <Button type="submit" size="md" isLoading={updateMutation.isPending}>
                  Save Profile Changes
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
