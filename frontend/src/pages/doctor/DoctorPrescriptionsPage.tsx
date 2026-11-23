import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Pill, PlusCircle, Trash2, CheckCircle2, AlertCircle, FileText } from 'lucide-react';
import { prescriptionsService, patientsService } from '../../services/api';
import { Prescription, PrescriptionItem } from '../../types';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';

export const DoctorPrescriptionsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState<number | ''>('');
  const [instructions, setInstructions] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Dynamic medication items list
  const [items, setItems] = useState<PrescriptionItem[]>([
    {
      medicine_name: '',
      dosage: '',
      frequency: '',
      duration: '',
      quantity: 1,
      additional_instructions: '',
    },
  ]);

  const { data: rxData, isLoading } = useQuery({
    queryKey: ['doctor-prescriptions'],
    queryFn: () => prescriptionsService.getPrescriptions(),
  });

  const { data: patientsData } = useQuery({
    queryKey: ['patients-list'],
    queryFn: () => patientsService.getPatients(),
  });

  const prescriptions = rxData?.results || [];
  const patients = patientsData?.results || [];

  const createMutation = useMutation({
    mutationFn: (payload: any) => prescriptionsService.createPrescription(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctor-prescriptions'] });
      setCreateModalOpen(false);
      resetForm();
    },
    onError: (err: any) => {
      setFormError(err.response?.data?.detail || 'Failed to issue prescription.');
    },
  });

  const resetForm = () => {
    setSelectedPatientId('');
    setInstructions('');
    setItems([
      {
        medicine_name: '',
        dosage: '',
        frequency: '',
        duration: '',
        quantity: 1,
        additional_instructions: '',
      },
    ]);
    setFormError(null);
  };

  const handleAddItem = () => {
    setItems([
      ...items,
      {
        medicine_name: '',
        dosage: '',
        frequency: '',
        duration: '',
        quantity: 1,
        additional_instructions: '',
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const handleItemChange = (index: number, field: keyof PrescriptionItem, value: any) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientId) {
      setFormError('Please select a patient.');
      return;
    }
    for (const it of items) {
      if (!it.medicine_name || !it.dosage || !it.frequency) {
        setFormError('All medication items must include Medicine Name, Dosage, and Frequency.');
        return;
      }
    }

    createMutation.mutate({
      patient: selectedPatientId,
      instructions,
      items,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy-900 tracking-tight">Prescription Directives</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Issue and dispatch electronic multi-item pharmaceutical prescriptions.
          </p>
        </div>

        <Button size="sm" onClick={() => setCreateModalOpen(true)}>
          <PlusCircle className="w-4 h-4 mr-1.5" />
          Write Prescription
        </Button>
      </div>

      {isLoading ? (
        <LoadingSkeleton rows={4} />
      ) : prescriptions.length === 0 ? (
        <div className="py-12 text-center text-slate-500 text-xs">No authored prescriptions found.</div>
      ) : (
        <div className="space-y-5">
          {prescriptions.map((rx) => (
            <Card key={rx.id}>
              <CardHeader>
                <div>
                  <div className="flex items-center gap-2">
                    <CardTitle>Rx #{rx.id}</CardTitle>
                    <Badge variant={rx.status === 'Active' ? 'success' : 'secondary'}>
                      {rx.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Patient: <strong>{rx.patient_details?.full_name}</strong> on{' '}
                    {new Date(rx.prescribed_at).toLocaleDateString()}
                  </p>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {rx.instructions && (
                  <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <strong>Instructions:</strong> {rx.instructions}
                  </p>
                )}

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                      <tr>
                        <th className="py-2.5 px-3">Medicine</th>
                        <th className="py-2.5 px-3">Dosage</th>
                        <th className="py-2.5 px-3">Frequency</th>
                        <th className="py-2.5 px-3">Duration</th>
                        <th className="py-2.5 px-3">Qty</th>
                        <th className="py-2.5 px-3">Directions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {rx.items?.map((item, idx) => (
                        <tr key={idx}>
                          <td className="py-2.5 px-3 font-bold text-slate-900">{item.medicine_name}</td>
                          <td className="py-2.5 px-3 text-slate-600 font-medium">{item.dosage}</td>
                          <td className="py-2.5 px-3 text-slate-600">{item.frequency}</td>
                          <td className="py-2.5 px-3 text-slate-600">{item.duration}</td>
                          <td className="py-2.5 px-3 text-slate-800 font-bold">{item.quantity}</td>
                          <td className="py-2.5 px-3 text-slate-500 italic max-w-xs truncate">
                            {item.additional_instructions || '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Write Prescription Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Author Medical Prescription"
        maxWidth="2xl"
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

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Medication Line Items ({items.length})
              </label>
              <Button type="button" size="sm" variant="outline" onClick={handleAddItem}>
                <PlusCircle className="w-3.5 h-3.5 mr-1" />
                Add Medication
              </Button>
            </div>

            <div className="space-y-3">
              {items.map((item, idx) => (
                <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-700">Medicine #{idx + 1}</span>
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        className="text-rose-500 hover:text-rose-700 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <input
                      type="text"
                      placeholder="Medicine Name (e.g. Amoxicillin)"
                      value={item.medicine_name}
                      onChange={(e) => handleItemChange(idx, 'medicine_name', e.target.value)}
                      required
                      className="px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                    />
                    <input
                      type="text"
                      placeholder="Dosage (e.g. 500 mg)"
                      value={item.dosage}
                      onChange={(e) => handleItemChange(idx, 'dosage', e.target.value)}
                      required
                      className="px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                    />
                    <input
                      type="text"
                      placeholder="Frequency (e.g. TID with meals)"
                      value={item.frequency}
                      onChange={(e) => handleItemChange(idx, 'frequency', e.target.value)}
                      required
                      className="px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <input
                      type="text"
                      placeholder="Duration (e.g. 7 days)"
                      value={item.duration}
                      onChange={(e) => handleItemChange(idx, 'duration', e.target.value)}
                      className="px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                    />
                    <input
                      type="number"
                      placeholder="Quantity"
                      min={1}
                      value={item.quantity}
                      onChange={(e) => handleItemChange(idx, 'quantity', Number(e.target.value))}
                      className="px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                    />
                    <input
                      type="text"
                      placeholder="Special Directions"
                      value={item.additional_instructions}
                      onChange={(e) => handleItemChange(idx, 'additional_instructions', e.target.value)}
                      className="px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
              General Patient Advice & Precautions
            </label>
            <textarea
              rows={2}
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="e.g. Finish entire course of antibiotics. Avoid alcohol."
              className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
            ></textarea>
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <Button variant="outline" size="sm" type="button" onClick={() => setCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" type="submit" isLoading={createMutation.isPending}>
              Dispatch Prescription
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
