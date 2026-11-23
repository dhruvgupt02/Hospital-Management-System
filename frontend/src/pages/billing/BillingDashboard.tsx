import React from 'react';
import { Link } from 'react-router-dom';
import {
  CreditCard,
  DollarSign,
  ShieldCheck,
  PlusCircle,
  Clock,
  CheckCircle2,
  TrendingUp,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { billingService, auditService } from '../../services/api';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { StatCard } from '../../components/ui/StatCard';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';

export const BillingDashboard: React.FC = () => {
  const { data: analyticsData, isLoading } = useQuery({
    queryKey: ['billing-analytics'],
    queryFn: () => auditService.getAnalytics(),
  });

  const { data: invoicesData } = useQuery({
    queryKey: ['billing-invoices-overview'],
    queryFn: () => billingService.getInvoices(),
  });

  const metrics = analyticsData?.metrics || {};
  const monthlyData = analyticsData?.charts?.monthly_billing || [];
  const invoices = invoicesData?.results || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy-900 tracking-tight">Financial & Revenue Operations</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Accounts receivable, payment recording, and health insurance claim adjudication.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link to="/billing/invoices">
            <Button size="sm">
              <PlusCircle className="w-4 h-4 mr-1.5" />
              Generate Invoice
            </Button>
          </Link>
          <Link to="/billing/claims">
            <Button size="sm" variant="outline">
              <ShieldCheck className="w-4 h-4 mr-1.5" />
              Manage Claims
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Total Revenue Collected"
          value={`$${Number(metrics.total_payments_recorded ?? 0).toLocaleString(undefined, {
            minimumFractionDigits: 2,
          })}`}
          icon={DollarSign}
          colorScheme="emerald"
          description="Simulated settled transactions"
        />
        <StatCard
          title="Unpaid Invoices"
          value={metrics.unpaid_invoices ?? 0}
          icon={Clock}
          colorScheme="amber"
          description="Accounts receivable pending"
        />
        <StatCard
          title="Pending Claims"
          value={metrics.pending_claims ?? 0}
          icon={ShieldCheck}
          colorScheme="navy"
          description="Awaiting payer adjudication"
        />
      </div>

      {/* Revenue & Billing Recharts */}
      {monthlyData.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-teal-600" />
              <CardTitle>Billed vs. Collected Revenue</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={(val) => `$${val}`} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderRadius: '0.75rem',
                      borderColor: '#e2e8f0',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                      fontSize: '12px',
                    }}
                    formatter={(value: any) => [`$${value}`, undefined]}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <Bar dataKey="billed" name="Billed Amount ($)" fill="#0d9488" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="collected" name="Collected Paid ($)" fill="#102a43" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Invoices */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Patient Invoices</CardTitle>
          <Link to="/billing/invoices" className="text-xs font-semibold text-teal-600 hover:text-teal-700">
            Open Full Ledger
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-2.5 px-4">Invoice #</th>
                  <th className="py-2.5 px-4">Patient</th>
                  <th className="py-2.5 px-4">Total Amount</th>
                  <th className="py-2.5 px-4">Paid</th>
                  <th className="py-2.5 px-4">Balance Due</th>
                  <th className="py-2.5 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoices.slice(0, 5).map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/50">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{inv.invoice_number}</td>
                    <td className="py-3 px-4 text-slate-800">{inv.patient_details?.full_name}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">${inv.total_amount}</td>
                    <td className="py-3 px-4 text-teal-700 font-medium">${inv.amount_paid}</td>
                    <td className="py-3 px-4 text-rose-600 font-bold">${inv.balance_due}</td>
                    <td className="py-3 px-4">
                      <Badge variant={inv.status === 'Paid' ? 'success' : inv.status === 'Partially_Paid' ? 'warning' : 'danger'}>
                        {inv.status.replace('_', ' ')}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
