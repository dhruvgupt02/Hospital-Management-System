import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Users,
  Calendar,
  Stethoscope,
  DollarSign,
  ShieldCheck,
  Activity,
  TrendingUp,
  PieChart as PieIcon,
  BarChart3,
  Clock,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { auditService } from '../../services/api';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { StatCard } from '../../components/ui/StatCard';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';

const STATUS_COLORS: Record<string, string> = {
  Scheduled: '#3b82f6',
  Confirmed: '#10b981',
  Completed: '#0d9488',
  Cancelled: '#f43f5e',
  'No-show': '#64748b',
};

export const AdminDashboard: React.FC = () => {
  const { data: analyticsData, isLoading } = useQuery({
    queryKey: ['admin-analytics'],
    queryFn: () => auditService.getAnalytics(),
  });

  const metrics = analyticsData?.metrics || {};
  const statusData = analyticsData?.charts?.appointment_status || [];
  const workloadData = analyticsData?.charts?.doctor_workload || [];
  const monthlyData = analyticsData?.charts?.monthly_billing || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy-900 tracking-tight">System & Operational Analytics</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Enterprise database aggregations, clinician throughput, and hospital security telemetry.
          </p>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Registered Patients"
          value={metrics.total_patients ?? 0}
          icon={Users}
          colorScheme="teal"
          description="Normalized Patient entities"
        />
        <StatCard
          title="Active Doctors On Roster"
          value={metrics.active_doctors ?? 0}
          icon={Stethoscope}
          colorScheme="navy"
          description="Medical staff practitioners"
        />
        <StatCard
          title="Today's Appointments"
          value={metrics.today_appointments ?? 0}
          icon={Calendar}
          colorScheme="blue"
          description="Clinical schedule encounters"
        />
        <StatCard
          title="Revenue Collected"
          value={`$${Number(metrics.total_payments_recorded ?? 0).toLocaleString(undefined, {
            minimumFractionDigits: 2,
          })}`}
          icon={DollarSign}
          colorScheme="emerald"
          description="Audited payment receipts"
        />
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Upcoming Appointments"
          value={metrics.upcoming_appointments ?? 0}
          icon={Clock}
          colorScheme="teal"
          description="Active reserved slots"
        />
        <StatCard
          title="Completed Encounters"
          value={metrics.completed_appointments ?? 0}
          icon={CheckCircle2}
          colorScheme="emerald"
          description="Finalized visits"
        />
        <StatCard
          title="Cancelled Bookings"
          value={metrics.cancelled_appointments ?? 0}
          icon={XCircle}
          colorScheme="rose"
          description="Cancelled appointments"
        />
      </div>

      {/* Visual Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Doctor Workload Distribution */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-teal-600" />
              <CardTitle>Doctor Appointment Workload</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {workloadData.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-xs text-slate-400">
                No appointment data recorded
              </div>
            ) : (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={workloadData} layout="vertical" margin={{ top: 10, right: 20, left: 20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                    <XAxis type="number" stroke="#94a3b8" fontSize={11} allowDecimals={false} />
                    <YAxis dataKey="doctor" type="category" stroke="#94a3b8" fontSize={11} width={100} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        borderRadius: '0.75rem',
                        borderColor: '#e2e8f0',
                        fontSize: '12px',
                      }}
                      formatter={(val: any) => [`${val} consultations`, 'Appointments']}
                    />
                    <Bar dataKey="appointments" fill="#0d9488" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Appointment Status Breakdown */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-navy-700" />
              <CardTitle>Appointment Status Distribution</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {statusData.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-xs text-slate-400">
                No status data available
              </div>
            ) : (
              <div className="h-64 w-full flex items-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={4}
                    >
                      {statusData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={STATUS_COLORS[entry.name] || '#94a3b8'}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        borderRadius: '0.75rem',
                        borderColor: '#e2e8f0',
                        fontSize: '12px',
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
