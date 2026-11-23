import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CreditCard, PlusCircle, Trash2, CheckCircle2, AlertCircle, XCircle, DollarSign } from 'lucide-react';
import { billingService, patientsService } from '../../services/api';
import { Invoice } from '../../types';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';

export const InvoicesManagementPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  // New Invoice form fields
  const [selectedPatientId, setSelectedPatientId] = useState<number | ''>('');
  const [taxAmount, setTaxAmount] = useState('0.00');
  const [discountAmount, setDiscountAmount] = useState('0.00');
  const [dueDate, setDueDate] = useState(
    new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]
  );
  const [items, setItems] = useState<Array<{ description: string; quantity: number; unit_price: string }>>([
    { description: 'Specialist Medical Consultation', quantity: 1, unit_price: '150.00' },
  ]);
  const [formError, setFormError] = useState<string | null>(null);

  // Payment form fields
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [payError, setPayError] = useState<string | null>(null);

  const { data: invoicesData, isLoading } = useQuery({
    queryKey: ['invoices-management-list'],
    queryFn: () => billingService.getInvoices(),
  });

  const { data: patientsData } = useQuery({
    queryKey: ['patients-list'],
    queryFn: () => patientsService.getPatients(),
  });

  const invoices = invoicesData?.results || [];
  const patients = patientsData?.results || [];

  const createInvoiceMutation = useMutation({
    mutationFn: (payload: any) => billingService.createInvoice(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices-management-list'] });
      setCreateModalOpen(false);
      resetCreateForm();
    },
    onError: (err: any) => {
      setFormError(err.response?.data?.detail || 'Failed to generate invoice.');
    },
  });

  const recordPaymentMutation = useMutation({
    mutationFn: ({ invoiceId, payload }: { invoiceId: number; payload: any }) =>
      billingService.recordPayment(invoiceId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices-management-list'] });
      setPayModalOpen(false);
      setSelectedInvoice(null);
    },
    onError: (err: any) => {
      setPayError(err.response?.data?.detail || 'Failed to record payment.');
    },
  });

  const cancelInvoiceMutation = useMutation({
    mutationFn: (id: number) => billingService.cancelInvoice(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['invoices-management-list'] }),
  });

  const resetCreateForm = () => {
    setSelectedPatientId('');
    setTaxAmount('0.00');
    setDiscountAmount('0.00');
    setItems([{ description: 'Specialist Medical Consultation', quantity: 1, unit_price: '150.00' }]);
    setFormError(null);
  };

  const handleAddItem = () => {
    setItems([...items, { description: '', quantity: 1, unit_price: '50.00' }]);
  };

  const handleRemoveItem = (idx: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== idx));
    }
  };

  const handleItemChange = (idx: number, field: string, val: any) => {
    const updated = [...items];
    updated[idx] = { ...updated[idx], [field]: val };
    setItems(updated);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientId) {
      setFormError('Please select a patient.');
      return;
    }
    createInvoiceMutation.mutate({
      patient: selectedPatientId,
      tax_amount: taxAmount,
      discount_amount: discountAmount,
      due_date: dueDate,
      items,
    });
  };

  const handleOpenPay = (inv: Invoice) => {
    setSelectedInvoice(inv);
    setPaymentAmount(inv.balance_due);
    setPayError(null);
    setPayModalOpen(true);
  };

  const handlePaySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;
    recordPaymentMutation.mutate({
      invoiceId: selectedInvoice.id,
      payload: {
        amount: paymentAmount,
        payment_method: paymentMethod,
        notes: paymentNotes || 'Staff desk payment',
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy-900 tracking-tight">Invoice Management</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Generate itemized hospital bills, record patient settlements, and track balances.
          </p>
        </div>

        <Button size="sm" onClick={() => setCreateModalOpen(true)}>
          <PlusCircle className="w-4 h-4 mr-1.5" />
          Generate Invoice
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6">
              <LoadingSkeleton rows={4} />
            </div>
          ) : invoices.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs">No invoices generated yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="py-3 px-4">Invoice #</th>
                    <th className="py-3 px-4">Patient</th>
                    <th className="py-3 px-4">Total Amount</th>
                    <th className="py-3 px-4">Paid</th>
                    <th className="py-3 px-4">Balance Due</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{inv.invoice_number}</td>
                      <td className="py-3.5 px-4 font-bold text-slate-800">
                        {inv.patient_details?.full_name}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">${inv.total_amount}</td>
                      <td className="py-3.5 px-4 text-teal-700 font-semibold">${inv.amount_paid}</td>
                      <td className="py-3.5 px-4 text-rose-600 font-bold">${inv.balance_due}</td>
                      <td className="py-3.5 px-4">
                        <Badge
                          variant={
                            inv.status === 'Paid'
                              ? 'success'
                              : inv.status === 'Partially_Paid'
                              ? 'warning'
                              : inv.status === 'Cancelled'
                              ? 'danger'
                              : 'primary'
                          }
                        >
                          {inv.status.replace('_', ' ')}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-1.5">
                        {parseFloat(inv.balance_due) > 0 && inv.status !== 'Cancelled' && (
                          <Button size="sm" onClick={() => handleOpenPay(inv)}>
                            Record Payment
                          </Button>
                        )}
                        {parseFloat(inv.amount_paid) === 0 && inv.status !== 'Cancelled' && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-rose-600 border-rose-200 hover:bg-rose-50"
                            onClick={() => cancelInvoiceMutation.mutate(inv.id)}
                          >
                            Cancel
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

      {/* Generate Invoice Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Generate Patient Invoice"
        maxWidth="xl"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs sm:text-sm">
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
              value={selectedPatientId}
              onChange={(e) => setSelectedPatientId(Number(e.target.value))}
              required
              className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20"
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
                Itemized Charges
              </label>
              <Button type="button" size="sm" variant="outline" onClick={handleAddItem}>
                <PlusCircle className="w-3.5 h-3.5 mr-1" />
                Add Item
              </Button>
            </div>

            <div className="space-y-2">
              {items.map((it, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <input
                    type="text"
                    placeholder="Charge description (e.g. Consultation, ECG)"
                    value={it.description}
                    onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                    required
                    className="flex-1 px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                  />
                  <input
                    type="number"
                    min={1}
                    value={it.quantity}
                    onChange={(e) => handleItemChange(idx, 'quantity', Number(e.target.value))}
                    className="w-16 px-2 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-center"
                  />
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Unit Price"
                    value={it.unit_price}
                    onChange={(e) => handleItemChange(idx, 'unit_price', e.target.value)}
                    className="w-24 px-2 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-bold"
                  />
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
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <Input
              label="Tax Amount ($)"
              value={taxAmount}
              onChange={(e) => setTaxAmount(e.target.value)}
            />
            <Input
              label="Discount Amount ($)"
              value={discountAmount}
              onChange={(e) => setDiscountAmount(e.target.value)}
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" type="submit" isLoading={createInvoiceMutation.isPending}>
              Issue & Finalize Invoice
            </Button>
          </div>
        </form>
      </Modal>

      {/* Record Payment Modal */}
      <Modal
        isOpen={payModalOpen}
        onClose={() => setPayModalOpen(false)}
        title={selectedInvoice ? `Record Payment for ${selectedInvoice.invoice_number}` : 'Record Payment'}
      >
        <form onSubmit={handlePaySubmit} className="space-y-4 text-xs sm:text-sm">
          {payError && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{payError}</span>
            </div>
          )}

          <div className="p-3 bg-teal-50 rounded-xl border border-teal-100 flex justify-between items-center text-xs">
            <span className="text-teal-800 font-semibold">Remaining Balance:</span>
            <span className="text-base font-bold text-teal-900">${selectedInvoice?.balance_due}</span>
          </div>

          <Input
            label="Payment Amount ($)"
            type="number"
            step="0.01"
            value={paymentAmount}
            max={selectedInvoice?.balance_due}
            onChange={(e) => setPaymentAmount(e.target.value)}
            required
          />

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
              Payment Method
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            >
              <option value="Cash">Cash Settlement</option>
              <option value="Credit_Card">Credit Card</option>
              <option value="Debit_Card">Debit Card</option>
              <option value="Bank_Transfer">Wire / Bank Transfer</option>
            </select>
          </div>

          <Input
            label="Transaction Reference / Note (Optional)"
            value={paymentNotes}
            onChange={(e) => setPaymentNotes(e.target.value)}
            placeholder="e.g. Receipt #4491"
          />

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setPayModalOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" type="submit" isLoading={recordPaymentMutation.isPending}>
              Commit Payment
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
