import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FlaskConical, Upload, CheckCircle2, AlertCircle, FileText, PlusCircle } from 'lucide-react';
import { laboratoryService } from '../../services/api';
import { LaboratoryOrder } from '../../types';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';

export const LabOrdersPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<LaboratoryOrder | null>(null);

  // Report form fields
  const [result, setResult] = useState('');
  const [unit, setUnit] = useState('');
  const [referenceRange, setReferenceRange] = useState('');
  const [reportFile, setReportFile] = useState<File | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const { data: ordersData, isLoading } = useQuery({
    queryKey: ['lab-orders-list'],
    queryFn: () => laboratoryService.getOrders(),
  });

  const orders = ordersData?.results || [];

  const createReportMutation = useMutation({
    mutationFn: (formData: FormData) => laboratoryService.createReport(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lab-orders-list'] });
      queryClient.invalidateQueries({ queryKey: ['lab-reports-list'] });
      setReportModalOpen(false);
      resetForm();
    },
    onError: (err: any) => {
      setFormError(err.response?.data?.detail || 'Failed to submit test report.');
    },
  });

  const resetForm = () => {
    setSelectedOrder(null);
    setResult('');
    setUnit('');
    setReferenceRange('');
    setReportFile(null);
    setFormError(null);
  };

  const handleOpenReportModal = (order: LaboratoryOrder) => {
    setSelectedOrder(order);
    resetForm();
    setSelectedOrder(order);
    setReportModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder || !result.trim()) {
      setFormError('Please enter the laboratory findings / result.');
      return;
    }

    const formData = new FormData();
    formData.append('laboratory_order', String(selectedOrder.id));
    formData.append('result', result);
    formData.append('unit', unit);
    formData.append('reference_range', referenceRange);
    if (reportFile) {
      formData.append('report_file', reportFile);
    }

    createReportMutation.mutate(formData);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy-900 tracking-tight">Specimen Orders Queue</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Analyze received specimens, record qualitative & quantitative findings, and upload reports.
          </p>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6">
              <LoadingSkeleton rows={4} />
            </div>
          ) : orders.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs">No laboratory orders recorded.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="py-3 px-4">Order #</th>
                    <th className="py-3 px-4">Patient</th>
                    <th className="py-3 px-4">Test Name</th>
                    <th className="py-3 px-4">Ordered By</th>
                    <th className="py-3 px-4">Indication</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {orders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-mono text-slate-400">#{ord.id}</td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {ord.patient_details?.full_name}
                      </td>
                      <td className="py-3.5 px-4 text-teal-700 font-semibold">{ord.test_name}</td>
                      <td className="py-3.5 px-4 text-slate-600">
                        Dr. {ord.ordered_by_details?.full_name}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 max-w-xs truncate">
                        {ord.clinical_notes || '—'}
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge variant={ord.status === 'Completed' ? 'success' : 'warning'}>
                          {ord.status}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {ord.status !== 'Completed' ? (
                          <Button size="sm" onClick={() => handleOpenReportModal(ord)}>
                            <PlusCircle className="w-3.5 h-3.5 mr-1" />
                            Enter Findings
                          </Button>
                        ) : (
                          <span className="text-[11px] text-emerald-600 font-semibold flex items-center justify-end gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Report Filed
                          </span>
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

      {/* Enter Findings Modal */}
      <Modal
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        title={selectedOrder ? `File Results for ${selectedOrder.test_name} (Order #${selectedOrder.id})` : 'Enter Findings'}
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm">
          {formError && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div className="p-3 bg-teal-50/60 rounded-xl border border-teal-100 text-xs text-teal-800">
            Patient: <strong>{selectedOrder?.patient_details?.full_name}</strong> | Requested By: Dr.{' '}
            {selectedOrder?.ordered_by_details?.full_name}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
              Diagnostic Findings / Result Values
            </label>
            <textarea
              rows={4}
              value={result}
              onChange={(e) => setResult(e.target.value)}
              placeholder="e.g. Hemoglobin: 14.5 g/dL; Platelets: 250,000 /uL; WBC: 6.8 K/uL"
              required
              className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 font-mono"
            ></textarea>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Measurement Unit"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              placeholder="e.g. mg/dL, g/dL, %"
            />
            <Input
              label="Biological Reference Interval"
              value={referenceRange}
              onChange={(e) => setReferenceRange(e.target.value)}
              placeholder="e.g. 70 - 99 mg/dL"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
              Attach Verified Report Document (PDF, PNG, JPG &lt; 10MB)
            </label>
            <input
              type="file"
              accept=".pdf,.png,.jpg,.jpeg"
              onChange={(e) => setReportFile(e.target.files?.[0] || null)}
              className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setReportModalOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" type="submit" isLoading={createReportMutation.isPending}>
              Submit & Complete Order
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
