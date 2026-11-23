import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ShieldCheck, Search, Clock, User, Filter, Eye, Database } from 'lucide-react';
import { auditService } from '../../services/api';
import { AuditLog } from '../../types';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';

export const AuditLogsPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [entityFilter, setEntityFilter] = useState('');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const { data: logsData, isLoading } = useQuery({
    queryKey: ['audit-logs', actionFilter, entityFilter, searchTerm],
    queryFn: () =>
      auditService.getLogs({
        action: actionFilter || undefined,
        entity_type: entityFilter || undefined,
        search: searchTerm || undefined,
      }),
  });

  const logs = logsData?.results || [];

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'CREATE':
        return 'success';
      case 'UPDATE':
        return 'primary';
      case 'DELETE':
        return 'danger';
      case 'LOGIN_SUCCESS':
        return 'info';
      case 'LOGIN_FAILED':
        return 'danger';
      case 'RECORD_AMENDED':
        return 'warning';
      case 'PAYMENT_RECORDED':
        return 'emerald';
      case 'CLAIM_SUBMITTED':
        return 'teal';
      default:
        return 'secondary';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy-900 tracking-tight">Security Audit & Event Trail</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Tamper-protected audit logs recording all clinical, financial, and authentication operations.
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by actor email, entity ID, or change summary..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
          />
        </div>

        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="px-4 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20"
        >
          <option value="">All Audit Actions</option>
          <option value="CREATE">CREATE</option>
          <option value="UPDATE">UPDATE</option>
          <option value="DELETE">DELETE</option>
          <option value="LOGIN_SUCCESS">LOGIN_SUCCESS</option>
          <option value="LOGIN_FAILED">LOGIN_FAILED</option>
          <option value="RECORD_AMENDED">RECORD_AMENDED</option>
          <option value="APPOINTMENT_CANCELLED">APPOINTMENT_CANCELLED</option>
          <option value="APPOINTMENT_RESCHEDULED">APPOINTMENT_RESCHEDULED</option>
          <option value="PAYMENT_RECORDED">PAYMENT_RECORDED</option>
          <option value="CLAIM_SUBMITTED">CLAIM_SUBMITTED</option>
          <option value="ROLE_CHANGE">ROLE_CHANGE</option>
        </select>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6">
              <LoadingSkeleton rows={5} />
            </div>
          ) : logs.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs">No audit events match your filter.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4">Actor</th>
                    <th className="py-3 px-4">Action</th>
                    <th className="py-3 px-4">Target Entity</th>
                    <th className="py-3 px-4">Summary</th>
                    <th className="py-3 px-4">Client IP</th>
                    <th className="py-3 px-4 text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-mono text-slate-500">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-800">
                        {log.actor_display}
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge variant={getActionBadge(log.action) as any}>{log.action}</Badge>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-700">
                        {log.entity_type} #{log.entity_id}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 max-w-xs truncate">{log.change_summary}</td>
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400">
                        {log.source_ip || '127.0.0.1'}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          className="p-1.5"
                          onClick={() => setSelectedLog(log)}
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Audit Detail Modal */}
      <Modal
        isOpen={!!selectedLog}
        onClose={() => setSelectedLog(null)}
        title={selectedLog ? `Audit Event #${selectedLog.id} Detail` : 'Audit Details'}
        maxWidth="xl"
      >
        {selectedLog && (
          <div className="space-y-4 text-xs sm:text-sm">
            <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
              <div>
                <span className="text-slate-400 block font-semibold text-[10px] uppercase">Actor</span>
                <span className="font-bold text-slate-800">{selectedLog.actor_display}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-semibold text-[10px] uppercase">Action</span>
                <span className="font-bold text-teal-700">{selectedLog.action}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-semibold text-[10px] uppercase">Entity</span>
                <span className="font-mono text-slate-800">
                  {selectedLog.entity_type} #{selectedLog.entity_id}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block font-semibold text-[10px] uppercase">Request ID</span>
                <span className="font-mono text-slate-800 text-[10px] truncate block">
                  {selectedLog.request_id || 'System'}
                </span>
              </div>
            </div>

            <div>
              <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1">
                Event Summary
              </span>
              <p className="p-3 bg-white border border-slate-200 rounded-lg text-slate-800">
                {selectedLog.change_summary}
              </p>
            </div>

            {Object.keys(selectedLog.previous_values || {}).length > 0 && (
              <div>
                <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1">
                  Previous Values Snapshot
                </span>
                <pre className="p-3 bg-slate-900 text-slate-100 rounded-lg text-xs font-mono overflow-x-auto">
                  {JSON.stringify(selectedLog.previous_values, null, 2)}
                </pre>
              </div>
            )}

            {Object.keys(selectedLog.new_values || {}).length > 0 && (
              <div>
                <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1">
                  New Values Snapshot
                </span>
                <pre className="p-3 bg-slate-900 text-teal-300 rounded-lg text-xs font-mono overflow-x-auto">
                  {JSON.stringify(selectedLog.new_values, null, 2)}
                </pre>
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <Button size="sm" variant="outline" onClick={() => setSelectedLog(null)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
