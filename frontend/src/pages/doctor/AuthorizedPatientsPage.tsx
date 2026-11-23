import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Users, Phone, MapPin, AlertCircle, Heart, Search } from 'lucide-react';
import { patientsService } from '../../services/api';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';

export const AuthorizedPatientsPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const { data: patientsData, isLoading } = useQuery({
    queryKey: ['authorized-patients', searchTerm],
    queryFn: () => patientsService.getPatients(searchTerm ? { search: searchTerm } : undefined),
  });

  const patients = patientsData?.results || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy-900 tracking-tight">Authorized Patient Roster</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Review patient demographic profiles, known clinical allergies, and emergency contact details.
        </p>
      </div>

      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
        <input
          type="text"
          placeholder="Search by patient name, email, or telephone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
        />
      </div>

      {isLoading ? (
        <LoadingSkeleton rows={4} />
      ) : patients.length === 0 ? (
        <div className="py-12 text-center text-slate-500 text-xs">No patients found.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {patients.map((p) => (
            <Card key={p.id}>
              <CardContent className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-700 font-bold">
                    {p.first_name?.[0]}
                    {p.last_name?.[0]}
                  </div>
                  {p.blood_group && (
                    <Badge variant="primary" className="font-mono">
                      {p.blood_group}
                    </Badge>
                  )}
                </div>

                <div>
                  <h3 className="font-bold text-sm text-slate-900">{p.full_name}</h3>
                  <p className="text-xs text-slate-500">{p.email}</p>
                </div>

                <div className="space-y-1 text-xs text-slate-600 pt-1">
                  <p className="flex items-center gap-1.5">
                    <span className="text-slate-400 font-medium">DOB:</span> {p.date_of_birth || 'N/A'} (
                    {p.gender})
                  </p>
                  <p className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400" /> {p.phone || 'N/A'}
                  </p>
                  {p.emergency_contact && (
                    <p className="text-[11px] text-slate-500">
                      <strong>Emergency:</strong> {p.emergency_contact}
                    </p>
                  )}
                  {p.allergies && (
                    <div className="mt-2 p-2 bg-rose-50 border border-rose-100 rounded-lg text-rose-800 text-[11px] flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>
                        <strong>Allergies:</strong> {p.allergies}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
