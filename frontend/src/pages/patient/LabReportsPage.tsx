import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { FlaskConical, Download, CheckCircle2, Clock, AlertCircle, FileText } from 'lucide-react';
import { laboratoryService } from '../../services/api';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';

export const LabReportsPage: React.FC = () => {
  const { data: ordersData, isLoading } = useQuery({
    queryKey: ['patient-lab-orders'],
    queryFn: () => laboratoryService.getOrders(),
  });

  const orders = ordersData?.results || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy-900 tracking-tight">Laboratory & Diagnostic Reports</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Review diagnostic pathology, biological reference ranges, and verified technician findings.
        </p>
      </div>

      {isLoading ? (
        <LoadingSkeleton rows={4} />
      ) : orders.length === 0 ? (
        <div className="py-12 text-center text-slate-500 text-xs">
          No laboratory test orders found for your account.
        </div>
      ) : (
        <div className="space-y-5">
          {orders.map((order) => (
            <Card key={order.id}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-700 flex-shrink-0">
                    <FlaskConical className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">{order.test_name}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Ordered by Dr. {order.ordered_by_details?.full_name || 'Physician'} on{' '}
                      {new Date(order.ordered_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <Badge variant={order.status === 'Completed' ? 'success' : 'primary'}>
                  {order.status}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-4">
                {order.clinical_notes && (
                  <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <strong>Clinical Indication:</strong> {order.clinical_notes}
                  </p>
                )}

                {order.reports && order.reports.length > 0 ? (
                  <div className="space-y-3">
                    <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Technician Findings & Reference Intervals
                    </h4>
                    {order.reports.map((rep) => (
                      <div
                        key={rep.id}
                        className="p-4 rounded-xl border border-slate-200/80 bg-white space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-800">
                              Report Revision v{rep.version_number}
                            </span>
                            <Badge variant={rep.verification_status === 'Verified' ? 'success' : 'warning'}>
                              {rep.verification_status}
                            </Badge>
                          </div>
                          <span className="text-[11px] text-slate-400">
                            Reported: {new Date(rep.reported_at).toLocaleString()}
                          </span>
                        </div>

                        <div className="p-3 bg-slate-50 rounded-lg text-xs font-mono text-slate-800 whitespace-pre-wrap leading-relaxed">
                          {rep.result}
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-500 pt-1">
                          <div>
                            {rep.reference_range && (
                              <span>
                                <strong>Standard Reference:</strong> {rep.reference_range} {rep.unit}
                              </span>
                            )}
                            {rep.verified_by_name && (
                              <span className="ml-3 text-slate-400">
                                Verified by: {rep.verified_by_name}
                              </span>
                            )}
                          </div>
                          {rep.file_url && (
                            <a
                              href={rep.file_url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 text-teal-600 hover:text-teal-700 font-semibold"
                            >
                              <Download className="w-3.5 h-3.5" />
                              Download Attachment
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic py-2">
                    Specimen in laboratory processing queue. Results will be published upon technician verification.
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
