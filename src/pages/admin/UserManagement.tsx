import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Loader2, Search, Edit2, ShieldAlert } from 'lucide-react';

export default function UserManagement() {
  const { getToken } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      if (!token) return;
      const res = await fetch('/api/v1/admin/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setUsers(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
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
                      <button className="p-2 hover:bg-slate-200 rounded-lg text-slate-500 transition-colors tooltip" title="Edit User">
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
      </div>
    </div>
  );
}
