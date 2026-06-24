import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { AlertCircle, Clock, ShieldAlert, ArrowUpRight, CheckCircle } from 'lucide-react';

export default function EscalationDashboard() {
  const { getToken } = useAuth();
  const [escalations, setEscalations] = useState<any[]>([]);

  useEffect(() => {
    fetchEscalations();
  }, []);

  const fetchEscalations = async () => {
    try {
      const token = await getToken();
      const res = await fetch('/api/v1/approvals/escalations', {
         headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
         setEscalations(await res.json());
      }
    } catch(e) { console.error(e); }
  };

  const resolve = async (id: string) => {
    try {
      const token = await getToken();
      await fetch(`/api/v1/approvals/escalations/${id}/resolve`, {
         method: 'PATCH',
         headers: { Authorization: `Bearer ${token}` }
      });
      fetchEscalations();
    } catch(e) {}
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto h-[calc(100vh-8rem)] flex flex-col">
       <div className="shrink-0">
         <h2 className="text-2xl font-black text-slate-800">Executive Escalation Engine</h2>
         <p className="text-slate-500">Oversight for SLA breaches and operational bottlenecks.</p>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-3 gap-4 shrink-0">
          <div className="bg-rose-50 p-4 rounded-xl border border-rose-100 flex items-center gap-4">
             <div className="p-3 bg-rose-100 text-rose-600 rounded-lg"><AlertCircle className="w-6 h-6" /></div>
             <div>
               <div className="text-2xl font-black text-rose-700">{escalations.filter(e => e.status === 'ACTIVE').length}</div>
               <div className="text-xs font-bold text-rose-600 uppercase tracking-wide">Active Escalations</div>
             </div>
          </div>
          <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 flex items-center gap-4">
             <div className="p-3 bg-emerald-100 text-emerald-600 rounded-lg"><CheckCircle className="w-6 h-6" /></div>
             <div>
               <div className="text-2xl font-black text-emerald-700">{escalations.filter(e => e.status === 'RESOLVED').length}</div>
               <div className="text-xs font-bold text-emerald-600 uppercase tracking-wide">Resolved </div>
             </div>
          </div>
          <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex items-center gap-4">
             <div className="p-3 bg-slate-700 text-slate-300 rounded-lg"><Clock className="w-6 h-6" /></div>
             <div>
               <div className="text-2xl font-black text-white">4.2 Hrs</div>
               <div className="text-xs font-bold text-slate-400 uppercase tracking-wide">Avg Resolution Time</div>
             </div>
          </div>
       </div>

       <div className="flex-1 min-h-0 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-100 bg-slate-50">
             <h3 className="font-bold text-slate-800">Escalation Queue</h3>
          </div>
          <div className="flex-1 overflow-y-auto p-0">
             <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-50 sticky top-0 z-10 shadow-sm border-b border-slate-200">
                   <tr>
                     <th className="p-4 font-bold text-slate-500 uppercase tracking-widest text-xs">Date</th>
                     <th className="p-4 font-bold text-slate-500 uppercase tracking-widest text-xs">Task / Report</th>
                     <th className="p-4 font-bold text-slate-500 uppercase tracking-widest text-xs">Reason</th>
                     <th className="p-4 font-bold text-slate-500 uppercase tracking-widest text-xs">Status</th>
                     <th className="p-4 font-bold text-slate-500 uppercase tracking-widest text-xs text-right">Actions</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                   {escalations.map((esc, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 transition">
                         <td className="p-4 text-slate-600 font-mono text-xs">{new Date(esc.createdAt).toLocaleString()}</td>
                         <td className="p-4 font-medium text-slate-800 truncate max-w-[200px]">{esc.report?.task?.title || 'System Report'}</td>
                         <td className="p-4 text-slate-600">
                            <span className="flex items-center gap-1.5"><ShieldAlert className="w-3.5 h-3.5 text-rose-500" /> {esc.reason}</span>
                         </td>
                         <td className="p-4">
                            <span className={`px-2.5 py-1 rounded-sm text-[10px] font-bold uppercase ${esc.status === 'ACTIVE' ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
                               {esc.status}
                            </span>
                         </td>
                         <td className="p-4 text-right">
                            {esc.status === 'ACTIVE' && (
                               <button onClick={() => resolve(esc.id)} className="bg-slate-900 text-white px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 ml-auto hover:bg-slate-800">
                                  <CheckCircle className="w-3.5 h-3.5" /> MARK RESOLVED
                               </button>
                            )}
                            {esc.status === 'RESOLVED' && (
                               <span className="text-slate-400 font-bold text-xs">RESOLVED {new Date(esc.resolvedAt).toLocaleDateString()}</span>
                            )}
                         </td>
                      </tr>
                   ))}
                   {escalations.length === 0 && (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-slate-400">
                           <ShieldAlert className="w-8 h-8 mx-auto mb-2 opacity-30" />
                           No escalations found.
                        </td>
                      </tr>
                   )}
                </tbody>
             </table>
          </div>
       </div>
    </div>
  );
}
