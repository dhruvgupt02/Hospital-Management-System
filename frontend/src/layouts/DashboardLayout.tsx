import React, { useState } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import {
  HeartPulse,
  LayoutDashboard,
  Calendar,
  UserCheck,
  FileText,
  Pill,
  FlaskConical,
  CreditCard,
  ShieldCheck,
  Bell,
  LogOut,
  User,
  Users,
  CalendarCheck,
  Stethoscope,
  Activity,
  Menu,
  X,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { notificationsService } from '../services/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export const DashboardLayout: React.FC = () => {
  const { user, role, logout } = useAuth();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);

  // Fetch notifications
  const { data: notifData } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationsService.getNotifications(),
    refetchInterval: 30000,
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => notificationsService.markAllAsRead(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const notifications = notifData?.results || [];
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  // Role-based Nav items
  const navItemsByRole: Record<string, Array<{ name: string; path: string; icon: any }>> = {
    PATIENT: [
      { name: 'Dashboard', path: '/patient', icon: LayoutDashboard },
      { name: 'Find Doctors', path: '/patient/doctors', icon: Stethoscope },
      { name: 'My Appointments', path: '/patient/appointments', icon: Calendar },
      { name: 'Medical Records', path: '/patient/records', icon: FileText },
      { name: 'Prescriptions', path: '/patient/prescriptions', icon: Pill },
      { name: 'Lab Reports', path: '/patient/lab-reports', icon: FlaskConical },
      { name: 'Invoices & Billing', path: '/patient/billing', icon: CreditCard },
      { name: 'My Profile', path: '/patient/profile', icon: User },
    ],
    DOCTOR: [
      { name: 'Overview', path: '/doctor', icon: LayoutDashboard },
      { name: 'My Schedule', path: '/doctor/schedule', icon: CalendarCheck },
      { name: 'Authorized Patients', path: '/doctor/patients', icon: Users },
      { name: 'Clinical Records', path: '/doctor/records', icon: FileText },
      { name: 'Prescriptions', path: '/doctor/prescriptions', icon: Pill },
      { name: 'Order Lab Tests', path: '/doctor/lab-orders', icon: FlaskConical },
    ],
    RECEPTIONIST: [
      { name: 'Overview', path: '/receptionist', icon: LayoutDashboard },
      { name: 'Patient Directory', path: '/receptionist/patients', icon: Users },
      { name: 'Register Patient', path: '/receptionist/register-patient', icon: UserCheck },
      { name: 'Appointment Calendar', path: '/receptionist/appointments', icon: Calendar },
    ],
    LAB_TECHNICIAN: [
      { name: 'Overview', path: '/lab', icon: LayoutDashboard },
      { name: 'Pending Orders', path: '/lab/orders', icon: FlaskConical },
      { name: 'Verified Reports', path: '/lab/reports', icon: Activity },
    ],
    BILLING_STAFF: [
      { name: 'Overview', path: '/billing', icon: LayoutDashboard },
      { name: 'Invoices', path: '/billing/invoices', icon: CreditCard },
      { name: 'Recorded Payments', path: '/billing/payments', icon: CheckCircle2 },
      { name: 'Insurance Claims', path: '/billing/claims', icon: ShieldCheck },
    ],
    ADMIN: [
      { name: 'System Analytics', path: '/admin', icon: LayoutDashboard },
      { name: 'User Management', path: '/admin/users', icon: Users },
      { name: 'Doctor Management', path: '/admin/doctors', icon: Stethoscope },
      { name: 'Audit Trail Logs', path: '/admin/audit', icon: ShieldCheck },
    ],
  };

  const currentNavItems = (role && navItemsByRole[role]) || [];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col antialiased">
      {/* Top Navbar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-teal-600 flex items-center justify-center text-white shadow-md shadow-teal-600/20">
                <HeartPulse className="w-5 h-5" />
              </div>
              <span className="font-bold text-lg text-navy-900 tracking-tight">MediCare</span>
            </Link>
            <span className="hidden sm:inline-block text-xs font-semibold px-2 py-0.5 rounded bg-teal-50 text-teal-700 border border-teal-200 uppercase tracking-wider ml-1">
              HMS
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
                className="relative p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
                title="Notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-rose-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center ring-2 ring-white">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown */}
              {notifDropdownOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-4 py-2.5 border-b border-slate-100 flex items-center justify-between">
                    <span className="font-semibold text-sm text-slate-800">Notifications</span>
                    {unreadCount > 0 && (
                      <button
                        onClick={() => markAllReadMutation.mutate()}
                        className="text-xs text-teal-600 hover:text-teal-700 font-medium"
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>
                  <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                    {notifications.length === 0 ? (
                      <div className="py-6 text-center text-xs text-slate-400">No notifications</div>
                    ) : (
                      notifications.slice(0, 5).map((n) => (
                        <div key={n.id} className={`p-3.5 text-xs ${n.is_read ? 'bg-white' : 'bg-teal-50/40'}`}>
                          <p className="font-semibold text-slate-800">{n.title}</p>
                          <p className="text-slate-600 mt-0.5">{n.message}</p>
                          <span className="text-[10px] text-slate-400 mt-1 block">
                            {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User Profile Pill */}
            <div className="flex items-center gap-3 pl-2 sm:border-l border-slate-200">
              <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 font-bold text-xs">
                {user?.first_name?.[0] || 'U'}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-semibold text-slate-800 leading-tight">{user?.full_name}</p>
                <Badge variant="primary" className="text-[10px] py-0 px-1.5 font-medium">
                  {user?.role_display || role}
                </Badge>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={logout}
                className="text-slate-500 hover:text-rose-600 p-1.5"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Navigation */}
        <aside
          className={`fixed inset-y-0 left-0 z-30 w-64 bg-white border-r border-slate-200 pt-16 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:pt-0 ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="p-4 flex-1 overflow-y-auto space-y-1">
            <div className="px-3 py-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              {user?.role_display || 'Menu'}
            </div>
            {currentNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-teal-50 text-teal-700 font-semibold shadow-xs'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-teal-600' : 'text-slate-400'}`} />
                  {item.name}
                </Link>
              );
            })}
          </div>

          {/* System Footer info */}
          <div className="p-4 border-t border-slate-100 bg-slate-50/50">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>PostgreSQL 18 Connected</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">MediCare v1.0.0 (DP-900 Ready)</p>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
