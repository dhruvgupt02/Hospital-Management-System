import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CreditCard, CheckCircle2, Clock, AlertCircle, DollarSign, ShieldCheck } from 'lucide-react';
import { billingService } from '../../services/api';
import { Invoice } from '../../types';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';

export const BillingPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('Credit_Card');
  const [payNotes, setPayNotes] = useState('');
  const [payError, setPayError] = useState<string | null>(null);
  const [paySuccess, setPaySuccess] = useState<string | null>(null);

  const { data: invoicesData, isLoading } = useQuery({
    queryKey: ['patient-invoices'],
    queryFn: () => billingService.getInvoices(),
  });

  const invoices = invoicesData?.results || [];

  const payMutation = useMutation({
    mutationFn: ({ invoiceId, payload }: { invoiceId: number; payload: any }) =>
      billingService.recordPayment(invoiceId, payload),
    onSuccess: (data) => {
      setPaySuccess('Payment processed successfully! Balance updated.');
      queryClient.invalidateQueries({ queryKey: ['patient-invoices'] });
      setTimeout(() => {
        setPayModalOpen(false);
        setPaySuccess(null);
        setSelectedInvoice(null);
      }, 1500);
    },
    onError: (err: any) => {
      setPayError(err.response?.data?.detail || 'Payment could not be processed.');
    },
  });

  const handleOpenPay = (inv: Invoice) => {
    setSelectedInvoice(inv);
    setPayAmount(inv.balance_due);
    setPayError(null);
    setPaySuccess(null);
    setPayModalOpen(true);
  };

  const handleConfirmPay = () => {
    if (!selectedInvoice) return;
    setPayError(null);
    payMutation.mutate({
      invoiceId: selectedInvoice.id,
      payload: {
        amount: payAmount,
        payment_method: payMethod,
        notes: payNotes || 'Simulated patient payment portal',
      },
    });
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'Paid':
        return 'success';
      case 'Partially_Paid':
        return 'warning';
      case 'Unpaid':
        return 'danger';
      default:
        return 'secondary';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy-900 tracking-tight">Invoices & Payments</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Review itemized consultation fees, outstanding balances, and execute simulated card payments.
        </p>
      </div>

      {isLoading ? (
        <LoadingSkeleton rows={4} />
      ) : invoices.length === 0 ? (
        <div className="py-12 text-center text-slate-500 text-xs">
          No billing records found for your account.
        </div>
      ) : (
        <div className="space-y-6">
          {invoices.map((inv) => (
            <Card key={inv.id}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-700 flex-shrink-0">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">{inv.invoice_number}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Issued on {new Date(inv.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={getStatusVariant(inv.status)}>{inv.status.replace('_', ' ')}</Badge>
                  {parseFloat(inv.balance_due) > 0 && (
                    <Button size="sm" onClick={() => handleOpenPay(inv)}>
                      Pay Balance (${inv.balance_due})
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Itemized charges table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                      <tr>
                        <th className="py-2.5 px-3">Description</th>
                        <th className="py-2.5 px-3">Quantity</th>
                        <th className="py-2.5 px-3">Unit Price</th>
                        <th className="py-2.5 px-3 text-right">Line Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {inv.items?.map((item, idx) => (
                        <tr key={idx}>
                          <td className="py-2 px-3 text-slate-800 font-medium">{item.description}</td>
                          <td className="py-2 px-3 text-slate-600">{item.quantity}</td>
                          <td className="py-2 px-3 text-slate-600">${item.unit_price}</td>
                          <td className="py-2 px-3 text-right font-semibold text-slate-900">${item.line_total}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="border-t border-slate-200 bg-slate-50/50 text-xs font-semibold">
                      <tr>
                        <td colSpan={3} className="py-2 px-3 text-right text-slate-500">
                          Subtotal:
                        </td>
                        <td className="py-2 px-3 text-right text-slate-800">${inv.subtotal}</td>
                      </tr>
                      {parseFloat(inv.discount_amount) > 0 && (
                        <tr>
                          <td colSpan={3} className="py-1 px-3 text-right text-emerald-600">
                            Discount Applied:
                          </td>
                          <td className="py-1 px-3 text-right text-emerald-600">-${inv.discount_amount}</td>
                        </tr>
                      )}
                      <tr>
                        <td colSpan={3} className="py-2 px-3 text-right text-slate-900 font-bold">
                          Total Amount:
                        </td>
                        <td className="py-2 px-3 text-right text-slate-900 font-bold">${inv.total_amount}</td>
                      </tr>
                      <tr>
                        <td colSpan={3} className="py-2 px-3 text-right text-teal-700">
                          Amount Paid:
                        </td>
                        <td className="py-2 px-3 text-right text-teal-700 font-bold">${inv.amount_paid}</td>
                      </tr>
                      <tr className="border-t border-slate-200">
                        <td colSpan={3} className="py-2 px-3 text-right text-rose-600 font-bold">
                          Remaining Balance Due:
                        </td>
                        <td className="py-2 px-3 text-right text-rose-600 font-extrabold text-sm">
                          ${inv.balance_due}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* Payments history */}
                {inv.payments && inv.payments.length > 0 && (
                  <div className="pt-2 border-t border-slate-100">
                    <h4 className="text-xs font-bold text-slate-700 mb-2">Recorded Payment History</h4>
                    <div className="space-y-1.5">
                      {inv.payments.map((p) => (
                        <div
                          key={p.id}
                          className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-xs"
                        >
                          <div>
                            <span className="font-semibold text-slate-800">${p.amount}</span> via{' '}
                            <span className="text-slate-600">{p.payment_method_display}</span>
                            <span className="text-[10px] text-slate-400 block font-mono">
                              Ref: {p.transaction_reference}
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-400">
                            {new Date(p.paid_at).toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Payment Modal */}
      <Modal
        isOpen={payModalOpen}
        onClose={() => setPayModalOpen(false)}
        title={selectedInvoice ? `Settle Balance for ${selectedInvoice.invoice_number}` : 'Record Payment'}
      >
        <div className="space-y-4 text-xs sm:text-sm">
          {payError && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{payError}</span>
            </div>
          )}

          {paySuccess && (
            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>{paySuccess}</span>
            </div>
          )}

          <div className="p-3 bg-teal-50 rounded-xl border border-teal-100 flex items-center justify-between">
            <span className="text-teal-800 font-semibold">Total Outstanding Balance:</span>
            <span className="text-base font-bold text-teal-900">${selectedInvoice?.balance_due}</span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
              Payment Amount ($)
            </label>
            <input
              type="number"
              step="0.01"
              value={payAmount}
              max={selectedInvoice?.balance_due}
              onChange={(e) => setPayAmount(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 font-bold text-slate-900"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
              Payment Method
            </label>
            <select
              value={payMethod}
              onChange={(e) => setPayMethod(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
            >
              <option value="Credit_Card">Credit Card (Simulated Sandbox)</option>
              <option value="Debit_Card">Debit Card (Simulated Sandbox)</option>
              <option value="Cash">Cash at Reception Desk</option>
              <option value="Bank_Transfer">Electronic Wire / ACH</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
              Cardholder Notes / Reference (Optional)
            </label>
            <input
              type="text"
              value={payNotes}
              onChange={(e) => setPayNotes(e.target.value)}
              placeholder="e.g. Card ending in 4242"
              className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setPayModalOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              isLoading={payMutation.isPending}
              disabled={!payAmount || parseFloat(payAmount) <= 0}
              onClick={handleConfirmPay}
            >
              Submit Simulated Payment
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
