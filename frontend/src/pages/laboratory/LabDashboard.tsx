import React from 'react';
import { Link } from 'react-router-dom';
import { FlaskConical, Clock, CheckCircle2, FileText, ArrowRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { laboratoryService, auditService } from '../../services/api';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { StatCard } from '../../components/ui/StatCard';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';

export const LabDashboard: React.FC = () => {
  const { data: analyticsData } = useQuery({
    queryKey: ['lab-analytics'],
    queryFn: () => auditService.getAnalytics(),
  });

  const { data: ordersData, isLoading } = useQuery({
    queryKey: ['pending-lab-orders'],
    queryFn: () => laboratoryService.getOrders({ status: 'Ordered' }),
  });

  const metrics = analyticsData?.metrics || {};
  const orders = ordersData?.results || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy-900 tracking-tight">Diagnostic Laboratory Workspace</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Pathology order queue, specimen test analysis, and report verification.
          </p>
        </div>

        <Link to="/lab/orders">
          <Button size="sm">
            <FlaskConical className="w-4 h-4 mr-1.5" />
            Process Pending Orders
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Pending Test Orders"
          value={orders.length}
          icon={Clock}
          colorScheme="amber"
          description="Specimens awaiting processing"
        />
        <StatCard
          title="Unverified Reports"
          value={metrics.pending_lab_reports ?? 0}
          icon={FlaskConical}
          colorScheme="teal"
          description="Awaiting technician sign-off"
        />
        <StatCard
          title="Verified Diagnostic Reports"
          value="100%"
          icon={CheckCircle2}
          colorScheme="emerald"
          description="Quality audit compliant"
        />
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-600" />
            <CardTitle>Incoming Specimen Orders</CardTitle>
          </div>
          <Link to="/lab/orders" className="text-xs font-semibold text-teal-600 hover:text-teal-700">
            View All Orders
          </Link>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <LoadingSkeleton rows={3} />
          ) : orders.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-xs">No pending orders in queue.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="py-2.5 px-3">Order #</th>
                    <th className="py-2.5 px-3">Patient</th>
                    <th className="py-2.5 px-3">Test Name</th>
                    <th className="py-2.5 px-3">Ordered By</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {orders.slice(0, 5).map((ord) => (
                    <tr key={ord.id} className="hover:bg-slate-50/50">
                      <td className="py-3 px-3 font-mono text-slate-400">#{ord.id}</td>
                      <td className="py-3 px-3 font-bold text-slate-900">
                        {ord.patient_details?.full_name}
                      </td>
                      <td className="py-3 px-3 font-semibold text-teal-700">{ord.test_name}</td>
                      <td className="py-3 px-3 text-slate-600">
                        Dr. {ord.ordered_by_details?.full_name}
                      </td>
                      <td className="py-3 px-3">
                        <Badge variant="warning">{ord.status}</Badge>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <Link to="/lab/orders">
                          <Button size="sm" variant="outline">
                            Enter Findings
                          </Button>
                        </Link>
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
