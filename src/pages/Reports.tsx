import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { 
  ArrowLeft, FileText, Search, Filter, Clock, MapPin, CheckCircle, AlertCircle, ArrowRight,
  Eye, MessageSquare, History
} from 'lucide-react';
import EvidenceGallery from "../components/features/EvidenceGallery";
import { useReportsQuery, useInvalidateQueries } from "../hooks/useQueries";

export default function Reports() {
  const { getToken, currentUser, profile } = useAuth();
  const navigate = useNavigate();
  const { error } = useToast();
  const { data: reportsResponse, isLoading: loading } = useReportsQuery();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedReport, setSelectedReport] = useState<any | null>(null);
  const [timeline, setTimeline] = useState<{versions: any[], comments: any[]}>({versions: [], comments: []});
  const [newComment, setNewComment] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);

  const loadTimeline = async (reportId: string) => {
    try {
      const token = await getToken();
      const res = await fetch(`/api/v1/reports/${reportId}/timeline`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setTimeline(await res.json());
      }
    } catch(e) {
      error("Failed to load timeline");
    }
  };

  const reports = reportsResponse?.data || reportsResponse || [];
  const invalidateQueries = useInvalidateQueries();
  const handleSelectReport = (report: any) => {
    setSelectedReport(report);
    if (report) {
      loadTimeline(report.id);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !selectedReport) return;
    setSubmittingComment(true);
    try {
      const token = await getToken();
      const res = await fetch(`/api/v1/reports/${selectedReport.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ comment: newComment })
      });
      if (res.ok) {
        setNewComment('');
        await loadTimeline(selectedReport.id);
      } else {
        error('Failed to add comment');
      }
    } catch(e) {
      error('Error adding comment');
    } finally {
      setSubmittingComment(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'APPROVED': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'REJECTED': return 'bg-rose-100 text-rose-700 border-rose-200';
      case 'DRAFT': return 'bg-slate-100 text-slate-700 border-slate-200';
      case 'PENDING_REVIEW': return 'bg-amber-100 text-amber-700 border-amber-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const filteredReports = reports.filter(r => {
    const matchesSearch = r.task?.title?.toLowerCase().includes(searchQuery.toLowerCase()) || r.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <div className="bg-slate-900 text-white p-6 md:px-8 border-b border-slate-800 shrink-0">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <button onClick={() => navigate('/dashboard')} className="text-slate-400 hover:text-white flex items-center gap-1 text-sm font-semibold mb-4 transition-colors">
              <ArrowLeft className="w-4 h-4" /> Return to Dashboard
            </button>
            <h1 className="text-2xl font-black tracking-tight">Enterprise Reports Center</h1>
            <p className="text-slate-400 text-sm mt-1">Review, track, and manage submitted operational field reports.</p>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search reports..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-lg pl-9 pr-4 py-2 focus:ring-2 focus:ring-pink-500 outline-none transition"
              />
            </div>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-white text-sm rounded-lg px-4 py-2 focus:ring-2 focus:ring-pink-500 outline-none transition"
            >
              <option value="ALL">All Statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="PENDING_REVIEW">Pending Review</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-8 grid grid-cols-1 md:grid-cols-12 gap-8 md:h-[calc(100vh-100px)] h-auto min-h-0">
        
        {/* Reports List */}
        <div className={`md:col-span-5 flex flex-col md:h-full h-[600px] bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden ${selectedReport ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
            <h2 className="font-bold text-slate-800 flex items-center gap-2">
              <FileText className="w-4 h-4 text-slate-500" /> Active Reports ({filteredReports.length})
            </h2>
          </div>
          
          <div className="flex-1 overflow-y-auto p-2">
            {loading ? (
              <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-pink-600 border-t-transparent rounded-full animate-spin"></div></div>
            ) : filteredReports.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-sm">No reports match your filters.</div>
            ) : (
              filteredReports.map(report => (
                <div 
                  key={report.id}
                  onClick={() => handleSelectReport(report)}
                  className={`p-4 rounded-xl border mb-2 cursor-pointer transition-all ${selectedReport?.id === report.id ? 'border-pink-500 bg-pink-50' : 'border-slate-100 hover:border-slate-300 bg-white'}`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded uppercase border tracking-wider ${getStatusColor(report.status)}`}>
                      {report.status.replace('_', ' ')}
                    </span>
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(report.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm mb-1">{report.task?.title || 'General Report'}</h3>
                  <div className="text-xs text-slate-500 flex items-center justify-between mt-3">
                    <span>By: {report.submitter?.firstName} {report.submitter?.lastName}</span>
                    {report.evidence && report.evidence.length > 0 && (
                      <span className="flex items-center gap-1 text-slate-400">
                         <MapPin className="w-3 h-3" /> {report.evidence.length} evidence
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Report Detail & Timeline */}
        <div className={`md:col-span-7 flex flex-col md:h-full h-auto bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden ${selectedReport ? 'flex' : 'hidden md:flex'}`}>
          {selectedReport ? (
            <div className="flex flex-col h-full">
              <div className="p-6 border-b border-slate-100">
                <button 
                  onClick={() => handleSelectReport(null)} 
                  className="md:hidden mb-4 flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" /> Back to list
                </button>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-xl font-black text-slate-900">{selectedReport.task?.title || 'General Report'}</h2>
                    <p className="text-sm text-slate-500 mt-1">ID: {selectedReport.id}</p>
                  </div>
                  <span className={`text-xs font-extrabold px-3 py-1 rounded-lg uppercase border tracking-wider ${getStatusColor(selectedReport.status)}`}>
                    {selectedReport.status.replace('_', ' ')}
                  </span>
                </div>
                
                {selectedReport.notes && (
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mb-6 text-sm text-slate-700">
                    <div className="font-bold text-slate-900 mb-2 text-xs uppercase tracking-wider">Field Notes</div>
                    {selectedReport.notes}
                  </div>
                )}
                
                {selectedReport.evidence && selectedReport.evidence.length > 0 && (
                  <div className="mb-6">
                    <div className="font-bold text-slate-900 mb-3 text-xs uppercase tracking-wider">Attached Evidence</div>
                    <EvidenceGallery evidenceList={selectedReport.evidence} />
                  </div>
                )}
              </div>

              {/* Timeline & Comments Thread */}
              <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
                <h3 className="font-bold text-slate-900 text-sm mb-6 flex items-center gap-2">
                  <History className="w-4 h-4 text-slate-400" /> Activity Timeline
                </h3>
                
                <div className="space-y-6">
                  {timeline.versions.map((v: any, i: number) => (
                    <div key={`v-${i}`} className="flex gap-4">
                      <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
                        <History className="w-4 h-4 text-slate-500" />
                      </div>
                      <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm flex-1">
                        <div className="flex justify-between items-center mb-1 text-xs">
                          <span className="font-bold text-slate-800">Version {v.versionNumber} ({v.status})</span>
                          <span className="text-slate-400">{new Date(v.createdAt).toLocaleString()}</span>
                        </div>
                        <div className="text-sm text-slate-600">Updated by {v.updater?.firstName} {v.updater?.lastName}</div>
                      </div>
                    </div>
                  ))}
                  
                  {timeline.comments.map((c: any, i: number) => (
                    <div key={`c-${i}`} className="flex gap-4">
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 font-bold text-xs uppercase">
                        {c.user?.firstName?.[0]}{c.user?.lastName?.[0]}
                      </div>
                      <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm flex-1">
                        <div className="flex justify-between items-center mb-2 text-xs">
                          <span className="font-bold text-slate-800">{c.user?.firstName} {c.user?.lastName}</span>
                          <span className="text-slate-400">{new Date(c.createdAt).toLocaleString()}</span>
                        </div>
                        <div className="text-sm text-slate-700">{c.comment}</div>
                      </div>
                    </div>
                  ))}
                  
                  {timeline.versions.length === 0 && timeline.comments.length === 0 && (
                    <div className="text-center text-slate-400 text-sm py-4">No activity recorded yet.</div>
                  )}
                </div>
              </div>

              {/* Comment Input */}
              <div className="p-4 border-t border-slate-200 bg-white">
                <form onSubmit={handleAddComment} className="flex gap-2">
                  <input
                    type="text"
                    value={newComment}
                    onChange={e => setNewComment(e.target.value)}
                    placeholder="Add a comment or observation..."
                    className="flex-1 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-pink-500 outline-none transition"
                  />
                  <button 
                    type="submit"
                    disabled={!newComment.trim() || submittingComment}
                    className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-2.5 rounded-xl font-bold text-sm transition disabled:opacity-50 flex items-center gap-2"
                  >
                    Post <MessageSquare className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8 text-center">
              <FileText className="w-12 h-12 mb-4 text-slate-200" />
              <h3 className="text-lg font-bold text-slate-800">No Report Selected</h3>
              <p className="text-sm mt-2 max-w-sm">Select a report from the list to view its complete timeline, evidence, and version history.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
