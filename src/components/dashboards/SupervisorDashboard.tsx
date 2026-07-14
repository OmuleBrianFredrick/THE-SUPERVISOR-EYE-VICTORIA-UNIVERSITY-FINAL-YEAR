import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { 
  Users, FileCheck, Map, Activity, RefreshCw, ChevronLeft, Download,
  GitMerge, CheckCircle, Clock, Eye, MessageSquare, Search, Filter, 
  Send, History, AlertCircle, FileText, Trash2, Archive, CheckSquare
} from 'lucide-react';
import EvidenceGallery from '../features/EvidenceGallery';
import { generateReportPDF } from '../../lib/pdfGenerator';
import { useTasksQuery, useReportsQuery, useSubordinatesQuery, useInvalidateQueries } from '../../hooks/useQueries';

export default function SupervisorDashboard() {
  const { getToken, profile } = useAuth();
  const { success: showSuccessToast, error: showErrorToast } = useToast();
  const invalidateQueries = useInvalidateQueries();
  
  const { data: tasksResponse, isLoading: loadingTasks } = useTasksQuery();
  const { data: reportsResponse, isLoading: loadingReports } = useReportsQuery();
  const { data: subordinatesData, isLoading: loadingSubordinates } = useSubordinatesQuery();

  const tasks = tasksResponse?.data || tasksResponse || [];
  const reports = reportsResponse?.data || reportsResponse || [];
  const subordinates = subordinatesData || [];
  const loading = loadingTasks || loadingReports;

  const [selectedReport, setSelectedReport] = useState<any | null>(null);
  
  const [activeTab, setActiveTab] = useState<'approvals' | 'pipelines'>('approvals');
  
  // Pipeline filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  
  // Task detail panel state
  const [selectedDetailTask, setSelectedDetailTask] = useState<any | null>(null);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assignForm, setAssignForm] = useState({
    title: '',
    description: '',
    taskType: 'STOCK_AUDIT',
    category: 'Stock Count',
    priority: 'MEDIUM',
    assignedTo: '',
    dueDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
  });

  useEffect(() => {
    if (subordinates.length > 0 && !assignForm.assignedTo) {
      setAssignForm(prev => ({ ...prev, assignedTo: subordinates[0].id }));
    }
  }, [subordinates]);

  const handleAssignTask = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = await getToken();
      const res = await fetch('/api/v1/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          ...assignForm,
          extendedStatus: 'Assigned' // initial status
        })
      });
      if (res.ok) {
        showSuccessToast('Task assigned successfully!');
        setIsAssignModalOpen(false);
        setAssignForm({
          title: '',
          description: '',
          taskType: 'STOCK_AUDIT',
          category: 'Stock Count',
          priority: 'MEDIUM',
          assignedTo: subordinates[0]?.id || '',
          dueDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
        });
        invalidateQueries([["tasks"], ["reports"]]);
      } else {
        const err = await res.json();
        showErrorToast(err.error || 'Failed to create task');
      }
    } catch (err) {
      console.error(err);
      showErrorToast('Error assigning task');
    }
  };

  const handleTransitionTask = async (taskId: string, targetStatus: string, commentText?: string, noteText?: string) => {
    try {
      const token = await getToken();
      const res = await fetch(`/api/v1/tasks/${taskId}/status`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ 
          extendedStatus: targetStatus,
          comment: commentText,
          timelineNote: noteText || `Supervisor updated status to ${targetStatus}`
        })
      });

      if (res.ok) {
        showSuccessToast(`Task status updated to ${targetStatus}`);
        const updatedTask = await res.json();
        invalidateQueries([["tasks"]]);
        if (selectedDetailTask && selectedDetailTask.id === taskId) {
          setSelectedDetailTask(updatedTask);
        }
        invalidateQueries([["tasks"], ["reports"]]);
      } else {
        const err = await res.json();
        showErrorToast(err.error || 'Failed to update status');
      }
    } catch (err) {
      console.error(err);
      showErrorToast('Error connecting to task status endpoint');
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDetailTask || !newComment.trim()) return;
    setSubmittingComment(true);
    try {
      const token = await getToken();
      const res = await fetch(`/api/v1/tasks/${selectedDetailTask.id}/status`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ comment: newComment })
      });
      if (res.ok) {
        const updated = await res.json();
        setSelectedDetailTask(updated);
        invalidateQueries([["tasks"]]);
        setNewComment('');
        showSuccessToast('Comment added successfully!');
      } else {
        showErrorToast('Failed to post comment.');
      }
    } catch (err) {
      console.error(err);
      showErrorToast('Error posting comment.');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleApproveReport = async (reportId: string, decision: 'APPROVED' | 'REJECTED', comments?: string) => {
     try {
       const token = await getToken();
       
       // Update report status
       const res = await fetch(`/api/v1/reports/${reportId}/status`, {
         method: 'PATCH',
         headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
         body: JSON.stringify({ 
           status: decision,
           performanceScore: decision === 'APPROVED' ? 95 : undefined
         })
       });

       if (res.ok) {
         const updatedReport = await res.json();
         
         // Synchronize the task lifecycle status
         if (updatedReport.taskId) {
           const targetTaskStatus = decision === 'APPROVED' ? 'Approved' : 'Revision Requested';
           await handleTransitionTask(
             updatedReport.taskId, 
             targetTaskStatus, 
             comments, 
             decision === 'APPROVED' ? 'Supervisor approved submitted work' : `Supervisor requested revisions: ${comments}`
           );
         }

         showSuccessToast(`Report has been ${decision.toLowerCase()}!`);
         invalidateQueries([["tasks"], ["reports"]]);
         setSelectedReport(null);
       } else {
         showErrorToast('Failed to process review decision.');
       }
     } catch (e) {
       console.error(e);
       showErrorToast('Error processing review decision.');
     }
  };

  const pendingApprovals = reports.filter(r => r.status === 'DRAFT' || r.status === 'SUBMITTED' || r.status === 'PENDING_REVIEW');
  
  // Pipeline filter logic
  const filteredTasks = tasks.filter(t => {
    const matchesSearch = searchQuery ? (
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.assignee?.firstName + ' ' + t.assignee?.lastName).toLowerCase().includes(searchQuery.toLowerCase())
    ) : true;
    
    const matchesStatus = statusFilter === 'ALL' ? true : t.extendedStatus === statusFilter;
    const matchesPriority = priorityFilter === 'ALL' ? true : t.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case 'Draft':
        return 'bg-slate-100 text-slate-700 border-slate-200';
      case 'Assigned':
        return 'bg-blue-50 text-blue-700 border-blue-100';
      case 'Accepted':
        return 'bg-indigo-50 text-indigo-700 border-indigo-100';
      case 'In Progress':
        return 'bg-amber-50 text-amber-700 border-amber-100';
      case 'Awaiting Review':
        return 'bg-purple-50 text-purple-700 border-purple-100 animate-pulse';
      case 'Revision Requested':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'Approved':
        return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'Completed':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Archived':
        return 'bg-slate-200 text-slate-700 border-slate-300';
      default:
        return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  if (loading) return <div className="p-8 flex justify-center text-slate-400"><RefreshCw className="w-8 h-8 animate-spin" /></div>;

  if (selectedReport) {
    return (
      <div className="flex flex-col md:h-full h-auto bg-slate-50 border border-slate-200 rounded-2xl md:overflow-hidden overflow-visible animate-fadeIn">
        {/* Workspace Header */}
        <div className="bg-white p-4 border-b border-slate-200 flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 shrink-0">
          <div className="flex items-center gap-4">
             <button onClick={() => setSelectedReport(null)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 cursor-pointer">
               <ChevronLeft className="w-5 h-5" />
             </button>
             <div>
                <h2 className="font-bold text-lg text-slate-800">Review Submission: {selectedReport.task?.title || selectedReport.reportType}</h2>
                <p className="text-xs text-slate-500">Submitted by {selectedReport.submitter?.firstName} {selectedReport.submitter?.lastName} on {new Date(selectedReport.submittedAt).toLocaleString()}</p>
             </div>
          </div>
          <div className="flex gap-2">
             <button onClick={() => generateReportPDF(selectedReport)} className="bg-slate-100 text-slate-700 border border-slate-200 px-4 py-2 rounded-lg text-sm font-bold hover:bg-slate-200 flex items-center gap-2 cursor-pointer"><Download className="w-4 h-4" /> EXPORT PDF</button>
             {selectedReport.status !== 'APPROVED' && (
               <>
                 <button 
                   onClick={() => {
                     const reason = prompt("Enter the feedback / comments for requesting revisions:");
                     if (reason) handleApproveReport(selectedReport.id, 'REJECTED', reason);
                   }} 
                   className="bg-red-50 text-red-600 border border-red-200 px-4 py-2 rounded-lg text-sm font-bold hover:bg-red-100 cursor-pointer"
                 >
                   REQUEST REVISION
                 </button>
                 <button 
                   onClick={() => handleApproveReport(selectedReport.id, 'APPROVED')} 
                   className="bg-emerald-600 text-white px-6 py-2 rounded-lg text-sm font-bold hover:bg-emerald-700 cursor-pointer"
                 >
                   APPROVE REPORT
                 </button>
               </>
             )}
          </div>
        </div>

        {/* Workspace Content */}
        <div className="flex-1 md:overflow-y-auto overflow-visible p-6 space-y-6">
           <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
             <h3 className="font-bold text-slate-800 mb-2">Field Notes & Logs</h3>
             <p className="text-sm text-slate-600 bg-slate-50 p-4 rounded-lg border border-slate-100 min-h-[100px]">
               {selectedReport.notes || "No notes provided."}
             </p>
           </div>
           
           <EvidenceGallery evidenceList={selectedReport.evidence || []} isSupervisor={true} />
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:h-full md:min-h-0 h-auto">
      
      {/* Top row: Metrics */}
      <div className="md:col-span-12 grid grid-cols-2 md:grid-cols-4 gap-4 shrink-0">
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <p className="text-xs font-bold text-slate-400 uppercase">Team Activity</p>
          <div className="text-3xl font-black text-slate-800 mt-1">{tasks.filter(t => t.status === 'IN_PROGRESS').length}</div>
          <p className="text-[10px] text-slate-500">Tasks in progress</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <p className="text-xs font-bold text-slate-400 uppercase">Awaiting Review</p>
          <div className="text-3xl font-black text-purple-600 mt-1 animate-pulse">
            {tasks.filter(t => t.extendedStatus === 'Awaiting Review').length}
          </div>
          <p className="text-[10px] text-slate-500">Submissions to grade</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <p className="text-xs font-bold text-slate-400 uppercase">Completion Rate</p>
          <div className="text-3xl font-black text-emerald-600 mt-1">
             {tasks.length > 0 ? Math.round((tasks.filter(t => t.extendedStatus === 'Completed').length / tasks.length) * 100) : 0}%
          </div>
          <p className="text-[10px] text-slate-500">Of assigned tasks</p>
        </div>
        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 text-white">
          <p className="text-xs font-bold text-slate-400 uppercase whitespace-nowrap">Operational Dispatch</p>
          <button 
            onClick={() => {
              
              setIsAssignModalOpen(true);
            }}
            className="w-full mt-3 bg-white text-slate-900 text-xs font-bold py-2 rounded-lg hover:bg-slate-100 transition cursor-pointer shadow-sm border border-transparent"
          >
            + DISPATCH NEW TASK
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="md:col-span-8 flex flex-col md:min-h-0 md:h-full h-auto bg-white rounded-2xl border border-slate-200 md:overflow-hidden overflow-visible shadow-sm">
        {/* Navigation Tabs */}
        <div className="p-1.5 bg-slate-100/80 border-b border-slate-200 shrink-0 flex gap-1">
          <button
            onClick={() => setActiveTab('approvals')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition cursor-pointer ${
              activeTab === 'approvals' 
                ? 'bg-white text-slate-900 shadow-sm' 
                : 'text-slate-500 hover:bg-white/40 hover:text-slate-800'
            }`}
          >
            <FileCheck className="w-4 h-4" />
            APPROVAL QUEUE ({pendingApprovals.length})
          </button>
          
          <button
            onClick={() => setActiveTab('pipelines')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition cursor-pointer ${
              activeTab === 'pipelines' 
                ? 'bg-white text-slate-900 shadow-sm' 
                : 'text-slate-500 hover:bg-white/40 hover:text-slate-800'
            }`}
          >
            <GitMerge className="w-4 h-4" />
            OPERATIONAL PIPELINES ({tasks.length})
          </button>
        </div>

        {/* Tab 1: Approval Queue */}
        {activeTab === 'approvals' && (
          <div className="flex-1 md:overflow-y-auto overflow-visible p-5 space-y-4 bg-slate-50/50">
            {pendingApprovals.map(r => (
              <div key={r.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 border border-slate-200 rounded-xl hover:border-slate-300 bg-white gap-4 shadow-xs transition hover:shadow-sm">
                 <div>
                   <div className="flex items-center gap-2 mb-1">
                     {r.submitter && <span className="text-[10px] font-black bg-slate-900 text-white px-2 py-0.5 rounded uppercase">{r.submitter.firstName} {r.submitter.lastName}</span>}
                     <span className="text-[10px] text-slate-400 font-semibold">{new Date(r.submittedAt).toLocaleString()}</span>
                   </div>
                   <p className="font-extrabold text-sm text-slate-900">{r.task?.title || r.reportType}</p>
                   {r.evidence && r.evidence.length > 0 && (
                     <p className="text-[10px] bg-indigo-50 border border-indigo-100 text-indigo-700 px-2 py-0.5 mt-2 inline-block rounded font-bold">{r.evidence.length} Evidence Items attached</p>
                   )}
                 </div>
                 <div className="flex gap-2 w-full sm:w-auto shrink-0">
                   <button onClick={() => setSelectedReport(r)} className="flex-1 sm:flex-none px-3.5 py-1.5 text-xs font-bold rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer">VIEW WORKSPACE</button>
                   <button onClick={() => handleApproveReport(r.id, 'APPROVED')} className="flex-1 sm:flex-none px-4 py-1.5 text-xs font-bold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 cursor-pointer shadow-xs">APPROVE</button>
                 </div>
              </div>
            ))}
            {pendingApprovals.length === 0 && (
              <div className="py-12 flex flex-col items-center justify-center text-slate-400">
                 <FileCheck className="w-12 h-12 mb-3 text-slate-200" />
                 <p className="font-bold text-sm">Approval Queue is clean!</p>
                 <p className="text-xs text-slate-400 mt-1">No reports pending review.</p>
              </div>
            )}
            
            <div className="mt-8">
              <h4 className="font-black text-slate-400 text-xs uppercase tracking-wider mb-3">Recently Reviewed</h4>
              {reports.filter(r => r.status === 'APPROVED' || r.status === 'REJECTED').slice(0, 5).map(r => (
                <div key={r.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-3.5 border-b border-slate-150 last:border-0 hover:bg-white rounded-xl gap-4 transition">
                   <div>
                     <div className="flex items-center gap-2 mb-1">
                       {r.submitter && <span className="text-[10px] font-bold bg-slate-100 px-2 py-0.5 rounded text-slate-700">{r.submitter.firstName} {r.submitter.lastName}</span>}
                       <span className="text-[10px] text-slate-400">{new Date(r.submittedAt).toLocaleString()}</span>
                     </div>
                     <p className="font-bold text-sm text-slate-700">{r.task?.title || r.reportType}</p>
                   </div>
                   <div className="flex items-center gap-3 w-full sm:w-auto">
                     <span className={`text-[10px] font-black px-2 py-0.5 rounded border uppercase ${
                       r.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-red-50 text-red-700 border-red-100'
                     }`}>
                       {r.status}
                     </span>
                     <button onClick={() => setSelectedReport(r)} className="flex-1 sm:flex-none px-3 py-1.5 text-xs font-bold rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 cursor-pointer">VIEW</button>
                   </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 2: Operational Pipelines */}
        {activeTab === 'pipelines' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Filter Sub-bar */}
            <div className="px-5 py-3 border-b border-slate-100 flex flex-wrap items-center gap-3 bg-slate-50 shrink-0">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input 
                  type="text" 
                  placeholder="Search tasks or assignees..." 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-lg pl-9 pr-3 py-2 outline-none focus:ring-2 focus:ring-slate-950 text-slate-800 bg-white"
                />
              </div>

              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="text-xs border border-slate-200 rounded-lg px-2.5 py-2 outline-none text-slate-700 bg-white"
              >
                <option value="ALL">All Statuses</option>
                <option value="Assigned">Assigned</option>
                <option value="Accepted">Accepted</option>
                <option value="In Progress">In Progress</option>
                <option value="Awaiting Review">Awaiting Review</option>
                <option value="Revision Requested">Revision Requested</option>
                <option value="Approved">Approved</option>
                <option value="Completed">Completed</option>
                <option value="Archived">Archived</option>
              </select>

              <select
                value={priorityFilter}
                onChange={e => setPriorityFilter(e.target.value)}
                className="text-xs border border-slate-200 rounded-lg px-2.5 py-2 outline-none text-slate-700 bg-white"
              >
                <option value="ALL">All Priorities</option>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-5 space-y-3 bg-slate-50/50">
              {filteredTasks.map(t => (
                <div key={t.id} className="bg-white p-4 rounded-xl border border-slate-200 hover:border-slate-300 shadow-xs hover:shadow-sm transition-all flex flex-col gap-3 group">
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span className="text-[9px] bg-slate-900 text-white font-black px-2 py-0.5 rounded tracking-wider uppercase">
                          {t.category || 'General'}
                        </span>
                        <span className={`text-[9px] font-black px-2 py-0.5 rounded border uppercase ${getStatusBadgeStyle(t.extendedStatus)}`}>
                          {t.extendedStatus}
                        </span>
                        <span className="text-xs text-slate-500 font-bold">Assigned to: {t.assignee?.firstName} {t.assignee?.lastName}</span>
                      </div>
                      <h4 className="font-extrabold text-slate-800 text-sm group-hover:text-indigo-600 transition">{t.title}</h4>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-1">{t.description}</p>
                    </div>
                    
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase ${
                      t.priority === 'CRITICAL' ? 'bg-red-50 text-red-700' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {t.priority}
                    </span>
                  </div>

                  <div className="flex justify-between items-center pt-3 border-t border-slate-150 flex-wrap gap-3">
                    <div className="flex items-center gap-4 text-[10px] text-slate-400 font-bold">
                      <div className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Due: {new Date(t.dueDate).toLocaleDateString()}</div>
                      {t.comments && t.comments.length > 0 && (
                        <div className="flex items-center gap-1"><MessageSquare className="w-3.5 h-3.5 text-indigo-400" /> {t.comments.length} Comments</div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <button 
                        onClick={() => setSelectedDetailTask(t)} 
                        className="px-2.5 py-1 text-[11px] font-black border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg flex items-center gap-1 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" /> DETAILS
                      </button>

                      {t.extendedStatus === 'Approved' && (
                        <button 
                          onClick={() => handleTransitionTask(t.id, 'Completed', undefined, 'Supervisor marked work completed')} 
                          className="px-2.5 py-1 text-[11px] font-black bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg flex items-center gap-1 cursor-pointer"
                        >
                          <CheckCircle className="w-3.5 h-3.5" /> COMPLETED
                        </button>
                      )}

                      {t.extendedStatus === 'Completed' && (
                        <button 
                          onClick={() => handleTransitionTask(t.id, 'Archived', undefined, 'Supervisor archived completed task')} 
                          className="px-2.5 py-1 text-[11px] font-black bg-slate-200 hover:bg-slate-350 text-slate-700 rounded-lg flex items-center gap-1 cursor-pointer"
                        >
                          <Archive className="w-3.5 h-3.5" /> ARCHIVE
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {filteredTasks.length === 0 && (
                <p className="text-xs text-slate-400 text-center py-10">No tasks match pipeline filters.</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Side Panel: Active Uganda Team */}
      <div className="md:col-span-4 bg-slate-50 rounded-2xl border border-slate-200 p-5 flex flex-col min-h-[300px] md:h-full md:overflow-hidden overflow-visible shadow-sm">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2 shrink-0">
          <Map className="w-4 h-4" /> Operational Locations
        </h3>
        <div className="bg-slate-200 flex-1 rounded-xl w-full border border-slate-300 relative overflow-hidden flex items-center justify-center">
           <Map className="w-12 h-12 text-slate-400 opacity-50 absolute" />
           <div className="absolute inset-0 p-4">
             <div className="w-3 h-3 bg-emerald-500 rounded-full animate-bounce absolute top-20 left-10 shadow-lg shadow-emerald-500/50 outline outline-2 outline-white"></div>
             <div className="w-3 h-3 bg-amber-500 rounded-full absolute bottom-20 right-16 shadow-lg outline outline-2 outline-white animate-pulse"></div>
           </div>
        </div>
        <div className="shrink-0 mt-4 space-y-2 bg-white p-3 rounded-xl border border-slate-150">
           <div className="flex justify-between items-center text-xs">
             <span className="font-bold flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></div> On Route</span>
             <span className="text-slate-500">12 Officers</span>
           </div>
           <div className="flex justify-between items-center text-xs">
             <span className="font-bold flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-amber-500"></div> Delayed</span>
             <span className="text-slate-500">3 Officers</span>
           </div>
        </div>
      </div>

      {/* Task Dispatch Modal */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 bg-slate-950/45 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-xl overflow-hidden animate-scaleIn">
            <div className="bg-slate-900 text-white p-5 flex justify-between items-center">
              <h3 className="font-extrabold text-lg tracking-tight">Dispatch New Task</h3>
              <button 
                type="button"
                onClick={() => setIsAssignModalOpen(false)} 
                className="text-slate-400 hover:text-white transition text-2xl font-bold leading-none cursor-pointer"
              >
                &times;
              </button>
            </div>
            
            <form onSubmit={handleAssignTask} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Task Title</label>
                <input 
                  type="text" 
                  required
                  value={assignForm.title}
                  onChange={e => setAssignForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g. Jinja Depot stock auditing visit"
                  className="w-full text-sm border border-slate-200 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-slate-950 text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Description & Guidelines</label>
                <textarea 
                  required
                  value={assignForm.description}
                  onChange={e => setAssignForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Provide precise guidelines, verification geofences, and evidence criteria..."
                  className="w-full text-sm border border-slate-200 rounded-lg p-2.5 h-20 outline-none focus:ring-2 focus:ring-slate-950 text-slate-800"
                ></textarea>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Task Category</label>
                  <select 
                    value={assignForm.category}
                    onChange={e => setAssignForm(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full text-sm border border-slate-200 rounded-lg p-2.5 outline-none text-slate-800 bg-white"
                  >
                    <option value="Stock Count">Stock Count</option>
                    <option value="Merchandising">Merchandising</option>
                    <option value="Promotion Survey">Promotion Survey</option>
                    <option value="Competitor Audit">Competitor Audit</option>
                    <option value="Quality Control">Quality Control</option>
                    <option value="General Audit">General Audit</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Task Type</label>
                  <select 
                    value={assignForm.taskType}
                    onChange={e => setAssignForm(prev => ({ ...prev, taskType: e.target.value }))}
                    className="w-full text-sm border border-slate-200 rounded-lg p-2.5 outline-none text-slate-800 bg-white"
                  >
                    <option value="STOCK_AUDIT">Stock Audit</option>
                    <option value="MERCHANDISING">Merchandising Visit</option>
                    <option value="GENERAL_VISIT">General Visit</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Priority</label>
                  <select 
                    value={assignForm.priority}
                    onChange={e => setAssignForm(prev => ({ ...prev, priority: e.target.value }))}
                    className="w-full text-sm border border-slate-200 rounded-lg p-2.5 outline-none text-slate-800 bg-white"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Due Date</label>
                  <input 
                    type="date" 
                    required
                    value={assignForm.dueDate}
                    onChange={e => setAssignForm(prev => ({ ...prev, dueDate: e.target.value }))}
                    className="w-full text-sm border border-slate-200 rounded-lg p-2.5 outline-none text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Assign To Officer</label>
                <select 
                  required
                  value={assignForm.assignedTo}
                  onChange={e => setAssignForm(prev => ({ ...prev, assignedTo: e.target.value }))}
                  className="w-full text-sm border border-slate-200 rounded-lg p-2.5 outline-none text-slate-800 bg-white"
                >
                  {subordinates.length === 0 ? (
                    <option value="">No department officers found</option>
                  ) : (
                    subordinates.map(sub => (
                      <option key={sub.id} value={sub.id}>{sub.firstName} {sub.lastName} ({sub.jobTitle || 'Field Officer'})</option>
                    ))
                  )}
                </select>
              </div>

              <div className="pt-4 flex justify-end gap-2 border-t border-slate-100">
                <button 
                  type="button"
                  onClick={() => setIsAssignModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  CANCEL
                </button>
                <button 
                  type="submit"
                  disabled={subordinates.length === 0}
                  className="px-5 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800 disabled:opacity-50 cursor-pointer"
                >
                  DISPATCH TASK
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Task Details & Timeline Drawer Modal */}
      {selectedDetailTask && (
        <div className="fixed inset-0 bg-slate-950/45 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden animate-scaleIn flex flex-col max-h-[85vh]">
            {/* Header */}
            <div className="bg-slate-900 text-white p-5 flex justify-between items-start shrink-0">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black bg-white/15 px-2 py-0.5 rounded tracking-wider uppercase text-white/90">
                    {selectedDetailTask.category || 'General'}
                  </span>
                  <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-md border ${getStatusBadgeStyle(selectedDetailTask.extendedStatus)}`}>
                    {selectedDetailTask.extendedStatus}
                  </span>
                </div>
                <h3 className="font-extrabold text-lg tracking-tight leading-snug">{selectedDetailTask.title}</h3>
                <p className="text-xs text-slate-400">Assigned Officer: {selectedDetailTask.assignee?.firstName} {selectedDetailTask.assignee?.lastName}</p>
              </div>
              <button 
                type="button"
                onClick={() => setSelectedDetailTask(null)} 
                className="text-slate-400 hover:text-white transition text-2xl font-black leading-none p-1 cursor-pointer"
              >
                &times;
              </button>
            </div>
            
            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-12 gap-6 min-h-0">
              {/* Left Panel: Description and Timeline */}
              <div className="md:col-span-7 space-y-5">
                <div>
                  <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                    <FileText className="w-3.5 h-3.5 text-slate-400" />
                    Task Instructions
                  </h4>
                  <p className="text-sm text-slate-700 bg-slate-50 p-3.5 rounded-xl border border-slate-100 font-medium leading-relaxed">
                    {selectedDetailTask.description}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Priority Level</span>
                    <span className="text-xs font-black text-slate-800 uppercase">{selectedDetailTask.priority}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Due Date</span>
                    <span className="text-xs font-black text-slate-800">{new Date(selectedDetailTask.dueDate).toLocaleDateString()}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Task Type</span>
                    <span className="text-xs font-black text-slate-800 uppercase">{selectedDetailTask.taskType}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Assigned To</span>
                    <span className="text-xs font-black text-slate-800">{selectedDetailTask.assignee?.firstName} {selectedDetailTask.assignee?.lastName}</span>
                  </div>
                </div>

                {/* Timeline visual audit logs */}
                <div>
                  <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-3">
                    <History className="w-3.5 h-3.5 text-slate-400" />
                    State Progression Log
                  </h4>
                  <div className="space-y-3 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                    {Array.isArray(selectedDetailTask.timeline) && selectedDetailTask.timeline.map((entry: any, idx: number) => (
                      <div key={idx} className="flex gap-3 relative pl-6">
                        <div className={`absolute left-1.5 top-1.5 w-3.5 h-3.5 rounded-full border-2 bg-white flex items-center justify-center ${
                          idx === selectedDetailTask.timeline.length - 1 ? 'border-indigo-600 ring-2 ring-indigo-100' : 'border-slate-350'
                        }`}>
                          <div className={`w-1 h-1 rounded-full ${idx === selectedDetailTask.timeline.length - 1 ? 'bg-indigo-600 animate-pulse' : 'bg-slate-400'}`}></div>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-black text-slate-800">{entry.status}</span>
                            <span className="text-[10px] text-slate-400">{new Date(entry.timestamp).toLocaleString()}</span>
                          </div>
                          <p className="text-[11px] text-slate-500 font-medium">By {entry.actorName}</p>
                          {entry.notes && <p className="text-xs text-slate-600 mt-0.5 bg-slate-50 px-2 py-1 rounded border border-slate-100/60 inline-block font-semibold">"{entry.notes}"</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Panel: Discussion Feed */}
              <div className="md:col-span-5 flex flex-col min-h-0 border-t md:border-t-0 md:border-l border-slate-100 md:pl-5 pt-4 md:pt-0 animate-fadeIn">
                <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-2.5">
                  <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
                  Collaborative Feed ({selectedDetailTask.comments?.length || 0})
                </h4>
                
                {/* Discussion List */}
                <div className="flex-1 overflow-y-auto space-y-3 min-h-[150px] bg-slate-50/50 p-3 rounded-2xl border border-slate-100 mb-3">
                  {Array.isArray(selectedDetailTask.comments) && selectedDetailTask.comments.map((comment: any) => {
                    const isSelf = comment.authorId === profile?.id;
                    return (
                      <div key={comment.id} className={`flex flex-col ${isSelf ? 'items-end' : 'items-start'}`}>
                        <div className={`max-w-[90%] rounded-xl p-2.5 text-xs ${
                          isSelf ? 'bg-slate-900 text-white' : 'bg-white text-slate-800 border border-slate-250/70 shadow-xs'
                        }`}>
                          {!isSelf && <span className="font-extrabold text-[9px] text-indigo-600 block mb-0.5">{comment.authorName}</span>}
                          <p className="font-medium whitespace-pre-wrap">{comment.text}</p>
                        </div>
                        <span className="text-[9px] text-slate-400 mt-1 px-1 font-semibold">
                          {new Date(comment.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    );
                  })}
                  {(!selectedDetailTask.comments || selectedDetailTask.comments.length === 0) && (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center py-10">
                      <MessageSquare className="w-8 h-8 mb-2 text-slate-200" />
                      <p className="text-[11px] font-bold">No discussions logged yet.</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Type a direction below to guide the officer.</p>
                    </div>
                  )}
                </div>

                {/* Comment Form */}
                <form onSubmit={handleAddComment} className="flex gap-2">
                  <input 
                    type="text" 
                    required
                    value={newComment}
                    onChange={e => setNewComment(e.target.value)}
                    placeholder="Provide direction or coordinates..."
                    className="flex-1 text-xs border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-slate-950 text-slate-850 bg-white"
                  />
                  <button 
                    type="submit" 
                    disabled={submittingComment || !newComment.trim()}
                    className="p-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg transition disabled:opacity-40 shrink-0 cursor-pointer flex items-center justify-center"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
              </div>
            </div>

            {/* Actions Footer */}
            <div className="bg-slate-50 p-4 border-t border-slate-100 flex justify-end gap-2 shrink-0">
              <button 
                onClick={() => setSelectedDetailTask(null)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                CLOSE WINDOW
              </button>
              
              {selectedDetailTask.extendedStatus === 'Approved' && (
                <button 
                  onClick={() => handleTransitionTask(selectedDetailTask.id, 'Completed', undefined, 'Supervisor marked work completed')}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold px-5 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <CheckCircle className="w-4 h-4" /> MARK COMPLETED
                </button>
              )}

              {selectedDetailTask.extendedStatus === 'Completed' && (
                <button 
                  onClick={() => handleTransitionTask(selectedDetailTask.id, 'Archived', undefined, 'Supervisor archived completed task')}
                  className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-extrabold px-5 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Archive className="w-4 h-4" /> ARCHIVE TASK
                </button>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
