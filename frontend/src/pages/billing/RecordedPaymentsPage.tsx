import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { DollarSign, CheckCircle2, ShieldCheck, CreditCard } from 'lucide-react';
import { billingService } from '../../services/api';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';

export const RecordedPaymentsPage: React.FC = () => {
  const { data: invoicesData, isLoading } = useQuery({
    queryKey: ['billing-invoices-payments'],
    queryFn: () => billingService.getInvoices(),
  });

  const invoices = invoicesData?.results || [];
  const allPayments = invoices.flatMap((inv) =>
    (inv.payments || []).map((p) => ({
      ...p,
      invoice_number: inv.invoice_number,
      patient_name: inv.patient_details?.full_name,
    }))
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy-900 tracking-tight">Recorded Payment Ledger</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Historical transactions, settlement methods, and auditable payment receipts.
        </p>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6">
              <LoadingSkeleton rows={4} />
            </div>
          ) : allPayments.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs">No payments recorded yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="py-3 px-4">Transaction Reference</th>
                    <th className="py-3 px-4">Invoice #</th>
                    <th className="py-3 px-4">Patient</th>
                    <th className="py-3 px-4">Amount Paid</th>
                    <th className="py-3 px-4">Method</th>
                    <th className="py-3 px-4">Date & Time</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {allPayments.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-semibold text-slate-700">
                        {p.transaction_reference}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-600">{p.invoice_number}</td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">{p.patient_name}</td>
                      <td className="py-3.5 px-4 font-extrabold text-teal-700 text-sm">
                        ${p.amount}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">{p.payment_method_display}</td>
                      <td className="py-3.5 px-4 text-slate-500">
                        {new Date(p.paid_at).toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge variant="success">Settled</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
