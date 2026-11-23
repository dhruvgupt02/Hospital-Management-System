import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Pill, Clock, AlertCircle, CheckCircle } from 'lucide-react';
import { prescriptionsService } from '../../services/api';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';

export const PrescriptionsPage: React.FC = () => {
  const { data: rxData, isLoading } = useQuery({
    queryKey: ['patient-prescriptions'],
    queryFn: () => prescriptionsService.getPrescriptions(),
  });

  const prescriptions = rxData?.results || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy-900 tracking-tight">Prescriptions & Medications</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Active medication regimens, dosage instructions, and dispensing directives authored by your doctors.
        </p>
      </div>

      {isLoading ? (
        <LoadingSkeleton rows={4} />
      ) : prescriptions.length === 0 ? (
        <div className="py-12 text-center text-slate-500 text-xs">
          No prescriptions currently recorded for your profile.
        </div>
      ) : (
        <div className="space-y-6">
          {prescriptions.map((rx) => (
            <Card key={rx.id}>
              <CardHeader>
                <div>
                  <div className="flex items-center gap-2">
                    <CardTitle>Prescription #{rx.id}</CardTitle>
                    <Badge variant={rx.status === 'Active' ? 'success' : 'secondary'}>
                      {rx.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Prescribed by Dr. {rx.doctor_details?.full_name || 'Physician'} on{' '}
                    {new Date(rx.prescribed_at).toLocaleDateString()}
                  </p>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {rx.instructions && (
                  <div className="p-3 bg-teal-50/50 border border-teal-100 rounded-xl text-xs text-teal-800">
                    <strong className="block mb-0.5 font-semibold">Physician Directions:</strong>
                    {rx.instructions}
                  </div>
                )}

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                      <tr>
                        <th className="py-2.5 px-3">Medicine Name</th>
                        <th className="py-2.5 px-3">Dosage</th>
                        <th className="py-2.5 px-3">Frequency</th>
                        <th className="py-2.5 px-3">Duration</th>
                        <th className="py-2.5 px-3">Quantity</th>
                        <th className="py-2.5 px-3">Instructions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {rx.items?.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="py-2.5 px-3 font-bold text-slate-900">{item.medicine_name}</td>
                          <td className="py-2.5 px-3 text-slate-600 font-medium">{item.dosage}</td>
                          <td className="py-2.5 px-3 text-slate-600">{item.frequency}</td>
                          <td className="py-2.5 px-3 text-slate-600">{item.duration}</td>
                          <td className="py-2.5 px-3 text-slate-600 font-semibold">{item.quantity}</td>
                          <td className="py-2.5 px-3 text-slate-500 italic max-w-xs truncate">
                            {item.additional_instructions || '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
