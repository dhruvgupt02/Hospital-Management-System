import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FileText, PlusCircle, History, Edit3, AlertCircle, CheckCircle2, Search } from 'lucide-react';
import { medicalRecordsService, patientsService } from '../../services/api';
import { MedicalRecord, Patient } from '../../types';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';

export const DoctorMedicalRecordsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [amendModalOpen, setAmendModalOpen] = useState(false);
  const [targetRecord, setTargetRecord] = useState<MedicalRecord | null>(null);

  // Form states for new record
  const [selectedPatientId, setSelectedPatientId] = useState<number | ''>('');
  const [diagnosis, setDiagnosis] = useState('');
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [treatmentPlan, setTreatmentPlan] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Form states for amendment
  const [amendDiagnosis, setAmendDiagnosis] = useState('');
  const [amendNotes, setAmendNotes] = useState('');
  const [amendPlan, setAmendPlan] = useState('');
  const [amendReason, setAmendReason] = useState('');

  const { data: recordsData, isLoading: recordsLoading } = useQuery({
    queryKey: ['doctor-medical-records', searchTerm],
    queryFn: () => medicalRecordsService.getRecords(searchTerm ? { search: searchTerm } : undefined),
  });

  const { data: patientsData } = useQuery({
    queryKey: ['patients-list'],
    queryFn: () => patientsService.getPatients(),
  });

  const records = recordsData?.results || [];
  const patients = patientsData?.results || [];

  const createMutation = useMutation({
    mutationFn: (payload: any) => medicalRecordsService.createRecord(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctor-medical-records'] });
      setCreateModalOpen(false);
      resetCreateForm();
    },
    onError: (err: any) => {
      setFormError(err.response?.data?.detail || 'Failed to create medical record.');
    },
  });

  const amendMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: any }) =>
      medicalRecordsService.amendRecord(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctor-medical-records'] });
      setAmendModalOpen(false);
      setTargetRecord(null);
    },
    onError: (err: any) => {
      setFormError(err.response?.data?.detail || 'Failed to amend record.');
    },
  });

  const resetCreateForm = () => {
    setSelectedPatientId('');
    setDiagnosis('');
    setClinicalNotes('');
    setTreatmentPlan('');
    setFormError(null);
  };

  const handleOpenAmend = (rec: MedicalRecord) => {
    setTargetRecord(rec);
    setAmendDiagnosis(rec.diagnosis);
    setAmendNotes(rec.clinical_notes);
    setAmendPlan(rec.treatment_plan || '');
    setAmendReason('');
    setFormError(null);
    setAmendModalOpen(true);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientId) {
      setFormError('Please select a patient.');
      return;
    }
    createMutation.mutate({
      patient: selectedPatientId,
      diagnosis,
      clinical_notes: clinicalNotes,
      treatment_plan: treatmentPlan,
    });
  };

  const handleAmendSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetRecord) return;
    if (!amendReason.trim()) {
      setFormError('An amendment reason is mandatory to preserve historical audit integrity.');
      return;
    }
    amendMutation.mutate({
      id: targetRecord.id,
      payload: {
        diagnosis: amendDiagnosis,
        clinical_notes: amendNotes,
        treatment_plan: amendPlan,
        amendment_reason: amendReason,
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy-900 tracking-tight">
            Electronic Medical Records (EMR)
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Author clinical SOAP notes, establish diagnoses, and issue controlled amendments.
          </p>
        </div>

        <Button size="sm" onClick={() => setCreateModalOpen(true)}>
          <PlusCircle className="w-4 h-4 mr-1.5" />
          Create New Medical Record
        </Button>
      </div>

      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
        <input
          type="text"
          placeholder="Search by diagnosis, patient name, or clinical keyword..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
        />
      </div>

      {recordsLoading ? (
        <LoadingSkeleton rows={4} />
      ) : records.length === 0 ? (
        <div className="py-12 text-center text-slate-500 text-xs">No medical records on file.</div>
      ) : (
        <div className="space-y-4">
          {records.map((rec) => (
            <Card key={rec.id}>
              <CardHeader>
                <div>
                  <div className="flex items-center gap-2">
                    <CardTitle>{rec.diagnosis}</CardTitle>
                    <Badge variant="outline" className="font-mono text-[10px]">
                      v{rec.version_number}
                    </Badge>
                    {rec.is_latest && <Badge variant="success">Latest</Badge>}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Patient: <strong>{rec.patient_details?.full_name}</strong> (DOB:{' '}
                    {rec.patient_details?.date_of_birth || 'N/A'})
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {rec.is_latest && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-teal-700 border-teal-200"
                      onClick={() => handleOpenAmend(rec)}
                    >
                      <Edit3 className="w-3.5 h-3.5 mr-1" />
                      Amend Record
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3 text-xs sm:text-sm">
                <div>
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                    Clinical Examination & SOAP Notes
                  </span>
                  <p className="text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100 whitespace-pre-wrap leading-relaxed">
                    {rec.clinical_notes}
                  </p>
                </div>

                {rec.treatment_plan && (
                  <div>
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                      Treatment Plan
                    </span>
                    <p className="text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100 whitespace-pre-wrap leading-relaxed">
                      {rec.treatment_plan}
                    </p>
                  </div>
                )}

                {rec.amendment_reason && (
                  <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs">
                    <strong>Amendment Justification:</strong> {rec.amendment_reason}
                  </div>
                )}

                {rec.amendment_history && rec.amendment_history.length > 0 && (
                  <div className="pt-2 border-t border-slate-100">
                    <span className="text-xs font-bold text-slate-700 flex items-center gap-1 mb-1.5">
                      <History className="w-3.5 h-3.5 text-teal-600" /> Prior Version History
                    </span>
                    <div className="space-y-1">
                      {rec.amendment_history.map((h) => (
                        <div
                          key={h.id}
                          className="p-2 bg-slate-50 rounded border border-slate-200 text-xs flex justify-between"
                        >
                          <span>
                            Revision v{h.version_number} - {h.diagnosis}
                          </span>
                          <span className="text-slate-400">
                            {new Date(h.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Medical Record Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Author New Electronic Medical Record"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs sm:text-sm">
          {formError && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
              Select Patient
            </label>
            <select
              value={selectedPatientId}
              onChange={(e) => setSelectedPatientId(Number(e.target.value))}
              required
              className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
            >
              <option value="">-- Choose Patient --</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.full_name} ({p.email})
                </option>
              ))}
            </select>
          </div>

          <Input
            label="Clinical Diagnosis (Primary Condition)"
            value={diagnosis}
            onChange={(e) => setDiagnosis(e.target.value)}
            placeholder="e.g. Essential Hypertension, Type 2 Diabetes"
            required
          />

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
              Clinical & SOAP Examination Notes
            </label>
            <textarea
              rows={4}
              value={clinicalNotes}
              onChange={(e) => setClinicalNotes(e.target.value)}
              placeholder="Subjective history, Objective physical findings, Assessment..."
              required
              className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
            ></textarea>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
              Treatment Plan & Recommendations
            </label>
            <textarea
              rows={3}
              value={treatmentPlan}
              onChange={(e) => setTreatmentPlan(e.target.value)}
              placeholder="Pharmacotherapy, lifestyle counseling, follow-up timeline..."
              className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
            ></textarea>
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <Button variant="outline" size="sm" type="button" onClick={() => setCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" type="submit" isLoading={createMutation.isPending}>
              Finalize Medical Record
            </Button>
          </div>
        </form>
      </Modal>

      {/* Amend Medical Record Modal */}
      <Modal
        isOpen={amendModalOpen}
        onClose={() => setAmendModalOpen(false)}
        title={targetRecord ? `Amend Clinical Record #${targetRecord.id}` : 'Amend Record'}
      >
        <form onSubmit={handleAmendSubmit} className="space-y-4 text-xs sm:text-sm">
          {formError && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800">
            <strong>Controlled Temporal Amendment:</strong> The current record (v
            {targetRecord?.version_number}) will be preserved in historical archive. A new version will
            be established with your recorded justification.
          </div>

          <Input
            label="Updated Diagnosis"
            value={amendDiagnosis}
            onChange={(e) => setAmendDiagnosis(e.target.value)}
            required
          />

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
              Updated Clinical Notes
            </label>
            <textarea
              rows={4}
              value={amendNotes}
              onChange={(e) => setAmendNotes(e.target.value)}
              required
              className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
            ></textarea>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
              Updated Treatment Plan
            </label>
            <textarea
              rows={3}
              value={amendPlan}
              onChange={(e) => setAmendPlan(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
            ></textarea>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
              Amendment Justification / Reason (Mandatory)
            </label>
            <textarea
              rows={2}
              value={amendReason}
              onChange={(e) => setAmendReason(e.target.value)}
              placeholder="e.g. Integrated follow-up lab findings and amended pharmacotherapy."
              required
              className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
            ></textarea>
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <Button variant="outline" size="sm" type="button" onClick={() => setAmendModalOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" type="submit" isLoading={amendMutation.isPending}>
              Issue Amendment Revision
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
