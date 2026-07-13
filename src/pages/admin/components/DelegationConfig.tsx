import React, { useState, useEffect } from 'react';
import { Users, Plus, ArrowRight, ShieldCheck, Loader2, X, Calendar, FileText } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { useToast } from '../../../contexts/ToastContext';

export default function DelegationConfig() {
  const { getToken, profile } = useAuth();
  const { error, success } = useToast();
  const [delegations, setDelegations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [delegatorId, setDelegatorId] = useState('');
  const [delegateeId, setDelegateeId] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date(Date.now() + 7 * 24 * 3600000).toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  const isAdmin = ['SUPER_ADMIN', 'SYSTEM_ADMIN', 'Administrator', 'Platform Admin', 'Executive', 'MD / Ops Director'].includes(profile?.role || '');

  useEffect(() => {
    fetchDelegations();
    fetchUsers();
  }, []);

  const fetchDelegations = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      const res = await fetch('/api/v1/approvals/delegations', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setDelegations(await res.json());
      } else {
        error('Failed to load delegations');
      }
    } catch (e) {
      error('An error occurred loading delegations');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const token = await getToken();
      const res = await fetch('/api/v1/admin/users?limit=100', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : (data.items || data.data || []);
        setUsersList(list.filter((u: any) => u.status === 'ACTIVE'));
      }
    } catch (e) {
      console.error('Error loading users:', e);
    }
  };

  const handleCreateDelegation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!delegateeId) {
      error('Please select an Acting Officer (Delegatee)');
      return;
    }

    try {
      setSubmitting(true);
      const token = await getToken();
      
      const payload: any = {
        delegateeId,
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
        notes
      };

      if (isAdmin && delegatorId) {
        payload.delegatorId = delegatorId;
      }

      const res = await fetch('/api/v1/approvals/delegations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        success('Approval authority successfully delegated!');
        setShowModal(false);
        // Reset form
        setDelegateeId('');
        setDelegatorId('');
        setNotes('');
        fetchDelegations();
      } else {
        const errData = await res.json().catch(() => ({}));
        error(errData.error || 'Failed to create delegation');
      }
    } catch (e) {
      error('An error occurred during delegation creation');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto h-[calc(100vh-8rem)] flex flex-col">
       <div className="shrink-0 flex justify-between items-center">
         <div>
           <h2 className="text-2xl font-black text-slate-800">Delegations & Acting Officers</h2>
           <p className="text-slate-500">Temporarily reassign your approval authority to another staff member.</p>
         </div>
         <button onClick={() => setShowModal(true)} className="bg-slate-900 text-white px-5 py-2.5 rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-slate-800 transition cursor-pointer">
            <Plus className="w-4 h-4" /> CREATE DELEGATION
         </button>
       </div>

       <div className="flex-1 overflow-y-auto space-y-4">
          {loading ? (
             <div className="flex items-center justify-center p-12 text-slate-400">
                <Loader2 className="w-8 h-8 animate-spin" />
             </div>
          ) : delegations.length === 0 ? (
             <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl p-12 text-center">
                <div className="mx-auto w-12 h-12 bg-white rounded-xl shadow-sm border border-slate-200 flex items-center justify-center text-slate-400 mb-4">
                   <Users className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-800">No Active Delegations</h3>
                <p className="text-slate-500 max-w-md mx-auto mt-2 mb-6">You have not delegated your approval authority. You will continue to receive all report reviews.</p>
                <button onClick={() => setShowModal(true)} className="mx-auto bg-white border border-slate-200 text-slate-900 px-5 py-2.5 rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-slate-55 shadow-sm transition cursor-pointer">
                   <Plus className="w-4 h-4" /> REASSIGN AUTHORITY
                </button>
             </div>
          ) : (
             delegations.map((del) => (
                <div key={del.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm p-6 flex justify-between items-center">
                   <div className="flex items-center gap-6">
                      <div className="flex flex-col items-center">
                         <div className="w-12 h-12 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center font-black text-lg shadow-sm border border-indigo-200">
                            {del.delegator?.firstName?.[0] || 'O'}
                         </div>
                         <span className="text-xs font-bold mt-2 text-slate-600">{del.delegator?.firstName} {del.delegator?.lastName}</span>
                         <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Original</span>
                      </div>
                      
                      <div className="flex flex-col items-center px-4">
                         <div className="text-[10px] uppercase font-bold tracking-widest text-slate-400 mb-1">Delegated To</div>
                         <ArrowRight className="w-5 h-5 text-indigo-300" />
                      </div>
                      
                      <div className="flex flex-col items-center">
                         <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center font-black text-lg shadow-sm border border-emerald-200">
                            {del.delegatee?.firstName?.[0] || 'A'}
                         </div>
                         <span className="text-xs font-bold mt-2 text-slate-600">{del.delegatee?.firstName} {del.delegatee?.lastName}</span>
                         <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Acting</span>
                      </div>
                   </div>
                   
                   <div className="flex flex-col items-end">
                      <div className="flex items-center gap-2 mb-2">
                         <ShieldCheck className="w-4 h-4 text-emerald-500" />
                         <span className="font-bold text-slate-800 text-sm">Authority Transfer Active</span>
                      </div>
                      <div className="text-xs text-slate-500">
                         {new Date(del.startDate).toLocaleDateString()} - {new Date(del.endDate).toLocaleDateString()}
                      </div>
                      {del.notes && (
                         <div className="text-xs italic text-slate-400 mt-1 max-w-xs text-right">
                           "{del.notes}"
                         </div>
                      )}
                      {!del.isActive && (
                         <div className="mt-2 text-[10px] font-bold px-2 py-1 bg-slate-100 text-slate-500 rounded uppercase tracking-wider">Expired</div>
                      )}
                   </div>
                </div>
             ))
          )}
       </div>

       {/* CREATE DELEGATION MODAL */}
       {showModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-[100] p-4">
             <div className="bg-white rounded-2xl shadow-xl border border-slate-100 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                <div className="bg-slate-50 border-b border-slate-100 p-5 flex items-center justify-between">
                   <div className="flex items-center gap-3">
                      <Users className="w-5 h-5 text-slate-700" />
                      <h3 className="font-black text-slate-800">Delegate Authority</h3>
                   </div>
                   <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-100 rounded-lg transition cursor-pointer">
                      <X className="w-5 h-5" />
                   </button>
                </div>

                <form onSubmit={handleCreateDelegation} className="p-6 space-y-4">
                   {isAdmin && (
                      <div>
                         <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Original Officer (Delegator)</label>
                         <select
                            value={delegatorId}
                            onChange={(e) => setDelegatorId(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 transition"
                         >
                            <option value="">Myself ({profile?.firstName} {profile?.lastName})</option>
                            {usersList.map((u) => (
                               <option key={u.id} value={u.id}>{u.firstName} {u.lastName} ({u.jobTitle || 'Staff'})</option>
                            ))}
                         </select>
                      </div>
                   )}

                   <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Acting Officer (Delegatee) *</label>
                      <select
                         required
                         value={delegateeId}
                         onChange={(e) => setDelegateeId(e.target.value)}
                         className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 transition"
                      >
                         <option value="">Select Staff Member...</option>
                         {usersList
                            .filter((u) => u.id !== profile?.id && u.id !== delegatorId)
                            .map((u) => (
                               <option key={u.id} value={u.id}>{u.firstName} {u.lastName} ({u.jobTitle || 'Staff'})</option>
                            ))
                         }
                      </select>
                   </div>

                   <div className="grid grid-cols-2 gap-4">
                      <div>
                         <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Start Date</label>
                         <div className="relative">
                            <input
                               type="date"
                               required
                               value={startDate}
                               onChange={(e) => setStartDate(e.target.value)}
                               className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 pl-10 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 transition"
                            />
                            <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                         </div>
                      </div>
                      <div>
                         <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">End Date</label>
                         <div className="relative">
                            <input
                               type="date"
                               required
                               value={endDate}
                               onChange={(e) => setEndDate(e.target.value)}
                               className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 pl-10 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 transition"
                            />
                            <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                         </div>
                      </div>
                   </div>

                   <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Delegation Notes</label>
                      <div className="relative">
                         <textarea
                            placeholder="Reason for delegation, e.g. Annual Leave, Conference Travel..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 pl-10 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 transition min-h-[80px]"
                         />
                         <FileText className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                      </div>
                   </div>

                   <div className="pt-2 flex gap-3">
                      <button
                         type="button"
                         onClick={() => setShowModal(false)}
                         className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-xl text-sm transition cursor-pointer text-center"
                      >
                         CANCEL
                      </button>
                      <button
                         type="submit"
                         disabled={submitting}
                         className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-xl text-sm transition flex items-center justify-center gap-2 cursor-pointer"
                      >
                         {submitting ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                         ) : 'DELEGATE AUTHORITY'}
                      </button>
                   </div>
                </form>
             </div>
          </div>
       )}
    </div>
  );
}
