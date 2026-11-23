import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { HeartPulse, Lock, Mail, AlertCircle, KeyRound, UserCheck } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

export const LoginPage: React.FC = () => {
  const { login, role } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login({ email, password });
      // Redirect based on role
      const savedUser = JSON.parse(localStorage.getItem('medicare_user') || '{}');
      const targetRole = savedUser.role || role;

      if (targetRole === 'PATIENT') navigate('/patient');
      else if (targetRole === 'DOCTOR') navigate('/doctor');
      else if (targetRole === 'RECEPTIONIST') navigate('/receptionist');
      else if (targetRole === 'LAB_TECHNICIAN') navigate('/lab');
      else if (targetRole === 'BILLING_STAFF') navigate('/billing');
      else if (targetRole === 'ADMIN') navigate('/admin');
      else navigate('/');
    } catch (err: any) {
      setError(
        err.response?.data?.detail ||
        err.response?.data?.non_field_errors?.[0] ||
        'Authentication failed. Please verify your email and password.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoLogin = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('Password123!');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-flex items-center gap-2.5">
          <div className="w-12 h-12 rounded-2xl bg-teal-600 flex items-center justify-center text-white shadow-lg shadow-teal-600/25">
            <HeartPulse className="w-7 h-7" />
          </div>
        </Link>
        <h2 className="mt-4 text-2xl sm:text-3xl font-extrabold text-navy-900 tracking-tight">
          Sign In to MediCare
        </h2>
        <p className="mt-1.5 text-xs sm:text-sm text-slate-500">
          Enter your credentials or choose a pre-configured demo account below.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 sm:px-10 rounded-2xl shadow-xl border border-slate-200/80">
          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-xs text-rose-700">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. john.doe@medicare.local"
              required
            />

            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              required
            />

            <div className="flex items-center justify-between text-xs pt-1">
              <Link to="/forgot-password" className="text-teal-600 hover:text-teal-700 font-medium">
                Forgot password?
              </Link>
              <Link to="/register" className="text-slate-600 hover:text-teal-600 font-medium">
                New patient? Register
              </Link>
            </div>

            <Button type="submit" size="lg" className="w-full mt-2" isLoading={loading}>
              Sign In
            </Button>
          </form>

          {/* Quick Demo Role Selector */}
          <div className="mt-8 pt-6 border-t border-slate-100">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider text-center mb-3">
              Quick 1-Click Demo Accounts (Password: Password123!)
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('admin@medicare.local')}
                className="p-2 rounded-lg border border-slate-200 hover:border-teal-500 hover:bg-teal-50 text-slate-700 text-left transition-all"
              >
                <span className="font-bold block text-slate-900">Administrator</span>
                <span className="text-[10px] text-slate-400">admin@medicare.local</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('sarah.jenkins@medicare.local')}
                className="p-2 rounded-lg border border-slate-200 hover:border-teal-500 hover:bg-teal-50 text-slate-700 text-left transition-all"
              >
                <span className="font-bold block text-slate-900">Doctor (Cardiology)</span>
                <span className="text-[10px] text-slate-400">sarah.jenkins@...</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('john.doe@medicare.local')}
                className="p-2 rounded-lg border border-slate-200 hover:border-teal-500 hover:bg-teal-50 text-slate-700 text-left transition-all"
              >
                <span className="font-bold block text-slate-900">Patient</span>
                <span className="text-[10px] text-slate-400">john.doe@medicare.local</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('rachel.green@medicare.local')}
                className="p-2 rounded-lg border border-slate-200 hover:border-teal-500 hover:bg-teal-50 text-slate-700 text-left transition-all"
              >
                <span className="font-bold block text-slate-900">Receptionist</span>
                <span className="text-[10px] text-slate-400">rachel.green@...</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('kevin.patel@medicare.local')}
                className="p-2 rounded-lg border border-slate-200 hover:border-teal-500 hover:bg-teal-50 text-slate-700 text-left transition-all"
              >
                <span className="font-bold block text-slate-900">Lab Technician</span>
                <span className="text-[10px] text-slate-400">kevin.patel@...</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('brian.hall@medicare.local')}
                className="p-2 rounded-lg border border-slate-200 hover:border-teal-500 hover:bg-teal-50 text-slate-700 text-left transition-all"
              >
                <span className="font-bold block text-slate-900">Billing Staff</span>
                <span className="text-[10px] text-slate-400">brian.hall@...</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
