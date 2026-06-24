import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router';
import { Loader2, CheckCircle, XCircle, ArrowLeft } from 'lucide-react';

export default function ApprovalQueue({ inline = false }: { inline?: boolean }) {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { getToken, profile, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchPendingUsers();
  }, []);

  const fetchPendingUsers = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      if (!token) return;
      const res = await fetch('/api/v1/admin/users/pending', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch users');
      const data = await res.json();
      setUsers(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id: string, action: 'APPROVE' | 'REJECT') => {
    try {
      const token = await getToken();
      if (!token) return;
      
      const res = await fetch(`/api/v1/admin/users/${id}/approve`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ action })
      });

      if (!res.ok) throw new Error(`Failed to ${action.toLowerCase()} user`);
      
      // Update list
      setUsers(users.filter(u => u.id !== id));
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (loading) return <div className="p-8 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-slate-500" /></div>;

  const isExecutive = profile?.role === 'Executive' || profile?.role === 'MD / Ops Director' || profile?.role === 'Platform Admin' || profile?.role === 'SUPER_ADMIN' || profile?.role === 'Administrator' || profile?.role === 'SYSTEM_ADMIN';

  const mainContent = (
    <div className={inline ? "max-w-6xl mx-auto" : "p-8 max-w-6xl mx-auto font-sans"}>
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 mb-1">Admin Approval Queue</h1>
          <p className="text-slate-500 text-sm">Review and approve new user registrations.</p>
        </div>
        {!inline && (
          <button
            onClick={() => navigate('/dashboard')}
            className="self-start inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </button>
        )}
      </div>

      {error && <div className="p-4 bg-red-50 text-red-600 rounded-lg mb-6">{error}</div>}

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        {users.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            No pending users requiring approval.
          </div>
        ) : (
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-700 font-medium border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Contact</th>
                <th className="px-6 py-4">Department / Org</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-900">{user.firstName} {user.lastName}</div>
                    {user.employeeNumber && <div className="text-xs text-slate-500 mt-1">ID: {user.employeeNumber}</div>}
                  </td>
                  <td className="px-6 py-4">
                    <div>{user.email}</div>
                    <div className="text-slate-500">{user.phone}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-800">{user.department || 'Not specified'}</div>
                    <div className="text-xs text-slate-500 mt-1">Movit Group</div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => handleAction(user.id, 'APPROVE')}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-50 text-emerald-700 font-medium rounded-lg hover:bg-emerald-100 transition-colors"
                      >
                        <CheckCircle className="w-4 h-4" /> Approve
                      </button>
                      <button 
                        onClick={() => handleAction(user.id, 'REJECT')}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-700 font-medium rounded-lg hover:bg-red-100 transition-colors"
                      >
                        <XCircle className="w-4 h-4" /> Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );

  if (!inline) {
    return (
      <div className="h-screen w-full bg-slate-50 text-slate-900 flex flex-col font-sans overflow-hidden">
        {/* Top Navigation Bar */}
        <header className="h-16 border-b border-slate-200 bg-white flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/dashboard')}>
              <span className="font-black text-xl italic tracking-tighter">MOVIT</span>
              <span className="font-bold text-slate-400">Supervisor Eye</span>
            </div>
            
            {/* Admin Navigation Pills */}
            <div className="hidden md:flex items-center gap-2 border-l border-slate-200 pl-6">
              {isExecutive && (
                <button 
                  onClick={() => navigate('/eacc')}
                  className="bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs px-3.5 py-1.5 rounded-full transition flex items-center gap-1.5 shadow-sm"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                  EACC COMMAND CENTER
                </button>
              )}
              <button 
                onClick={() => navigate('/admin/approvals')}
                className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-3.5 py-1.5 rounded-full transition flex items-center gap-1.5"
              >
                APPROVAL QUEUE
              </button>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-bold text-slate-800">{profile?.firstName || 'User'} {profile?.lastName || ''}</p>
                <p className="text-[10px] text-slate-500 uppercase font-semibold">{profile?.jobTitle || profile?.role || 'Staff'}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-slate-900 text-white border-2 border-slate-200 shadow-sm flex items-center justify-center font-black text-sm uppercase">
                {profile?.firstName?.[0] || 'U'}{profile?.lastName?.[0] || ''}
              </div>
            </div>
            <button onClick={logout} className="ml-4 text-xs font-bold text-slate-400 hover:text-slate-800 transition uppercase tracking-wider">LOGOUT</button>
          </div>
        </header>

        <main className="flex-1 min-h-0 overflow-auto">
          {mainContent}
        </main>
      </div>
    );
  }

  return mainContent;
}
