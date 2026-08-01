import React, { useState, useEffect } from "react";
import { Loader2, Search, Edit2, ShieldAlert, ArrowLeft, X } from "lucide-react";
import { SearchableSelect } from "../../components/ui/SearchableSelect";
import { useUsersQuery, useRolesQuery, useDepartmentsQuery } from "../../hooks/useQueries";

import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../contexts/ToastContext";
import { useMutation, useQueryClient } from "@tanstack/react-query";


export default function UserManagement() {
  const { data: usersResponse, isLoading: loading } = useUsersQuery();
  const { data: rolesResponse } = useRolesQuery();
  const { data: departmentsResponse } = useDepartmentsQuery();
  
  const users = usersResponse?.data || usersResponse || [];
  const roles = rolesResponse?.data || rolesResponse || [];
  const departments = departmentsResponse?.data || departmentsResponse || [];
  
  const [search, setSearch] = useState('');

  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [tempPassword, setTempPassword] = useState('');
  
  const [editRoleId, setEditRoleId] = useState('');
  const [editDepartmentId, setEditDepartmentId] = useState('');
  const [editJobTitle, setEditJobTitle] = useState('');
  const [editManagerId, setEditManagerId] = useState('');
  
  const { getToken } = useAuth();
  const { success: showSuccess, error: showError } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (selectedUser) {
      setEditRoleId(selectedUser.roleId || '');
      setEditDepartmentId(selectedUser.departmentId || '');
      setEditJobTitle(selectedUser.jobTitle || '');
      setEditManagerId(selectedUser.managerId || '');
    }
  }, [selectedUser]);

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

  const handleUpdatePosition = () => {
    if (!selectedUser) return;
    
    // Convert empty strings to null or undefined as appropriate if required,
    // but the API usually handles strings for UUIDs or nulls.
    updateUserMutation.mutate({ 
      id: selectedUser.id, 
      data: { 
        roleId: editRoleId || null, 
        departmentId: editDepartmentId || null, 
        jobTitle: editJobTitle || null, 
        managerId: editManagerId || null 
      } 
    });
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
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setSelectedUser(null);
              setTempPassword('');
            }
          }}
        >
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-scaleIn border border-slate-200">
            {/* Header with Back and Close */}
            <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <div className="flex items-center gap-2">
                <button 
                  type="button"
                  onClick={() => { setSelectedUser(null); setTempPassword(''); }} 
                  className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                  title="Back to User List"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
                <h2 className="text-base font-black text-slate-800 ml-1">Manage User Account</h2>
              </div>
              <button 
                type="button"
                onClick={() => { setSelectedUser(null); setTempPassword(''); }} 
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-xl transition cursor-pointer flex items-center gap-1 text-xs font-bold"
                title="Close Window"
              >
                <span className="hidden sm:inline">Close</span>
                <X className="w-5 h-5" />
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

              <div className="space-y-4 pt-4 border-t border-slate-100">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Position & Role</h4>
                
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Role (Permissions)</label>
                  <SearchableSelect
                    options={roles.map((r: any) => ({ value: r.id, label: r.name }))}
                    value={editRoleId}
                    onChange={(val) => setEditRoleId(val)}
                    placeholder="-- Select Role --"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Department</label>
                  <SearchableSelect
                    options={departments.map((d: any) => ({ value: d.id, label: d.name }))}
                    value={editDepartmentId}
                    onChange={(val) => setEditDepartmentId(val)}
                    placeholder="-- Select Department --"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Job Title</label>
                  <input 
                    type="text"
                    value={editJobTitle}
                    onChange={(e) => setEditJobTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-slate-300"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Direct Supervisor</label>
                  <SearchableSelect
                    options={[
                      { value: "", label: "-- No Supervisor --" },
                      ...users
                        .filter((u: any) => u.id !== selectedUser.id)
                        .map((u: any) => ({ value: u.id, label: `${u.firstName} ${u.lastName} (${u.jobTitle || 'Field Staff'})` }))
                    ]}
                    value={editManagerId}
                    onChange={(val) => setEditManagerId(val)}
                    placeholder="-- No Supervisor --"
                  />
                </div>
                
                <button
                  onClick={handleUpdatePosition}
                  disabled={updateUserMutation.isPending}
                  className="w-full py-2 bg-slate-800 text-white text-sm font-bold rounded-lg hover:bg-slate-700 disabled:opacity-50 cursor-pointer"
                >
                  {updateUserMutation.isPending ? 'Saving...' : 'Save Position Details'}
                </button>
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
                    className="px-4 py-2 bg-slate-800 text-white text-sm font-bold rounded-lg hover:bg-slate-700 disabled:opacity-50 cursor-pointer"
                  >
                    {resetPasswordMutation.isPending ? 'Resetting...' : 'Reset'}
                  </button>
                </div>
              </div>

            </div>

            {/* Footer with explicit Back/Cancel button */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <button
                type="button"
                onClick={() => { setSelectedUser(null); setTempPassword(''); }}
                className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-extrabold rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Default View
              </button>
              <button
                type="button"
                onClick={() => { setSelectedUser(null); setTempPassword(''); }}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold rounded-xl text-xs transition cursor-pointer"
              >
                Close Window
              </button>
            </div>
          </div>
        </div>
      )}
</div>
    </div>
  );
}
