import React from 'react';
import { Link } from 'react-router-dom';
import {
  HeartPulse,
  CalendarCheck2,
  FileSpreadsheet,
  ShieldAlert,
  FlaskRound as Flask,
  Receipt,
  Users2,
  CheckCircle,
  ArrowRight,
  Database,
  Cloud,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Top Bar */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-teal-600 flex items-center justify-center text-white shadow-md shadow-teal-600/20">
              <HeartPulse className="w-6 h-6" />
            </div>
            <div>
              <span className="font-extrabold text-xl text-navy-900 tracking-tight">MediCare</span>
              <span className="text-[10px] text-teal-600 font-bold block uppercase tracking-widest leading-none">
                Hospital System
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost" size="sm">
                Sign In
              </Button>
            </Link>
            <Link to="/register">
              <Button size="sm">Patient Registration</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-16 sm:py-24 bg-gradient-to-b from-white via-teal-50/20 to-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-700 text-xs font-semibold mb-6 shadow-xs">
              <Database className="w-3.5 h-3.5" />
              <span>RDBMS & Cloud Architecture • PostgreSQL 18 Exclusion Constraints</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-navy-900 tracking-tight leading-tight">
              Hospital Appointment & <br />
              <span className="text-teal-600">Medical Records</span> Platform
            </h1>
            <p className="mt-6 text-base sm:text-lg text-slate-600 leading-relaxed">
              An enterprise full-stack healthcare ecosystem powering appointment scheduling with automatic collision
              prevention, temporal medical records, audit logging, and role-based operational workflows.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link to="/login" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto gap-2">
                  Access Portal
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link to="/register" className="w-full sm:w-auto">
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  New Patient Registration
                </Button>
              </Link>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {[
              { label: 'Registered Patients', val: '10+', sub: 'Comprehensive Demographics' },
              { label: 'Active Specialists', val: '5', sub: 'Cardiology, Neuro, Ortho...' },
              { label: 'Conflict Engine', val: '100%', sub: 'Postgres tstzrange Exclusion' },
              { label: 'Temporal Versioning', val: 'v1 → v2', sub: 'Audited Clinical Amendments' },
            ].map((stat, idx) => (
              <div key={idx} className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs text-center">
                <p className="text-2xl sm:text-3xl font-extrabold text-teal-600 tracking-tight">{stat.val}</p>
                <p className="text-xs font-bold text-slate-800 mt-1 uppercase tracking-wider">{stat.label}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">{stat.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Architecture Highlights */}
      <section className="py-16 bg-white border-y border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-navy-900">Enterprise Database & Security Architecture</h2>
            <p className="text-sm text-slate-500 mt-2">
              Engineered with advanced DBMS design principles and Microsoft Azure DP-900 cloud integration.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl border border-slate-200/80 bg-slate-50/50 hover:bg-white hover:shadow-md transition-all">
              <div className="w-11 h-11 rounded-xl bg-teal-100/70 text-teal-700 flex items-center justify-center mb-4">
                <CalendarCheck2 className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base text-slate-800">Concurrency Conflict Engine</h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Utilizes PostgreSQL range types <code className="text-teal-700 font-mono">tstzrange</code> and exclusion
                constraints <code className="text-teal-700 font-mono">USING gist</code> with btree_gist to mathematically prevent
                double-booking at the database engine level.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-slate-200/80 bg-slate-50/50 hover:bg-white hover:shadow-md transition-all">
              <div className="w-11 h-11 rounded-xl bg-navy-100 text-navy-800 flex items-center justify-center mb-4">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base text-slate-800">Temporal Medical Records</h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Separates clinical encounter timestamps from database entry and amendment timestamps. Medical records produce
                immutable revision versions with explicit physician justifications.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-slate-200/80 bg-slate-50/50 hover:bg-white hover:shadow-md transition-all">
              <div className="w-11 h-11 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center mb-4">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base text-slate-800">Granular Audit Logging</h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                All authentications, status changes, payments, and prescription dispatches trigger structured audit events with
                actor identifiers, source IPs, and diff snapshots inside transactional boundaries.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Role Capabilities Section */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-navy-900">Six Role-Based Workspaces</h2>
            <p className="text-sm text-slate-500 mt-2">
              Each hospital stakeholder operates with strict role boundaries enforced server-side.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { role: 'Patient', desc: 'Browse specialists, book time slots, review prescriptions, invoices, and clinical notes.' },
              { role: 'Doctor', desc: 'View assigned patient appointments, record SOAP notes, amend history, issue prescriptions.' },
              { role: 'Receptionist', desc: 'Register walking patients, browse doctor schedule calendars, book and cancel visits.' },
              { role: 'Laboratory Tech', desc: 'Receive diagnostic test orders, enter results, reference ranges, upload and verify reports.' },
              { role: 'Billing Staff', desc: 'Generate multi-item invoices, record simulated credit/cash payments, adjudicate insurance claims.' },
              { role: 'Administrator', desc: 'Monitor operational hospital analytics, manage staff roles and accounts, inspect security audit logs.' },
            ].map((item, idx) => (
              <div key={idx} className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-4 h-4 text-teal-600" />
                  <h4 className="font-bold text-sm text-slate-900">{item.role}</h4>
                </div>
                <p className="text-xs text-slate-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto bg-navy-900 text-slate-400 text-xs py-8 border-t border-navy-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <HeartPulse className="w-4 h-4 text-teal-400" />
            <span className="font-semibold text-white">MediCare Hospital Management System</span>
          </div>
          <p>© 2026 MediCare Inc. Educational RDBMS Architecture & DP-900 Demonstration.</p>
        </div>
      </footer>
    </div>
  );
};
