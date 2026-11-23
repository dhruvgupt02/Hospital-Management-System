import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Users, Search, Phone, Calendar, Heart, Shield, PlusCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { patientsService } from '../../services/api';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';

export const ReceptionistPatientsPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const { data: patientsData, isLoading } = useQuery({
    queryKey: ['receptionist-patients', searchTerm],
    queryFn: () => patientsService.getPatients(searchTerm ? { search: searchTerm } : undefined),
  });

  const patients = patientsData?.results || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy-900 tracking-tight">Patient Directory</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Search patient records, contact numbers, and verify emergency contact details.
          </p>
        </div>

        <Link to="/receptionist/register-patient">
          <Button size="sm">
            <PlusCircle className="w-4 h-4 mr-1.5" />
            Admit New Patient
          </Button>
        </Link>
      </div>

      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
        <input
          type="text"
          placeholder="Search by name, email, or telephone number..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
        />
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6">
              <LoadingSkeleton rows={4} />
            </div>
          ) : patients.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs">No patients found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="py-3 px-4">Patient Name</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">DOB (Gender)</th>
                    <th className="py-3 px-4">Telephone</th>
                    <th className="py-3 px-4">Emergency Contact</th>
                    <th className="py-3 px-4">Blood Group</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {patients.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-900">{p.full_name}</td>
                      <td className="py-3.5 px-4 text-slate-600">{p.email}</td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {p.date_of_birth || 'N/A'} ({p.gender})
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">{p.phone || 'N/A'}</td>
                      <td className="py-3.5 px-4 text-slate-600">{p.emergency_contact || 'N/A'}</td>
                      <td className="py-3.5 px-4">
                        {p.blood_group ? (
                          <Badge variant="primary">{p.blood_group}</Badge>
                        ) : (
                          <span className="text-slate-400">—</span>
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
