import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useToast } from '../../../contexts/ToastContext';
import { CheckCircle, XCircle, Clock, Search, FileText, ChevronRight, Eye, ShieldCheck, MapPin } from "lucide-react";
import { useApprovalsQuery, useInvalidateQueries } from "../../../hooks/useQueries";

export default function ReportApprovalsDashboard() {
  const { getToken } = useAuth();
  const { error, success } = useToast();
  const { data: approvalsResponse, isLoading: loading } = useApprovalsQuery();
  const approvals = approvalsResponse || [];
  const invalidateQueries = useInvalidateQueries();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedApproval, setSelectedApproval] = useState<any>(null);
  const [actionComments, setActionComments] = useState('');


  const handleDecision = async (id: string, decision: 'APPROVED' | 'REJECTED') => {
    try {
      const token = await getToken();
      const res = await fetch(`/api/v1/approvals/${id}/decision`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ decision, comments: actionComments })
      });
      
      if (res.ok) {
        success(`Report ${decision.toLowerCase()} successfully`);
        setSelectedApproval(null);
        setActionComments('');
        invalidateQueries([["approvals"]]);
      } else {
        error('Failed to submit decision');
      }
    } catch (e) {
      error('An error occurred during submission');
    }
  };

  const filteredApprovals = approvals.filter(a => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return a.report?.task?.title?.toLowerCase().includes(q) ||
           a.report?.submitter?.firstName?.toLowerCase().includes(q) ||
           a.report?.submitter?.lastName?.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto h-[calc(100vh-8rem)] flex flex-col">
      <div className="shrink-0 flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-black text-slate-800">Workflow & Approval Engine</h2>
          <p className="text-slate-500">Review pending reports and tasks assigned to your queue.</p>
        </div>
        <div className="flex gap-4">
          <div className="bg-amber-50 border border-amber-200 text-amber-700 px-4 py-2 rounded-xl flex items-center gap-3">
            <Clock className="w-5 h-5 text-amber-500" />
            <div>
              <div className="text-xl font-black">{approvals.length}</div>
              <div className="text-[10px] uppercase font-bold tracking-widest">Pending Reviews</div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex gap-6 min-h-0">
        <div className="w-1/3 flex flex-col bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50 shrink-0">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search queues..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 transition"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center text-slate-400 text-sm font-semibold animate-pulse">Loading queues...</div>
            ) : filteredApprovals.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-sm font-semibold">No pending approvals found.</div>
            ) : (
              <div className="divide-y divide-slate-100">
                {filteredApprovals.map(approval => (
                  <button
                    key={approval.id}
                    onClick={() => setSelectedApproval(approval)}
                    className={`w-full text-left p-4 hover:bg-slate-50 transition ${selectedApproval?.id === approval.id ? 'bg-slate-50 border-l-4 border-slate-900' : 'border-l-4 border-transparent'}`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-bold text-slate-800 line-clamp-1">{approval.report?.task?.title || 'General Report'}</span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-sm uppercase bg-amber-100 text-amber-700 whitespace-nowrap ml-2">PENDING</span>
                    </div>
                    <div className="text-xs text-slate-500 mb-2">
                      Submitted by: <span className="font-semibold text-slate-700">{approval.report?.submitter?.firstName} {approval.report?.submitter?.lastName}</span>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                        <Clock className="w-3 h-3" />
                        {new Date(approval.assignedAt).toLocaleDateString()}
                      </div>
                      {approval.deadline && (
                        <div className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${new Date(approval.deadline).getTime() < Date.now() ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600'}`}>
                          {new Date(approval.deadline).getTime() < Date.now() 
                            ? 'SLA Breached' 
                            : `${Math.max(0, Math.round((new Date(approval.deadline).getTime() - Date.now()) / 3600000))}h left`}
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
          {selectedApproval ? (
            <>
              <div className="p-6 border-b border-slate-100 shrink-0">
                <div className="flex items-center gap-2 text-sm font-bold text-slate-500 mb-2 uppercase tracking-widest">
                  <FileText className="w-4 h-4" /> Report Review
                </div>
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-black text-slate-900 mb-1">{selectedApproval.report?.task?.title || 'General Report'}</h3>
                  {selectedApproval.deadline && (
                    <div className={`text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full border ${new Date(selectedApproval.deadline).getTime() < Date.now() ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                      {new Date(selectedApproval.deadline).getTime() < Date.now() 
                        ? 'SLA BREACHED' 
                        : `SLA Deadline: ${new Date(selectedApproval.deadline).toLocaleString()}`}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-4 text-sm text-slate-500 mt-4">
                  <div className="flex items-center gap-1.5">
                    <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center font-bold text-[10px] text-slate-600">
                      {selectedApproval.report?.submitter?.firstName?.[0]}
                    </div>
                    <span className="font-semibold text-slate-700">{selectedApproval.report?.submitter?.firstName} {selectedApproval.report?.submitter?.lastName}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4" />
                    <span>Submitted: {new Date(selectedApproval.report?.submittedAt).toLocaleString()}</span>
                  </div>
                  {selectedApproval.report?.isGpsVerified && (
                     <div className="flex items-center gap-1 text-emerald-600 font-bold text-xs bg-emerald-50 px-2 py-1 rounded-md">
                        <MapPin className="w-3.5 h-3.5" /> GPS Verified
                     </div>
                  )}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50">
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                  <h4 className="font-bold text-slate-800 text-sm mb-3 uppercase tracking-wider">Report Notes</h4>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    {selectedApproval.report?.notes || <span className="italic text-slate-400">No notes provided by the submitter.</span>}
                  </p>
                </div>

                {selectedApproval.report?.evidence && selectedApproval.report.evidence.length > 0 && (
                  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                    <h4 className="font-bold text-slate-800 text-sm mb-3 uppercase tracking-wider flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-500" /> Attached Evidence ({selectedApproval.report.evidence.length})
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {selectedApproval.report.evidence.map((ev: any) => (
                        <div key={ev.id} className="relative group rounded-lg overflow-hidden border border-slate-200 bg-slate-100 aspect-video flex items-center justify-center">
                          {ev.mediaType === 'PHOTO' ? (
                            <img src={ev.mediaUrl} alt="Evidence" className="w-full h-full object-cover" />
                          ) : (
                            <div className="text-xs font-bold text-slate-500">{ev.mediaType}</div>
                          )}
                          <a href={ev.mediaUrl} target="_blank" rel="noreferrer" className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white font-bold text-xs gap-1.5">
                            <Eye className="w-4 h-4" /> VIEW
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="p-6 border-t border-slate-100 shrink-0 bg-white">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Reviewer Comments</label>
                <textarea
                  value={actionComments}
                  onChange={e => setActionComments(e.target.value)}
                  placeholder="Optional comments regarding approval or rejection..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 transition mb-4 resize-none h-20"
                />
                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => handleDecision(selectedApproval.id, 'REJECTED')}
                    className="px-6 py-2.5 bg-rose-50 text-rose-700 hover:bg-rose-100 font-black text-sm rounded-xl transition flex items-center gap-2"
                  >
                    <XCircle className="w-5 h-5" /> REJECT
                  </button>
                  <button
                    onClick={() => handleDecision(selectedApproval.id, 'APPROVED')}
                    className="px-6 py-2.5 bg-slate-900 text-white hover:bg-slate-800 font-black text-sm rounded-xl transition flex items-center gap-2 shadow-sm"
                  >
                    <CheckCircle className="w-5 h-5 text-emerald-400" /> APPROVE REPORT
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
              <CheckCircle className="w-16 h-16 mb-4 opacity-20" />
              <h3 className="text-xl font-bold text-slate-800 mb-1">No Selection</h3>
              <p className="text-sm">Select a pending approval from the queue to review.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
