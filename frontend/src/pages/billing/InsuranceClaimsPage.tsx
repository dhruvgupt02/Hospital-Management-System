import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ShieldCheck, PlusCircle, CheckCircle2, XCircle, AlertCircle, Clock } from 'lucide-react';
import { insuranceService, billingService } from '../../services/api';
import { InsuranceClaim, Invoice, InsurancePolicy } from '../../types';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';

export const InsuranceClaimsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [adjudicateModalOpen, setAdjudicateModalOpen] = useState(false);
  const [targetClaim, setTargetClaim] = useState<InsuranceClaim | null>(null);

  // New claim form
  const [invoiceId, setInvoiceId] = useState<number | ''>('');
  const [policyId, setPolicyId] = useState<number | ''>('');
  const [claimAmount, setClaimAmount] = useState('');
  const [claimError, setClaimError] = useState<string | null>(null);

  // Adjudicate form
  const [adjStatus, setAdjStatus] = useState('Approved');
  const [approvedAmount, setApprovedAmount] = useState('');
  const [adjudicationNotes, setAdjudicationNotes] = useState('');

  const { data: claimsData, isLoading } = useQuery({
    queryKey: ['insurance-claims-list'],
    queryFn: () => insuranceService.getClaims(),
  });

  const { data: invoicesData } = useQuery({
    queryKey: ['unpaid-invoices'],
    queryFn: () => billingService.getInvoices({ status: 'Unpaid' }),
  });

  const { data: policiesData } = useQuery({
    queryKey: ['insurance-policies'],
    queryFn: () => insuranceService.getPolicies(),
  });

  const claims = claimsData?.results || [];
  const invoices = invoicesData?.results || [];
  const policies = policiesData?.results || [];

  const createClaimMutation = useMutation({
    mutationFn: (payload: any) => insuranceService.createClaim(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['insurance-claims-list'] });
      setSubmitModalOpen(false);
      resetClaimForm();
    },
    onError: (err: any) => {
      setClaimError(err.response?.data?.detail || 'Failed to submit insurance claim.');
    },
  });

  const adjudicateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: any }) =>
      insuranceService.adjudicateClaim(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['insurance-claims-list'] });
      queryClient.invalidateQueries({ queryKey: ['billing-invoices-overview'] });
      setAdjudicateModalOpen(false);
      setTargetClaim(null);
    },
    onError: (err: any) => {
      setClaimError(err.response?.data?.detail || 'Adjudication failed.');
    },
  });

  const resetClaimForm = () => {
    setInvoiceId('');
    setPolicyId('');
    setClaimAmount('');
    setClaimError(null);
  };

  const handleOpenAdjudicate = (claim: InsuranceClaim) => {
    setTargetClaim(claim);
    setAdjStatus(claim.status === 'Submitted' ? 'Approved' : claim.status);
    setApprovedAmount(claim.approved_amount || claim.claim_amount);
    setAdjudicationNotes(claim.adjudication_notes || '');
    setClaimError(null);
    setAdjudicateModalOpen(true);
  };

  const handleClaimSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoiceId || !policyId || !claimAmount) {
      setClaimError('Please select invoice, policy, and claim amount.');
      return;
    }
    createClaimMutation.mutate({
      invoice: invoiceId,
      insurance_policy: policyId,
      claim_amount: claimAmount,
    });
  };

  const handleAdjudicateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetClaim) return;
    adjudicateMutation.mutate({
      id: targetClaim.id,
      payload: {
        status: adjStatus,
        approved_amount: approvedAmount,
        adjudication_notes: adjudicationNotes,
      },
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Approved':
      case 'Settled':
        return 'success';
      case 'Submitted':
      case 'Under_Review':
        return 'warning';
      case 'Rejected':
        return 'danger';
      default:
        return 'secondary';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy-900 tracking-tight">Insurance Claims & Coverage</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Submit billing claims to commercial health payers and track adjudication status.
          </p>
        </div>

        <Button size="sm" onClick={() => setSubmitModalOpen(true)}>
          <PlusCircle className="w-4 h-4 mr-1.5" />
          Submit Insurance Claim
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6">
              <LoadingSkeleton rows={4} />
            </div>
          ) : claims.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs">No insurance claims on record.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="py-3 px-4">Claim #</th>
                    <th className="py-3 px-4">Invoice #</th>
                    <th className="py-3 px-4">Insurer & Policy</th>
                    <th className="py-3 px-4">Claimed</th>
                    <th className="py-3 px-4">Approved</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {claims.map((clm) => (
                    <tr key={clm.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{clm.claim_number}</td>
                      <td className="py-3.5 px-4 font-mono text-slate-600">
                        {clm.invoice_details?.invoice_number}
                      </td>
                      <td className="py-3.5 px-4 text-slate-800">
                        <div className="font-semibold">{clm.policy_details?.insurer_name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {clm.policy_details?.policy_number}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">${clm.claim_amount}</td>
                      <td className="py-3.5 px-4 text-emerald-700 font-bold">
                        ${clm.approved_amount || '0.00'}
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge variant={getStatusBadge(clm.status)}>{clm.status.replace('_', ' ')}</Badge>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Button size="sm" variant="outline" onClick={() => handleOpenAdjudicate(clm)}>
                          Adjudicate
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

      {/* Submit Claim Modal */}
      <Modal
        isOpen={submitModalOpen}
        onClose={() => setSubmitModalOpen(false)}
        title="Submit New Health Insurance Claim"
      >
        <form onSubmit={handleClaimSubmit} className="space-y-4 text-xs sm:text-sm">
          {claimError && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{claimError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
              Select Outstanding Invoice
            </label>
            <select
              value={invoiceId}
              onChange={(e) => {
                const invId = Number(e.target.value);
                setInvoiceId(invId);
                const inv = invoices.find((i) => i.id === invId);
                if (inv) setClaimAmount(inv.total_amount);
              }}
              required
              className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            >
              <option value="">-- Choose Invoice --</option>
              {invoices.map((inv) => (
                <option key={inv.id} value={inv.id}>
                  {inv.invoice_number} - {inv.patient_details?.full_name} (${inv.total_amount})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
              Matching Patient Insurance Policy
            </label>
            <select
              value={policyId}
              onChange={(e) => setPolicyId(Number(e.target.value))}
              required
              className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            >
              <option value="">-- Choose Policy --</option>
              {policies.map((pol) => (
                <option key={pol.id} value={pol.id}>
                  {pol.insurer_name} ({pol.policy_number}) - {pol.patient_details?.full_name}
                </option>
              ))}
            </select>
          </div>

          <Input
            label="Claim Amount ($)"
            type="number"
            step="0.01"
            value={claimAmount}
            onChange={(e) => setClaimAmount(e.target.value)}
            required
          />

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setSubmitModalOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" type="submit" isLoading={createClaimMutation.isPending}>
              Submit Claim
            </Button>
          </div>
        </form>
      </Modal>

      {/* Adjudicate Claim Modal */}
      <Modal
        isOpen={adjudicateModalOpen}
        onClose={() => setAdjudicateModalOpen(false)}
        title={targetClaim ? `Adjudicate Claim #${targetClaim.claim_number}` : 'Adjudicate Claim'}
      >
        <form onSubmit={handleAdjudicateSubmit} className="space-y-4 text-xs sm:text-sm">
          {claimError && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{claimError}</span>
            </div>
          )}

          <div className="p-3 bg-teal-50/70 rounded-xl border border-teal-100 text-xs">
            Payer: <strong>{targetClaim?.policy_details?.insurer_name}</strong> | Original Claimed:{' '}
            <strong>${targetClaim?.claim_amount}</strong>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
              Adjudication Decision Status
            </label>
            <select
              value={adjStatus}
              onChange={(e) => setAdjStatus(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            >
              <option value="Under_Review">Under Review</option>
              <option value="Approved">Approved (Awaiting Payout)</option>
              <option value="Settled">Settled (Auto-Credit Payment to Invoice)</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>

          <Input
            label="Approved Coverage Amount ($)"
            type="number"
            step="0.01"
            value={approvedAmount}
            onChange={(e) => setApprovedAmount(e.target.value)}
          />

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
              Adjudication Notes / Payer Explanation of Benefits (EOB)
            </label>
            <textarea
              rows={3}
              value={adjudicationNotes}
              onChange={(e) => setAdjudicationNotes(e.target.value)}
              placeholder="e.g. 80% coverage rate applied per policy deductible."
              className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            ></textarea>
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setAdjudicateModalOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" type="submit" isLoading={adjudicateMutation.isPending}>
              Update Adjudication
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
