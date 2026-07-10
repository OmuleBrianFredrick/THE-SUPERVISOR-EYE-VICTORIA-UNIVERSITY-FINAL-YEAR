import React, { useState, useEffect } from 'react';
import { Users, Plus, ArrowRight, ShieldCheck, Loader2 } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { useToast } from '../../../contexts/ToastContext';

export default function DelegationConfig() {
  const { getToken } = useAuth();
  const { error, success } = useToast();
  const [delegations, setDelegations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDelegations();
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

  return (
    <div className="space-y-6 max-w-6xl mx-auto h-[calc(100vh-8rem)] flex flex-col">
       <div className="shrink-0 flex justify-between items-center">
         <div>
           <h2 className="text-2xl font-black text-slate-800">Delegations & Acting Officers</h2>
           <p className="text-slate-500">Temporarily reassign your approval authority to another staff member.</p>
         </div>
         <button className="bg-slate-900 text-white px-5 py-2.5 rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-slate-800">
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
                <button className="mx-auto bg-white border border-slate-200 text-slate-900 px-5 py-2.5 rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-slate-50 shadow-sm transition">
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
                      {!del.isActive && (
                         <div className="mt-2 text-[10px] font-bold px-2 py-1 bg-slate-100 text-slate-500 rounded uppercase tracking-wider">Expired</div>
                      )}
                   </div>
                </div>
             ))
          )}
       </div>
    </div>
  );
}
