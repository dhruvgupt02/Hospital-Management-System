import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FileText, Clock, History, User, Search, Stethoscope, ChevronDown, ChevronUp } from 'lucide-react';
import { medicalRecordsService } from '../../services/api';
import { MedicalRecord } from '../../types';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';

export const MedicalHistoryPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedRecordId, setExpandedRecordId] = useState<number | null>(null);

  const { data: recordsData, isLoading } = useQuery({
    queryKey: ['patient-records', searchTerm],
    queryFn: () => medicalRecordsService.getRecords(searchTerm ? { search: searchTerm } : undefined),
  });

  const records = recordsData?.results || [];

  const toggleExpand = (id: number) => {
    setExpandedRecordId(expandedRecordId === id ? null : id);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy-900 tracking-tight">Electronic Medical Records</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Historical diagnoses, physician examination notes, treatment regimens, and version-controlled amendments.
        </p>
      </div>

      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
        <input
          type="text"
          placeholder="Search diagnoses, examination notes, or medications..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
        />
      </div>

      {isLoading ? (
        <LoadingSkeleton rows={4} />
      ) : records.length === 0 ? (
        <div className="py-12 text-center text-slate-500 text-xs">
          No medical records found matching your inquiry.
        </div>
      ) : (
        <div className="space-y-4">
          {records.map((rec) => {
            const isExpanded = expandedRecordId === rec.id;
            return (
              <Card key={rec.id} className="overflow-hidden">
                <div
                  onClick={() => toggleExpand(rec.id)}
                  className="p-5 flex items-start justify-between gap-4 cursor-pointer hover:bg-slate-50/50 transition-colors"
                >
                  <div className="flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-700 flex-shrink-0 mt-0.5">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-slate-900">{rec.diagnosis}</h3>
                        <Badge variant="outline" className="text-[10px] font-mono">
                          v{rec.version_number}
                        </Badge>
                        {rec.is_latest && (
                          <Badge variant="success" className="text-[10px]">
                            Latest Revision
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        Treating Physician:{' '}
                        <span className="font-semibold text-slate-700">
                          Dr. {rec.doctor_details?.full_name || 'Physician'}
                        </span>{' '}
                        ({rec.doctor_details?.specialization})
                      </p>
                      <div className="flex items-center gap-4 text-[11px] text-slate-400 mt-1.5">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" /> Encounter:{' '}
                          {new Date(rec.recorded_at).toLocaleDateString()}
                        </span>
                        <span>Logged: {new Date(rec.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-slate-400">
                    <span className="text-xs hidden sm:inline-block">
                      {isExpanded ? 'Hide Details' : 'View Full Notes'}
                    </span>
                    {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </div>
                </div>

                {isExpanded && (
                  <div className="px-5 pb-5 pt-2 border-t border-slate-100 bg-slate-50/30 space-y-4 text-xs sm:text-sm animate-in fade-in duration-150">
                    <div>
                      <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                        Clinical & SOAP Examination Notes
                      </h4>
                      <p className="text-slate-700 bg-white p-3.5 rounded-xl border border-slate-200/80 leading-relaxed whitespace-pre-wrap">
                        {rec.clinical_notes}
                      </p>
                    </div>

                    {rec.treatment_plan && (
                      <div>
                        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                          Treatment Plan & Recommendations
                        </h4>
                        <p className="text-slate-700 bg-white p-3.5 rounded-xl border border-slate-200/80 leading-relaxed whitespace-pre-wrap">
                          {rec.treatment_plan}
                        </p>
                      </div>
                    )}

                    {rec.amendment_reason && (
                      <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs">
                        <strong className="block mb-0.5">Physician Amendment Note:</strong>
                        {rec.amendment_reason}
                      </div>
                    )}

                    {/* Temporal Amendment History Timeline */}
                    {rec.amendment_history && rec.amendment_history.length > 0 && (
                      <div className="pt-3 border-t border-slate-200/60">
                        <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mb-2">
                          <History className="w-4 h-4 text-teal-600" />
                          Prior Version Audit Trail
                        </h4>
                        <div className="space-y-2">
                          {rec.amendment_history.map((hist) => (
                            <div key={hist.id} className="p-3 bg-white rounded-lg border border-slate-200 text-xs">
                              <div className="flex items-center justify-between text-slate-500 text-[11px] mb-1">
                                <span className="font-semibold text-slate-700">Revision v{hist.version_number}</span>
                                <span>{new Date(hist.created_at).toLocaleString()}</span>
                              </div>
                              <p className="text-slate-800 font-medium">{hist.diagnosis}</p>
                              <p className="text-slate-500 line-clamp-2 mt-0.5">{hist.clinical_notes}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
