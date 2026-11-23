import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, Shield, UserCheck, UserX, Edit2, AlertCircle, Search } from 'lucide-react';
import { authService } from '../../services/api';
import { User, UserRole } from '../../types';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';

export const UserManagementPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [targetUser, setTargetUser] = useState<User | null>(null);
  const [selectedRole, setSelectedRole] = useState<UserRole>('PATIENT');
  const [isActive, setIsActive] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { data: usersData, isLoading } = useQuery({
    queryKey: ['admin-users', roleFilter, searchTerm],
    queryFn: () =>
      authService.getUsers({
        role: roleFilter || undefined,
        search: searchTerm || undefined,
      }),
  });

  const users = usersData?.results || [];

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<User> }) =>
      authService.updateUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setEditModalOpen(false);
      setTargetUser(null);
    },
    onError: (err: any) => {
      setErrorMsg(err.response?.data?.detail || 'Failed to update user status/role.');
    },
  });

  const handleOpenEdit = (u: User) => {
    setTargetUser(u);
    setSelectedRole(u.role);
    setIsActive(u.is_active);
    setErrorMsg(null);
    setEditModalOpen(true);
  };

  const handleUpdateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUser) return;
    updateMutation.mutate({
      id: targetUser.id,
      data: {
        role: selectedRole,
        is_active: isActive,
      },
    });
  };

  const getRoleVariant = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'danger';
      case 'DOCTOR':
        return 'primary';
      case 'PATIENT':
        return 'info';
      case 'RECEPTIONIST':
        return 'secondary';
      case 'LAB_TECHNICIAN':
        return 'warning';
      case 'BILLING_STAFF':
        return 'success';
      default:
        return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy-900 tracking-tight">Staff & User Management</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Maintain user access privileges, account activation states, and role assignments.
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by user name or email address..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
          />
        </div>

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-4 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20"
        >
          <option value="">All Hospital Roles</option>
          <option value="ADMIN">Administrator</option>
          <option value="DOCTOR">Doctor</option>
          <option value="PATIENT">Patient</option>
          <option value="RECEPTIONIST">Receptionist</option>
          <option value="LAB_TECHNICIAN">Laboratory Technician</option>
          <option value="BILLING_STAFF">Billing Staff</option>
        </select>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6">
              <LoadingSkeleton rows={4} />
            </div>
          ) : users.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs">No user accounts found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="py-3 px-4">User</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">Assigned Role</th>
                    <th className="py-3 px-4">Account Status</th>
                    <th className="py-3 px-4">Registered On</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-900">{u.full_name}</td>
                      <td className="py-3.5 px-4 text-slate-600 font-mono">{u.email}</td>
                      <td className="py-3.5 px-4">
                        <Badge variant={getRoleVariant(u.role)}>{u.role_display}</Badge>
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge variant={u.is_active ? 'success' : 'danger'}>
                          {u.is_active ? 'Active' : 'Disabled'}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500">
                        {new Date(u.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Button size="sm" variant="outline" onClick={() => handleOpenEdit(u)}>
                          <Edit2 className="w-3.5 h-3.5 mr-1" />
                          Manage Role
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

      {/* Edit Role & Status Modal */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title={targetUser ? `Manage Account: ${targetUser.email}` : 'Edit User'}
      >
        <form onSubmit={handleUpdateSubmit} className="space-y-4 text-xs sm:text-sm">
          {errorMsg && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
              Role Permission Class
            </label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value as UserRole)}
              className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            >
              <option value="ADMIN">Administrator (Full Governance)</option>
              <option value="DOCTOR">Doctor (Clinical & Prescriptions)</option>
              <option value="PATIENT">Patient (Self-Service)</option>
              <option value="RECEPTIONIST">Receptionist (Admissions & Desk)</option>
              <option value="LAB_TECHNICIAN">Laboratory Technician (Diagnostics)</option>
              <option value="BILLING_STAFF">Billing Staff (Finance & Insurance)</option>
            </select>
          </div>

          <div className="pt-2">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500"
              />
              <span className="text-xs font-semibold text-slate-800">
                Account Active & Authorized to Sign In
              </span>
            </label>
            <p className="text-[11px] text-slate-400 mt-1 ml-6">
              Deactivating a user instantly terminates session access and blocks subsequent logins.
            </p>
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setEditModalOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" type="submit" isLoading={updateMutation.isPending}>
              Commit Changes
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
