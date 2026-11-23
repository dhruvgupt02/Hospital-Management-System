import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FlaskConical, PlusCircle, AlertCircle, CheckCircle2 } from 'lucide-react';
import { laboratoryService, patientsService } from '../../services/api';
import { LaboratoryOrder } from '../../types';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';

export const DoctorLabOrdersPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState<number | ''>('');
  const [testName, setTestName] = useState('');
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const { data: ordersData, isLoading } = useQuery({
    queryKey: ['doctor-lab-orders'],
    queryFn: () => laboratoryService.getOrders(),
  });

  const { data: patientsData } = useQuery({
    queryKey: ['patients-list'],
    queryFn: () => patientsService.getPatients(),
  });

  const orders = ordersData?.results || [];
  const patients = patientsData?.results || [];

  const createMutation = useMutation({
    mutationFn: (payload: any) => laboratoryService.createOrder(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctor-lab-orders'] });
      setCreateModalOpen(false);
      setSelectedPatientId('');
      setTestName('');
      setClinicalNotes('');
      setFormError(null);
    },
    onError: (err: any) => {
      setFormError(err.response?.data?.detail || 'Failed to place laboratory order.');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientId || !testName.trim()) {
      setFormError('Please select a patient and enter a test name.');
      return;
    }
    createMutation.mutate({
      patient: selectedPatientId,
      test_name: testName,
      clinical_notes: clinicalNotes,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy-900 tracking-tight">Diagnostic Laboratory Orders</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Order blood work, pathology, and imaging panels for authorized patients.
          </p>
        </div>

        <Button size="sm" onClick={() => setCreateModalOpen(true)}>
          <PlusCircle className="w-4 h-4 mr-1.5" />
          Order Lab Test
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6">
              <LoadingSkeleton rows={4} />
            </div>
          ) : orders.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs">No laboratory orders placed yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="py-3 px-4">Order #</th>
                    <th className="py-3 px-4">Patient</th>
                    <th className="py-3 px-4">Test Name</th>
                    <th className="py-3 px-4">Clinical Indication</th>
                    <th className="py-3 px-4">Order Date</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {orders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-mono text-slate-400">#{ord.id}</td>
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {ord.patient_details?.full_name}
                      </td>
                      <td className="py-3 px-4 text-teal-700 font-semibold">{ord.test_name}</td>
                      <td className="py-3 px-4 text-slate-600 max-w-xs truncate">
                        {ord.clinical_notes || '—'}
                      </td>
                      <td className="py-3 px-4 text-slate-500">
                        {new Date(ord.ordered_at).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={ord.status === 'Completed' ? 'success' : 'primary'}>
                          {ord.status}
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

      {/* Place Order Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Order Diagnostic Laboratory Test"
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm">
          {formError && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
              Select Patient
            </label>
            <select
              value={selectedPatientId}
              onChange={(e) => setSelectedPatientId(Number(e.target.value))}
              required
              className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
            >
              <option value="">-- Choose Patient --</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.full_name} ({p.email})
                </option>
              ))}
            </select>
          </div>

          <Input
            label="Diagnostic Test Name"
            placeholder="e.g. Complete Blood Count (CBC), Lipid Panel, HbA1c"
            value={testName}
            onChange={(e) => setTestName(e.target.value)}
            required
          />

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
              Clinical Indication / Instructions for Laboratory
            </label>
            <textarea
              rows={3}
              value={clinicalNotes}
              onChange={(e) => setClinicalNotes(e.target.value)}
              placeholder="Provide relevant symptoms, suspected pathology, or urgency..."
              className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
            ></textarea>
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <Button variant="outline" size="sm" type="button" onClick={() => setCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" type="submit" isLoading={createMutation.isPending}>
              Submit Lab Order
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
