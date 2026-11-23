import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FlaskConical, CheckCircle2, XCircle, Download, Clock, ShieldCheck } from 'lucide-react';
import { laboratoryService } from '../../services/api';
import { LaboratoryReport } from '../../types';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';

export const LabReportsHistoryPage: React.FC = () => {
  const queryClient = useQueryClient();

  const { data: reportsData, isLoading } = useQuery({
    queryKey: ['lab-reports-list'],
    queryFn: () => laboratoryService.getReports(),
  });

  const reports = reportsData?.results || [];

  const verifyMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      laboratoryService.verifyReport(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['lab-reports-list'] }),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy-900 tracking-tight">Verified Diagnostic Reports</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Historical repository of validated laboratory test findings and quality audit status.
        </p>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6">
              <LoadingSkeleton rows={4} />
            </div>
          ) : reports.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs">No laboratory reports filed yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="py-3 px-4">Report #</th>
                    <th className="py-3 px-4">Findings Preview</th>
                    <th className="py-3 px-4">Reference Range</th>
                    <th className="py-3 px-4">Filed At</th>
                    <th className="py-3 px-4">Verification</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {reports.map((rep) => (
                    <tr key={rep.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-mono text-slate-600 font-bold">
                        #{rep.id} (v{rep.version_number})
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-800 max-w-sm truncate">
                        {rep.result}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {rep.reference_range ? `${rep.reference_range} ${rep.unit}` : '—'}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500">
                        {new Date(rep.reported_at).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge variant={rep.verification_status === 'Verified' ? 'success' : 'warning'}>
                          {rep.verification_status}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-1.5">
                        {rep.verification_status !== 'Verified' && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                            onClick={() => verifyMutation.mutate({ id: rep.id, status: 'Verified' })}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                            Verify
                          </Button>
                        )}
                        {rep.file_url && (
                          <a
                            href={rep.file_url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-teal-600 hover:text-teal-700 font-medium p-1"
                          >
                            <Download className="w-4 h-4" />
                          </a>
                        )}
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
