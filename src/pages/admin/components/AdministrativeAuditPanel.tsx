import { useState, useEffect } from 'react';
import { History, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { AuditLogger, AuditLogRecord } from '../../../services/AuditLogger';

export default function AdministrativeAuditPanel({ refreshKey }: { refreshKey: number }) {
  const [auditLogs, setAuditLogs] = useState<AuditLogRecord[]>([]);
  const [auditSearch, setAuditSearch] = useState('');
  const [auditModuleFilter, setAuditModuleFilter] = useState<string>('ALL');
  const [auditPage, setAuditPage] = useState(1);
  const auditItemsPerPage = 5;

  useEffect(() => {
    const logs = AuditLogger.getLocalLogs();
    setAuditLogs(logs);
  }, [refreshKey]);

  const getFilteredAudits = () => {
    return auditLogs.filter(l => {
      const matchSearch = l.action.toLowerCase().includes(auditSearch.toLowerCase()) || 
                          l.description.toLowerCase().includes(auditSearch.toLowerCase()) ||
                          l.name?.toLowerCase().includes(auditSearch.toLowerCase());
      const matchModule = auditModuleFilter === 'ALL' || l.module === auditModuleFilter;
      return matchSearch && matchModule;
    });
  };

  const filteredAudits = getFilteredAudits();
  const totalAuditPages = Math.ceil(filteredAudits.length / auditItemsPerPage) || 1;
  const paginatedAudits = filteredAudits.slice((auditPage - 1) * auditItemsPerPage, auditPage * auditItemsPerPage);

  return (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-white shadow-xl mt-8">          
          <div className="flex flex-col md:flex-row items-start md:items-center md:justify-between gap-4 mb-6">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center border border-slate-700">
                <History className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h3 className="font-black tracking-tight text-lg text-white">Administrative Audit Stream</h3>
                <p className="text-xs text-slate-400 font-semibold mt-0.5">Immutable record of governance & approvals</p>
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input 
                  type="text"
                  value={auditSearch}
                  onChange={(e) => { setAuditSearch(e.target.value); setAuditPage(1); }}
                  placeholder="Search logs..."
                  className="bg-slate-950 border border-slate-800 text-[11px] font-bold rounded-xl pl-8 pr-3 py-1.5 text-slate-300 placeholder:text-slate-600 outline-none focus:border-amber-400 w-40"
                />
              </div>
              <select
                value={auditModuleFilter}
                onChange={(e) => { setAuditModuleFilter(e.target.value); setAuditPage(1); }}
                className="bg-slate-950 border border-slate-800 text-[11px] font-bold rounded-xl px-2 py-1.5 text-slate-300 outline-none focus:border-amber-400 cursor-pointer"
              >
                <option value="ALL">All Modules</option>
                <option value="ADMIN">Approvals & Admin</option>
                <option value="SYSTEM">System & Config</option>
                <option value="SECURITY">Security & Access</option>
              </select>
            </div>
          </div>

          <div className="bg-slate-950/80 rounded-xl border border-slate-800 overflow-hidden">
            {paginatedAudits.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs font-semibold">
                No administrative transactions recorded.
              </div>
            ) : (
              <div className="divide-y divide-slate-800/50">
                {paginatedAudits.map(log => (
                  <div key={log.id} className="p-4 hover:bg-slate-900/50 transition flex flex-col md:flex-row gap-4 items-start md:items-center">
                    <div className="flex items-start gap-2.5 min-w-[200px]">
                      <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-black text-xs text-amber-400 uppercase shrink-0">
                        {log.name?.[0] || 'U'}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-200">{log.name || 'Unknown Executive'}</div>
                        <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">{log.role || 'ADMIN'}</div>
                      </div>
                    </div>
                    
                    <div className="flex-1">
                      <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider mb-1 ${
                        log.action.includes('APPROVED') || log.action.includes('SUCCESS')
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : log.action.includes('REJECTED') || log.action.includes('FAILURE')
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}>
                        {log.action}
                      </span>
                      <p className="text-xs text-slate-400 font-medium leading-relaxed">
                        {log.description}
                      </p>
                    </div>

                    <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-1 border-t border-slate-800/40 md:border-t-0 pt-2 md:pt-0 shrink-0 min-w-[150px]">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                      <div className="flex items-center gap-1.5 text-[9px] text-slate-500 font-semibold uppercase mt-0.5">
                        <span className="truncate max-w-[80px]">{log.deviceType || 'Unknown Device'}</span>
                        <span className="w-1 h-1 rounded-full bg-slate-700"></span>
                        <span className="truncate max-w-[60px]">{log.IP || '127.0.0.1'}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {totalAuditPages > 1 && (
              <div className="p-3 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-500 font-bold">
                  Logs Page {auditPage} of {totalAuditPages}
                </span>
                <div className="flex gap-1">
                  <button 
                    disabled={auditPage === 1}
                    onClick={() => setAuditPage(p => p - 1)}
                    className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button 
                    disabled={auditPage === totalAuditPages}
                    onClick={() => setAuditPage(p => p + 1)}
                    className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
  );
}
