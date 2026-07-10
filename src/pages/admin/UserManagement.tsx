import React, { useState } from "react";
import { Loader2, Search, Edit2, ShieldAlert } from "lucide-react";
import { useUsersQuery } from "../../hooks/useQueries";

import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../contexts/ToastContext";
import { useMutation, useQueryClient } from "@tanstack/react-query";


export default function UserManagement() {
  const { data: usersResponse, isLoading: loading } = useUsersQuery();
  const users = usersResponse?.data || usersResponse || [];
  const [search, setSearch] = useState('');

  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [tempPassword, setTempPassword] = useState('');
  const { getToken } = useAuth();
  const { success: showSuccess, error: showError } = useToast();
  const queryClient = useQueryClient();

  const updateUserMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string, data: any }) => {
      const token = await getToken();
      const res = await fetch(`/api/v1/admin/users/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      showSuccess('User updated successfully');
      setSelectedUser(null);
    },
    onError: (err: any) => {
      showError(err.message || 'Failed to update user');
    }
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async ({ id, temporaryPassword }: { id: string, temporaryPassword: string }) => {
      const token = await getToken();
      const res = await fetch(`/api/v1/admin/users/${id}/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ temporaryPassword })
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || await res.text() || 'Failed to reset password');
      }
      return res.json();
    },
    onSuccess: () => {
      showSuccess('Password reset successfully');
      setTempPassword('');
    },
    onError: (err: any) => {
      showError(err.message || 'Failed to reset password');
    }
  });

  const handleUpdateStatus = (status: string) => {
    if (!selectedUser) return;
    updateUserMutation.mutate({ id: selectedUser.id, data: { status } });
  };

  const handleResetPassword = () => {
    if (!selectedUser || !tempPassword || tempPassword.length < 6) {
      showError('Please enter a valid temporary password (min 6 chars)');
      return;
    }
    resetPasswordMutation.mutate({ id: selectedUser.id, temporaryPassword: tempPassword });
  };



  const filteredUsers = users.filter(u => 
    u.firstName.toLowerCase().includes(search.toLowerCase()) || 
    u.lastName.toLowerCase().includes(search.toLowerCase()) || 
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-end mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 mb-1">User Directory</h1>
          <p className="text-slate-500 text-sm">Manage all enterprise accounts, roles, and status.</p>
        </div>
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input 
            type="text" 
            placeholder="Search users..."
            className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm w-64 focus:outline-none focus:ring-2 focus:ring-pink-500"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col min-h-[500px]">
        {loading ? (
          <div className="flex-1 flex justify-center items-center"><Loader2 className="w-8 h-8 animate-spin text-slate-400" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-700 font-medium border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Employee</th>
                  <th className="px-6 py-4">Department & Supervisor</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Joined Department</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map(user => (
                  <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900">{user.firstName} {user.lastName}</div>
                      <div className="text-xs text-slate-500">{user.email}</div>
                      <div className="text-xs font-semibold text-slate-400 mt-0.5">{user.jobTitle || 'Field Staff'}</div>
                      {user.employeeNumber && <div className="text-[10px] text-slate-400 font-mono mt-1 bg-slate-100 px-1.5 py-0.5 rounded w-max">ID: {user.employeeNumber}</div>}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-800">{user.department?.name || 'Unassigned'}</div>
                      <div className="text-xs text-slate-500 mt-1 font-medium">
                        Supervisor: <strong className="text-slate-700">{user.manager ? `${user.manager.firstName} ${user.manager.lastName}` : 'None assigned'}</strong>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold ${
                        user.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 
                        user.status === 'PENDING_APPROVAL' ? 'bg-amber-100 text-amber-700' :
                        user.status === 'REJECTED' ? 'bg-red-100 text-red-700' : 
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs font-bold text-slate-700">
                        {user.dateJoinedDepartment ? new Date(user.dateJoinedDepartment).toLocaleDateString() : 'N/A'}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-1 font-medium">
                        Onboarded: {user.onboardingCompletedAt ? new Date(user.onboardingCompletedAt).toLocaleDateString() : 'Pending'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => setSelectedUser(user)} className="p-2 hover:bg-slate-200 rounded-lg text-slate-500 transition-colors tooltip" title="Edit User">
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                      No users found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      
      {selectedUser && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-lg font-bold text-slate-800">Manage User</h2>
              <button onClick={() => { setSelectedUser(null); setTempPassword(''); }} className="text-slate-400 hover:text-slate-600">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <div className="p-6 flex-1 overflow-y-auto space-y-6">
              <div>
                <h3 className="text-sm font-bold text-slate-900">{selectedUser.firstName} {selectedUser.lastName}</h3>
                <p className="text-xs text-slate-500">{selectedUser.email}</p>
                <div className="mt-2 text-xs font-medium text-slate-600 bg-slate-100 px-2 py-1 rounded inline-block">
                  Current Status: <span className={
                    selectedUser.status === 'ACTIVE' ? 'text-emerald-600' :
                    selectedUser.status === 'INACTIVE' ? 'text-red-600' : 'text-amber-600'
                  }>{selectedUser.status}</span>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Account Status</h4>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleUpdateStatus('ACTIVE')}
                    disabled={updateUserMutation.isPending || selectedUser.status === 'ACTIVE'}
                    className="flex-1 py-2 text-sm font-bold rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100 disabled:opacity-50"
                  >
                    Set Active
                  </button>
                  <button
                    onClick={() => handleUpdateStatus('INACTIVE')}
                    disabled={updateUserMutation.isPending || selectedUser.status === 'INACTIVE'}
                    className="flex-1 py-2 text-sm font-bold rounded bg-red-50 text-red-700 hover:bg-red-100 disabled:opacity-50"
                  >
                    Disable (Inactive)
                  </button>
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t border-slate-100">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Manual Password Reset</h4>
                <p className="text-xs text-slate-500">
                  Assign a temporary password to this user. Advise them to reset it after logging in.
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Temp Password (min 6)"
                    value={tempPassword}
                    onChange={(e) => setTempPassword(e.target.value)}
                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-slate-300"
                  />
                  <button
                    onClick={handleResetPassword}
                    disabled={resetPasswordMutation.isPending || tempPassword.length < 6}
                    className="px-4 py-2 bg-slate-800 text-white text-sm font-bold rounded-lg hover:bg-slate-700 disabled:opacity-50"
                  >
                    {resetPasswordMutation.isPending ? 'Resetting...' : 'Reset'}
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
</div>
    </div>
  );
}
