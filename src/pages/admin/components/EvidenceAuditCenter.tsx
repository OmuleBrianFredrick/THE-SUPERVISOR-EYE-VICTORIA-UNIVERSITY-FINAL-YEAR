import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { Search, History, Fingerprint } from 'lucide-react';

export default function EvidenceAuditCenter() {
  const { getToken } = useAuth();
  const [logs, setLogs] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
       const token = await getToken();
       const res = await fetch('/api/v1/governance/audit', {
          headers: { Authorization: `Bearer ${token}` }
       });
       if (res.ok) {
          const result = await res.json();
          setLogs(result.data || []);
       }
    } catch (e) {
       console.error(e);
    }
  };

  const formatDate = (dateStr: any) => {
    if (!dateStr) return 'N/A';
    try {
      const d = new Date(dateStr);
      return isNaN(d.getTime()) ? 'N/A' : d.toLocaleString();
    } catch {
      return 'N/A';
    }
  };

  const filteredLogs = logs.filter(log => {
    const term = searchTerm.toLowerCase();
    if (!term) return true;
    
    const actorName = log.user ? `${log.user.firstName} ${log.user.lastName}`.toLowerCase() : 'system / external';
    const action = (log.action || '').toLowerCase();
    const ip = (log.ipAddress || '').toLowerCase();
    const metaStr = JSON.stringify(log.metadata || {}).toLowerCase();
    
    return actorName.includes(term) || action.includes(term) || ip.includes(term) || metaStr.includes(term);
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto h-[calc(100vh-8rem)] flex flex-col">
       <div className="shrink-0">
         <h2 className="text-2xl font-black text-slate-800">Evidence Audit Center</h2>
         <p className="text-slate-500">Immutable ledger of evidence modifications and integrity validations.</p>
       </div>

       <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col min-h-0 flex-1">
          <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row gap-4">
             <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200 flex-1">
                <Search className="w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Search by evidence ID, user, or event..." 
                  className="bg-transparent text-sm w-full outline-none" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
             </div>
             <button className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-bold transition">EXPORT AUDIT LOG</button>
          </div>
          
          <div className="flex-1 overflow-auto p-0">
             <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-50 sticky top-0 z-10 shadow-sm">
                   <tr>
                     <th className="p-4 font-bold text-slate-500 uppercase tracking-widest text-xs">Timestamp</th>
                     <th className="p-4 font-bold text-slate-500 uppercase tracking-widest text-xs">Actor</th>
                     <th className="p-4 font-bold text-slate-500 uppercase tracking-widest text-xs">Event Type</th>
                     <th className="p-4 font-bold text-slate-500 uppercase tracking-widest text-xs">Resource Signature</th>
                     <th className="p-4 font-bold text-slate-500 uppercase tracking-widest text-xs">Action Details</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                   {filteredLogs.map((log, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 transition">
                         <td className="p-4 text-slate-600 font-mono text-xs">{formatDate(log.timestamp)}</td>
                         <td className="p-4 font-medium text-slate-800">
                           {log.user ? `${log.user.firstName} ${log.user.lastName}` : <span className="text-slate-400 italic">System / External</span>}
                         </td>
                         <td className="p-4">
                            <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider">
                              {log.action}
                            </span>
                         </td>
                         <td className="p-4 text-slate-500 font-mono text-[10px]">
                            <div className="flex items-center gap-1"><Fingerprint className="w-3 h-3"/> {log.ipAddress || '0.0.0.0'}</div>
                         </td>
                         <td className="p-4 text-slate-600 text-xs truncate max-w-xs" title={JSON.stringify(log.metadata || {})}>
                           {JSON.stringify(log.metadata || {})}
                         </td>
                      </tr>
                   ))}
                   {filteredLogs.length === 0 && (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-slate-400">
                          <History className="w-8 h-8 mx-auto mb-2 opacity-50" />
                           No audit records found.
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
