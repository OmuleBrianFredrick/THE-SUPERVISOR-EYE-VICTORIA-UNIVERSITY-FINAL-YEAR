import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { 
  Users, FileCheck, Map, Activity, RefreshCw, ChevronLeft, Download,
  GitMerge, CheckCircle, Clock, Eye, MessageSquare, Search, Filter, 
  Send, History, AlertCircle, FileText, Trash2, Archive, CheckSquare,
  Plus, X, Sparkles, Wand2, FilePlus, ShieldCheck, ShieldAlert, ArrowLeft
} from 'lucide-react';
import EvidenceGallery from '../features/EvidenceGallery';
import EvidenceUploader from '../features/EvidenceUploader';
import LiveWorkerMapOverlay from '../features/LiveWorkerMapOverlay';
import MapLocationPicker from '../features/MapLocationPicker';
import { SearchableSelect } from '../ui/SearchableSelect';
import { generateReportPDF, getReportPDFBase64 } from '../../lib/pdfGenerator';
import { useTasksQuery, useReportsQuery, useSubordinatesQuery, useInvalidateQueries } from '../../hooks/useQueries';

export default function SupervisorDashboard() {
  const { getToken, profile, googleAccessToken } = useAuth();
  const { success: showSuccessToast, error: showErrorToast } = useToast();
  const invalidateQueries = useInvalidateQueries();
  
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReportId, setRejectReportId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  // Delete Task Modal State
  const [taskToDelete, setTaskToDelete] = useState<any | null>(null);
  const [isDeletingTask, setIsDeletingTask] = useState(false);

  const [isEmailing, setIsEmailing] = useState(false);

  const [activeTab, setActiveTab] = useState<'approvals' | 'pipelines' | 'reports'>('approvals');

  // Supervisor Report Creation States
  const [isAutoGenerating, setIsAutoGenerating] = useState(false);
  const [isCreatingManualReport, setIsCreatingManualReport] = useState(false);
  const [manualReportForm, setManualReportForm] = useState({
    reportType: 'SUPERVISOR_SUMMARY',
    locationName: profile?.department || 'Division Headquarters',
    notes: '',
    recipientScope: 'Department Managers & Executive Operations'
  });
  const [createdReportForEvidence, setCreatedReportForEvidence] = useState<any | null>(null);

  // Email Report Modal State
  const [reportToEmail, setReportToEmail] = useState<any | null>(null);
  const [emailRecipientInput, setEmailRecipientInput] = useState('christianekarel@gmail.com');

  const handleOpenEmailModal = (report: any) => {
    if (!googleAccessToken) {
      showErrorToast("Please sign in with Google to send emails.");
      return;
    }
    setReportToEmail(report);
    setEmailRecipientInput(report.submitter?.email || 'christianekarel@gmail.com');
  };

  const handleExecuteEmailReport = async () => {
    if (!reportToEmail) return;
    if (!emailRecipientInput || !emailRecipientInput.includes('@')) {
      showErrorToast("Please enter a valid recipient email address.");
      return;
    }

    setIsEmailing(true);
    showSuccessToast("Generating PDF and dispatching email via Gmail...");
    try {
      const pdfBase64 = await getReportPDFBase64(reportToEmail);
      const token = await getToken();
      
      const res = await fetch('/api/v1/gmail/send-report', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          to: emailRecipientInput,
          subject: `Supervisor Eye Report: ${reportToEmail.task?.title || reportToEmail.reportType}`,
          message: `Please find the attached audit report submitted by ${reportToEmail.submitter?.firstName || ''} ${reportToEmail.submitter?.lastName || ''}.\n\nSupervisor Eye Operations`,
          pdfBase64,
          filename: `Audit_Report_${reportToEmail.id?.substring(0, 8) || 'Export'}.pdf`,
          googleAccessToken
        })
      });
      
      if (res.ok) {
        showSuccessToast(`Report emailed successfully to ${emailRecipientInput}`);
        setReportToEmail(null);
      } else {
        const err = await res.json();
        showErrorToast(err.error || "Failed to send email");
      }
    } catch (err: any) {
      console.error(err);
      showErrorToast(err.message || "Failed to email report.");
    } finally {
      setIsEmailing(false);
    }
  };
  
  const { data: tasksResponse, isLoading: loadingTasks } = useTasksQuery();
  const { data: reportsResponse, isLoading: loadingReports } = useReportsQuery();
  const { data: subordinatesData, isLoading: loadingSubordinates } = useSubordinatesQuery();

  const tasks = tasksResponse?.data || tasksResponse || [];
  const reports = reportsResponse?.data || reportsResponse || [];
  const subordinates = subordinatesData || [];
  const loading = loadingTasks || loadingReports;

  const [selectedReport, setSelectedReport] = useState<any | null>(null);

  const handleAutoGenerateReport = async () => {
    setIsAutoGenerating(true);
    try {
      const token = await getToken();
      const res = await fetch('/api/v1/reports/auto-generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const report = await res.json();
        showSuccessToast('Automated task summary report compiled & queued!');
        invalidateQueries([["reports"]]);
        setSelectedReport(report);
      } else {
        const err = await res.json();
        showErrorToast(err.error || 'Failed to auto-generate report');
      }
    } catch (err: any) {
      showErrorToast('Error auto-generating supervisor report');
    } finally {
      setIsAutoGenerating(false);
    }
  };

  const handleCreateManualReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualReportForm.notes.trim()) {
      showErrorToast('Please enter report notes or operational feedback');
      return;
    }
    setIsCreatingManualReport(true);
    try {
      const token = await getToken();
      const res = await fetch('/api/v1/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          reportType: manualReportForm.reportType,
          locationName: manualReportForm.locationName,
          notes: manualReportForm.notes,
          status: 'PENDING_REVIEW'
        })
      });
      if (res.ok) {
        const newReport = await res.json();
        showSuccessToast('Supervisory report submitted to management!');
        invalidateQueries([["reports"]]);
        setCreatedReportForEvidence(newReport);
        setManualReportForm({
          reportType: 'SUPERVISOR_SUMMARY',
          locationName: profile?.department || 'Division Headquarters',
          notes: '',
          recipientScope: 'Department Managers & Executive Operations'
        });
      } else {
        const err = await res.json();
        showErrorToast(err.error || 'Failed to submit report');
      }
    } catch (err) {
      showErrorToast('Error submitting supervisory report');
    } finally {
      setIsCreatingManualReport(false);
    }
  };
  
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
    targetLocationName: '',
    targetLocationLat: null as number | null,
    targetLocationLng: null as number | null,
    dueDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
  });

  const [isEditingTask, setIsEditingTask] = useState(false);
  const [editTaskForm, setEditTaskForm] = useState({
    title: '',
    description: '',
    dueDate: '',
    targetLocationLat: '',
    targetLocationLng: '',
    targetLocationName: ''
  });

  const handleEditTaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDetailTask) return;
    try {
      const payload: any = {
        title: editTaskForm.title,
        description: editTaskForm.description,
        dueDate: new Date(editTaskForm.dueDate).toISOString()
      };
      if (editTaskForm.targetLocationLat) payload.targetLocationLat = parseFloat(editTaskForm.targetLocationLat);
      if (editTaskForm.targetLocationLng) payload.targetLocationLng = parseFloat(editTaskForm.targetLocationLng);
      if (editTaskForm.targetLocationName) payload.targetLocationName = editTaskForm.targetLocationName;

      const res = await fetch(`/api/v1/tasks/${selectedDetailTask.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${await getToken()}` },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        showSuccessToast('Task details updated successfully');
        const updatedTask = await res.json();
        invalidateQueries([["tasks"]]);
        setSelectedDetailTask({ ...selectedDetailTask, ...updatedTask });
        setIsEditingTask(false);
      } else {
        const data = await res.json();
        showErrorToast(data.error || 'Failed to update task details');
      }
    } catch (err: any) {
      showErrorToast(err.message || 'Error updating task details');
    }
  };


  const handleExecuteDeleteTask = async () => {
    if (!taskToDelete) return;
    setIsDeletingTask(true);
    
    try {
      const res = await fetch(`/api/v1/tasks/${taskToDelete.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${await getToken()}` }
      });
      if (res.ok) {
        showSuccessToast(`Dispatched task "${taskToDelete.title}" deleted successfully`);
        invalidateQueries([["tasks"], ["reports"], ["stats"]]);
        if (selectedDetailTask && selectedDetailTask.id === taskToDelete.id) {
          setSelectedDetailTask(null);
        }
        setTaskToDelete(null);
      } else {
        const data = await res.json();
        showErrorToast(data.error || 'Failed to delete task');
      }
    } catch (err: any) {
      showErrorToast(err.message || 'Error deleting task');
    } finally {
      setIsDeletingTask(false);
    }
  };

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
          targetLocationName: '',
          targetLocationLat: null,
          targetLocationLng: null,
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

       let taskId = '';
       let realReportId = reportId;

       if (reportId.startsWith('task_rep_')) {
         taskId = reportId.replace('task_rep_', '');
         realReportId = '';
       } else {
         const foundReport = reports.find(r => r.id === reportId);
         if (foundReport && foundReport.taskId) {
           taskId = foundReport.taskId;
         }
       }

       const targetTaskStatus = decision === 'APPROVED' ? 'Approved' : 'Revision Requested';

       // Update report status if real report exists
       if (realReportId) {
         await fetch(`/api/v1/reports/${realReportId}/status`, {
           method: 'PATCH',
           headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
           body: JSON.stringify({ 
             status: decision,
             performanceScore: decision === 'APPROVED' ? 95 : undefined,
             comments
           })
         }).catch(e => console.warn('Report status patch warning:', e));
       }
       
       // Update task status
       if (taskId) {
         await handleTransitionTask(
           taskId,
           targetTaskStatus,
           comments,
           decision === 'APPROVED' ? 'Supervisor approved submitted work' : `Supervisor requested revisions: ${comments || 'Revision requested'}`
         );
       } else if (realReportId) {
         // Fallback if taskId was not directly mapped
         const r = reports.find(item => item.id === realReportId);
         if (r && r.taskId) {
           await handleTransitionTask(
             r.taskId,
             targetTaskStatus,
             comments,
             decision === 'APPROVED' ? 'Supervisor approved submitted work' : `Supervisor requested revisions: ${comments || 'Revision requested'}`
           );
         }
       }

       showSuccessToast(`Submission has been ${decision.toLowerCase()}!`);
       invalidateQueries([["tasks"], ["reports"]]);
       setSelectedReport(null);
     } catch (e) {
       console.error(e);
       showErrorToast('Error processing review decision.');
     }
  };

  // Compile Approval Queue items: all reports pending review + tasks awaiting review
  const pendingReportTaskIds = new Set(
    reports
      .filter(r => r.status === 'SUBMITTED' || r.status === 'PENDING_REVIEW')
      .map(r => r.taskId)
      .filter(Boolean)
  );

  const pendingTaskWrappers = tasks
    .filter(t => ['Awaiting Review', 'Pending Approval'].includes(t.extendedStatus) && !pendingReportTaskIds.has(t.id))
    .map(t => {
      const existingReport = reports.find(r => r.taskId === t.id);
      return {
        id: existingReport ? existingReport.id : `task_rep_${t.id}`,
        taskId: t.id,
        task: t,
        status: 'PENDING_REVIEW',
        reportType: existingReport?.reportType || t.category || 'FIELD_VISIT',
        submittedAt: existingReport?.submittedAt || t.updatedAt || t.createdAt,
        submitter: existingReport?.submitter || t.assignee,
        notes: existingReport?.notes || t.description || 'No notes provided.',
        evidence: existingReport?.evidence || []
      };
    });

  const pendingApprovals = [
    ...reports
      .filter(r => r.status === 'SUBMITTED' || r.status === 'PENDING_REVIEW')
      .map(r => {
        const matchingTask = tasks.find(t => t.id === r.taskId);
        return {
          ...r,
          task: matchingTask ? { ...matchingTask, ...(r.task || {}) } : r.task,
          evidence: r.evidence || []
        };
      }),
    ...pendingTaskWrappers
  ];
  
  // Pipeline filter logic: When 'ALL', exclude tasks awaiting review because they shift to Approval Queue
  const filteredTasks = tasks.filter(t => {
    const matchesSearch = searchQuery ? (
      (t.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      ((t.assignee?.firstName || '') + ' ' + (t.assignee?.lastName || '')).toLowerCase().includes(searchQuery.toLowerCase())
    ) : true;
    
    // Tasks in Awaiting Review / Pending Approval belong exclusively to the
    // Approval Queue and must NEVER surface in the Operational Pipeline,
    // regardless of which statusFilter is selected.
    const isApprovalStageStatus = ['Awaiting Review', 'Pending Approval'].includes(t.extendedStatus);
    let matchesStatus = true;
    if (isApprovalStageStatus) {
      matchesStatus = false;
    } else if (statusFilter !== 'ALL') {
      matchesStatus = t.extendedStatus === statusFilter;
    }

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
      case 'Pending Approval':
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
             <button disabled={isEmailing} onClick={() => handleOpenEmailModal(selectedReport)} className="bg-indigo-50 text-indigo-700 border border-indigo-200 px-4 py-2 rounded-lg text-sm font-bold hover:bg-indigo-100 flex items-center gap-2 cursor-pointer disabled:opacity-50"><Send className="w-4 h-4" /> {isEmailing ? 'SENDING...' : 'EMAIL REPORT'}</button>
             {selectedReport.status !== 'APPROVED' && (
               <>
                 <button 
                   onClick={() => {
                     setRejectReportId(selectedReport.id);
                     setRejectModalOpen(true);
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
             <div className="flex justify-between items-start mb-2">
               <h3 className="font-bold text-slate-800">Field Notes & Logs</h3>
               {selectedReport.locationName && (
                 <span className="text-xs bg-indigo-50 text-indigo-700 font-bold px-2 py-1 rounded border border-indigo-100 uppercase tracking-wider">
                   📍 {selectedReport.locationName}
                 </span>
               )}
             </div>
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
          <p className="text-xs font-bold text-slate-400 uppercase">Pending Approval</p>
          <div className="text-3xl font-black text-purple-600 mt-1 animate-pulse">
            {tasks.filter(t => t.extendedStatus === 'Awaiting Review' || t.extendedStatus === 'Pending Approval').length}
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

          <button
            onClick={() => setActiveTab('reports')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition cursor-pointer ${
              activeTab === 'reports' 
                ? 'bg-slate-900 text-white shadow-sm' 
                : 'text-slate-500 hover:bg-white/40 hover:text-slate-800'
            }`}
          >
            <FilePlus className="w-4 h-4 text-emerald-400" />
            CREATE SUPERVISOR REPORT
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
                 <div className="flex gap-2 w-full sm:w-auto shrink-0 flex-wrap">
                   <button onClick={() => setSelectedReport(r)} className="flex-1 sm:flex-none px-3.5 py-1.5 text-xs font-bold rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer">VIEW WORKSPACE</button>
                   <button onClick={() => {
                     setRejectReportId(r.id);
                     setRejectModalOpen(true);
                   }} className="flex-1 sm:flex-none px-3 py-1.5 text-xs font-bold rounded-lg bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 cursor-pointer">REJECT / REVISE</button>
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
                <option value="Revision Requested">Revision Requested</option>
                <option value="Approved">Approved</option>
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

            {/* Tasks Grid */}
            <div className="flex-1 md:overflow-y-auto overflow-visible p-5 space-y-4 bg-slate-50/50">
              {(filteredTasks || []).map(t => (
                <div 
                  key={t.id} 
                  className="border border-slate-200 p-5 rounded-2xl hover:border-slate-300 hover:shadow-sm transition-all bg-white flex flex-col gap-4 relative group"
                >
                  <div className="flex justify-between items-start gap-4">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] font-black bg-slate-900 text-white px-2 py-0.5 rounded tracking-wide uppercase">
                          {t.category || 'General'}
                        </span>
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-md border bg-slate-50 text-slate-700 border-slate-200">
                          {t.extendedStatus}
                        </span>
                      </div>
                      <h4 className="font-extrabold text-slate-900 text-base leading-tight group-hover:text-indigo-600 transition">{t.title}</h4>
                      <p className="text-xs text-slate-600 font-medium line-clamp-2">{t.description}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-slate-100">
                    <div className="flex items-center gap-4 text-xs font-semibold text-slate-500">
                       <div className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-slate-400" /> Due: {new Date(t.dueDate).toLocaleDateString()}</div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedDetailTask(t)}
                        className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg text-xs font-extrabold flex items-center gap-1 cursor-pointer transition border border-slate-200"
                      >
                        <Eye className="w-3.5 h-3.5" /> DETAILS
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setTaskToDelete(t);
                        }}
                        className="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition border border-red-200 hover:border-red-300"
                        title="Delete Task"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-red-500" /> DELETE
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              
              {filteredTasks.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 py-16">
                  <FileCheck className="w-12 h-12 mb-3 text-slate-200" />
                  <p className="font-bold text-sm">No tasks matched your filter criteria.</p>
                </div>
              )}
            </div>
          </div>
        )}
        {/* Tab 3: Supervisor Report Creation Hub */}
        {activeTab === 'reports' && (
          <div className="flex-1 md:overflow-y-auto overflow-visible p-6 space-y-6 bg-slate-50/60">
            {/* Automated Task Queue Compiler Card */}
            <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 shadow-md border border-slate-800">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-bold uppercase tracking-wider mb-2">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-spin" /> AUTOMATED TASK QUEUE COMPILER
                  </div>
                  <h3 className="text-xl font-black text-white">Auto-Compile Task & Operational Summary</h3>
                  <p className="text-xs text-slate-300 mt-1 max-w-xl">
                    Automatically computes dispatched tasks, completion velocities, and subordinate activity metrics across your jurisdiction, generating a queued summary report ready for management review.
                  </p>
                </div>
                <button
                  disabled={isAutoGenerating}
                  onClick={handleAutoGenerateReport}
                  className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-6 py-3 rounded-xl font-extrabold text-xs uppercase tracking-wider transition cursor-pointer shadow-lg flex items-center gap-2 shrink-0 disabled:opacity-50"
                >
                  <Wand2 className="w-4 h-4" />
                  {isAutoGenerating ? 'Compiling Task Queue...' : 'Auto-Generate & Queue Report'}
                </button>
              </div>

              <div className="grid grid-cols-3 gap-3 pt-3 border-t border-slate-800 text-center">
                <div className="bg-white/5 p-3 rounded-xl border border-white/10">
                  <div className="text-2xl font-black text-indigo-400">{tasks.length}</div>
                  <div className="text-[10px] text-slate-400 uppercase font-bold mt-0.5">Dispatched Tasks</div>
                </div>
                <div className="bg-white/5 p-3 rounded-xl border border-white/10">
                  <div className="text-2xl font-black text-emerald-400">{tasks.filter(t => t.status === 'COMPLETED').length}</div>
                  <div className="text-[10px] text-slate-400 uppercase font-bold mt-0.5">Completed Items</div>
                </div>
                <div className="bg-white/5 p-3 rounded-xl border border-white/10">
                  <div className="text-2xl font-black text-amber-400">{subordinates.length}</div>
                  <div className="text-[10px] text-slate-400 uppercase font-bold mt-0.5">Field Personnel</div>
                </div>
              </div>
            </div>

            {/* Manual Operational Report Creation Form */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
              <div className="flex justify-between items-center border-b border-slate-150 pb-3">
                <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                  <FilePlus className="w-5 h-5 text-indigo-600" />
                  Compose Supervisory Operational Report
                </h3>
                <span className="text-xs bg-slate-100 text-slate-700 font-bold px-2.5 py-1 rounded-full border border-slate-200">
                  Escalates to Department Managers & MD
                </span>
              </div>

              <form onSubmit={handleCreateManualReport} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Report Type / Category
                    </label>
                    <select
                      value={manualReportForm.reportType}
                      onChange={e => setManualReportForm(prev => ({ ...prev, reportType: e.target.value }))}
                      className="w-full text-sm border border-slate-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-slate-900 bg-white font-medium text-slate-800"
                    >
                      <option value="SUPERVISOR_SUMMARY">Supervisor Operational Summary</option>
                      <option value="DIVISION_PROGRESS">Division Activity & Progress Report</option>
                      <option value="FIELD_VISIT">Field Audit & Site Supervision</option>
                      <option value="OPERATIONAL_FEEDBACK">Subordinate & Operational Feedback</option>
                      <option value="ESCALATION_BRIEF">Management Escalation Brief</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Division / Command Location
                    </label>
                    <input
                      type="text"
                      required
                      value={manualReportForm.locationName}
                      onChange={e => setManualReportForm(prev => ({ ...prev, locationName: e.target.value }))}
                      placeholder="e.g. Mukono Sector Command Center"
                      className="w-full text-sm border border-slate-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-slate-900 text-slate-800 font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Operational Feedback, Field Progress & Observations
                  </label>
                  <textarea
                    required
                    rows={5}
                    value={manualReportForm.notes}
                    onChange={e => setManualReportForm(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Provide operational summary, task execution achievements, field officer performance observations, and recommendations for top management..."
                    className="w-full text-sm border border-slate-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-slate-900 text-slate-800"
                  ></textarea>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={isCreatingManualReport}
                    className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition cursor-pointer shadow-md flex items-center gap-2 disabled:opacity-50"
                  >
                    <Send className="w-4 h-4 text-emerald-400" />
                    {isCreatingManualReport ? 'Submitting Report...' : 'Submit Report to Management'}
                  </button>
                </div>
              </form>

              {/* Upload evidence section for newly created supervisory report */}
              {createdReportForEvidence && (
                <div className="mt-6 pt-6 border-t border-slate-200 bg-indigo-50/50 p-5 rounded-xl border border-indigo-100 space-y-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-extrabold text-indigo-950 text-sm flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-indigo-600" />
                        Attach Supporting Evidence for Submitted Report
                      </h4>
                      <p className="text-xs text-indigo-700">Upload images, inspection documents, or PDFs to attach directly to this supervisor report.</p>
                    </div>
                    <button onClick={() => setCreatedReportForEvidence(null)} className="text-xs text-indigo-600 hover:underline font-bold">Dismiss</button>
                  </div>
                  <EvidenceUploader reportId={createdReportForEvidence.id} onUploadSuccess={() => invalidateQueries([["reports"]])} />
                </div>
              )}
            </div>

            {/* Previously Submitted Supervisor Reports */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
              <h3 className="font-extrabold text-slate-900 text-sm uppercase tracking-wider">
                Submitted Supervisory Reports Queue
              </h3>
              <div className="space-y-3">
                {reports.filter(r => r.submitterId === profile?.id).map(r => (
                  <div key={r.id} className="p-4 border border-slate-200 rounded-xl hover:border-slate-300 transition bg-slate-50/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-black bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded border border-indigo-200 uppercase">
                          {r.reportType || 'SUPERVISOR REPORT'}
                        </span>
                        <span className="text-[10px] text-slate-400">{new Date(r.submittedAt).toLocaleString()}</span>
                      </div>
                      <p className="text-xs text-slate-700 font-medium line-clamp-2 max-w-xl">
                        {r.notes || 'No description notes provided'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => setSelectedReport(r)}
                        className="px-3 py-1.5 text-xs font-bold rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 cursor-pointer"
                      >
                        VIEW WORKSPACE
                      </button>
                      <button
                        onClick={() => generateReportPDF(r)}
                        className="px-3 py-1.5 text-xs font-bold rounded-lg bg-slate-900 text-white hover:bg-slate-800 cursor-pointer flex items-center gap-1"
                      >
                        <Download className="w-3.5 h-3.5" /> PDF
                      </button>
                    </div>
                  </div>
                ))}
                {reports.filter(r => r.submitterId === profile?.id).length === 0 && (
                  <p className="text-xs text-slate-400 text-center py-6">No supervisory reports created yet. Use the auto-compiler or form above to issue a report.</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
        
          {/* Right Column - Approval Queue */}
          <div className="md:col-span-4 flex flex-col gap-6 md:min-h-0 md:h-full h-auto overflow-visible md:overflow-hidden">
            <div className="bg-white rounded-2xl border border-amber-200 shadow-sm flex flex-col shrink-0 overflow-hidden h-full">
              <div className="p-4 border-b border-amber-100 bg-amber-50/70 rounded-t-2xl flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-amber-600 animate-pulse" />
                <h3 className="font-black text-amber-900 text-sm">Action Required ({pendingApprovals.length})</h3>
              </div>
              <div className="p-4 space-y-3 overflow-y-auto flex-1">
                {pendingApprovals.map(r => (
                  <div key={r.id} className="p-3 bg-white border border-amber-100 rounded-xl hover:border-amber-200 shadow-xs">
                    <p className="text-xs font-bold text-slate-800">{r.task?.title || 'Report'}</p>
                    <p className="text-[10px] text-slate-500 mt-1">Submitted by: {r.submitter?.firstName || ''} {r.submitter?.lastName || ''}</p>
                    
                    <button 
                      onClick={() => {
                        const matchedTask = tasks.find(t => t.id === r.taskId);
                        if (matchedTask) setSelectedDetailTask(matchedTask);
                      }}
                      className="mt-2.5 text-[10px] font-black text-amber-600 hover:text-amber-800 transition uppercase tracking-wider flex items-center gap-1 cursor-pointer w-full justify-center bg-amber-50 py-1.5 rounded-lg border border-amber-100"
                    >
                      REVIEW SUBMISSION &rarr;
                    </button>
                  </div>
                ))}
                {pendingApprovals.length === 0 && <p className="text-xs text-slate-500 text-center py-4">No pending approvals</p>}
              </div>
            </div>
          </div>

      {/* Assign Task Modal */}
      {isAssignModalOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/45 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn"
          onClick={(e) => { if (e.target === e.currentTarget) setIsAssignModalOpen(false); }}
        >
          <div className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden animate-scaleIn flex flex-col max-h-[85vh]">
            <div className="bg-slate-900 text-white p-5 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsAssignModalOpen(false)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                  title="Back to Default View"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
                <h2 className="font-black text-lg flex items-center gap-2"><Plus className="w-5 h-5 text-indigo-400" /> Dispatch New Task</h2>
              </div>
              <button 
                type="button"
                onClick={() => setIsAssignModalOpen(false)} 
                className="p-1.5 hover:bg-slate-800 rounded-xl transition cursor-pointer flex items-center gap-1 text-xs font-bold text-slate-300"
                title="Close Window"
              >
                <span>Close</span>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            
            <div className="overflow-y-auto flex-1">
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

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Target Location (Area)</label>
                  <input 
                    type="text" 
                    value={assignForm.targetLocationName}
                    onChange={e => setAssignForm(prev => ({ ...prev, targetLocationName: e.target.value }))}
                    placeholder="e.g. Kampala, Mukono"
                    className="w-full text-sm border border-slate-200 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-slate-950 text-slate-800 mb-3"
                  />
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Pinpoint on Map</label>
                  <MapLocationPicker 
                    onLocationSelected={(lat, lng) => setAssignForm(prev => ({ ...prev, targetLocationLat: lat, targetLocationLng: lng }))}
                    initialLat={assignForm.targetLocationLat || undefined}
                    initialLng={assignForm.targetLocationLng || undefined}
                  />
                  {assignForm.targetLocationLat && assignForm.targetLocationLng && (
                    <p className="text-[10px] text-emerald-600 font-bold mt-1">
                      Target Pinned: {assignForm.targetLocationLat.toFixed(5)}, {assignForm.targetLocationLng.toFixed(5)}
                    </p>
                  )}
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
                  <SearchableSelect
                    options={subordinates.map(sub => ({ value: sub.id, label: `${sub.firstName} ${sub.lastName} (${sub.jobTitle || 'Field Officer'})` }))}
                    value={assignForm.assignedTo}
                    onChange={(val) => setAssignForm(prev => ({ ...prev, assignedTo: val }))}
                    placeholder={subordinates.length === 0 ? "No department officers found" : "Select an officer..."}
                    disabled={subordinates.length === 0}
                  />
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
        </div>
      )}

      {/* Task Details & Timeline Drawer Modal */}
      {selectedDetailTask && (
        <div 
          className="fixed inset-0 bg-slate-950/45 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsEditingTask(false);
              setSelectedDetailTask(null);
            }
          }}
        >
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
                  
                  {!isEditingTask && (
                    <>
                      <button 
                        onClick={() => {
                          setEditTaskForm({
                            title: selectedDetailTask.title,
                            description: selectedDetailTask.description,
                            dueDate: selectedDetailTask.dueDate ? new Date(selectedDetailTask.dueDate).toISOString().split('T')[0] : '',
                            targetLocationLat: selectedDetailTask.targetLocationLat || '',
                            targetLocationLng: selectedDetailTask.targetLocationLng || '',
                            targetLocationName: selectedDetailTask.targetLocationName || ''
                          });
                          setIsEditingTask(true);
                        }}
                        className="ml-2 text-[10px] font-bold bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600/40 px-2 py-0.5 rounded transition cursor-pointer"
                      >
                        EDIT TASK
                      </button>
                      <button 
                        onClick={() => setTaskToDelete(selectedDetailTask)}
                        className="ml-2 text-[10px] font-bold bg-red-600/20 text-red-300 hover:bg-red-600/40 px-2 py-0.5 rounded transition cursor-pointer flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" />
                        DELETE TASK
                      </button>
                    </>
                  )}

                </div>
                <h3 className="font-extrabold text-lg tracking-tight leading-snug">{selectedDetailTask.title}</h3>
                <p className="text-xs text-slate-400">Assigned Officer: {selectedDetailTask.assignee?.firstName} {selectedDetailTask.assignee?.lastName}</p>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  type="button"
                  onClick={() => {
                    setIsEditingTask(false);
                    setSelectedDetailTask(null);
                  }} 
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                  title="Back to Default View"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
                <button 
                  type="button"
                  onClick={() => {
                    setIsEditingTask(false);
                    setSelectedDetailTask(null);
                  }} 
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition cursor-pointer flex items-center gap-1 text-xs font-bold"
                  title="Close Window"
                >
                  <span>Close</span>
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-12 gap-6 min-h-0">
              {/* Left Panel: Description and Timeline */}
              <div className="md:col-span-7 space-y-5">
                {isEditingTask ? (
                  <form onSubmit={handleEditTaskSubmit} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Title</label>
                      <input 
                        required
                        type="text" 
                        value={editTaskForm.title}
                        onChange={e => setEditTaskForm({...editTaskForm, title: e.target.value})}
                        className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-slate-900 bg-white text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Instructions / Description</label>
                      <textarea 
                        required
                        rows={3}
                        value={editTaskForm.description}
                        onChange={e => setEditTaskForm({...editTaskForm, description: e.target.value})}
                        className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-slate-900 bg-white text-slate-800"
                      />
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="md:col-span-2">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Due Date</label>
                        <input 
                          type="date" 
                          required
                          value={editTaskForm.dueDate}
                          onChange={e => setEditTaskForm({...editTaskForm, dueDate: e.target.value})}
                          className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-slate-900 bg-white text-slate-800"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Location Name</label>
                        <input 
                          type="text" 
                          value={editTaskForm.targetLocationName}
                          onChange={e => setEditTaskForm({...editTaskForm, targetLocationName: e.target.value})}
                          placeholder="e.g. Kampala, Mukono"
                          className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-slate-900 bg-white text-slate-800"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Target GPS Lat</label>
                        <input 
                          type="number" 
                          step="any"
                          value={editTaskForm.targetLocationLat}
                          onChange={e => setEditTaskForm({...editTaskForm, targetLocationLat: e.target.value})}
                          placeholder="Latitude"
                          className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-slate-900 bg-white text-slate-800"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Target GPS Lng</label>
                        <input 
                          type="number" 
                          step="any"
                          value={editTaskForm.targetLocationLng}
                          onChange={e => setEditTaskForm({...editTaskForm, targetLocationLng: e.target.value})}
                          placeholder="Longitude"
                          className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-slate-900 bg-white text-slate-800"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                      <button 
                        type="button" 
                        onClick={() => setIsEditingTask(false)}
                        className="px-3 py-1.5 border border-slate-200 text-slate-600 text-xs font-bold rounded-lg hover:bg-slate-100"
                      >
                        CANCEL
                      </button>
                      <button 
                        type="submit" 
                        className="px-3 py-1.5 bg-slate-900 text-white text-xs font-bold rounded-lg hover:bg-slate-800"
                      >
                        SAVE CHANGES
                      </button>
                    </div>
                  </form>
                ) : (
                  <>
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
                      {selectedDetailTask.targetLocationName && (
                        <div className="col-span-2">
                          <span className="text-[10px] text-slate-400 font-bold block uppercase">Target Location Area</span>
                          <span className="text-xs font-black text-slate-800">{selectedDetailTask.targetLocationName}</span>
                        </div>
                      )}
                      {selectedDetailTask.targetLocationLat && (
                        <div className="col-span-2">
                          <span className="text-[10px] text-slate-400 font-bold block uppercase">Target Location (GPS)</span>
                          <span className="text-xs font-black text-slate-800">{selectedDetailTask.targetLocationLat}, {selectedDetailTask.targetLocationLng}</span>
                        </div>
                      )}
                    </div>
                  </>
                )}

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
                type="button"
                onClick={() => setSelectedDetailTask(null)}
                className="px-4 py-2 border border-slate-200 bg-slate-200 hover:bg-slate-300 rounded-xl text-xs font-black text-slate-800 transition cursor-pointer flex items-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>BACK TO LIST / CANCEL</span>
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

    
      {rejectModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6">
              <h3 className="text-lg font-bold text-slate-800 mb-2">Request Revisions</h3>
              <p className="text-sm text-slate-500 mb-4">Provide clear feedback to the field staff on what needs to be corrected.</p>
              <textarea
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                className="w-full h-32 p-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="e.g., The stock count for item A is missing, please recount..."
              />
            </div>
            <div className="bg-slate-50 p-4 flex justify-end gap-3 border-t border-slate-100">
              <button 
                onClick={() => { setRejectModalOpen(false); setRejectReason(''); setRejectReportId(null); }} 
                className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-200 rounded-lg transition cursor-pointer"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                   if (rejectReason.trim() && rejectReportId) {
                      handleApproveReport(rejectReportId, 'REJECTED', rejectReason);
                      setRejectModalOpen(false);
                      setRejectReason('');
                      setRejectReportId(null);
                   }
                }}
                disabled={!rejectReason.trim()}
                className="px-5 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition cursor-pointer"
              >
                Submit Feedback
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Professional Delete Task Confirmation Modal */}
      {taskToDelete && (
        <div 
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[70] flex items-center justify-center p-4 animate-fadeIn"
          onClick={(e) => { if (e.target === e.currentTarget) setTaskToDelete(null); }}
        >
          <div className="bg-slate-900 text-white rounded-3xl max-w-lg w-full border border-slate-800 shadow-2xl overflow-hidden transform transition-all animate-scaleIn">
            {/* Header */}
            <div className="bg-gradient-to-r from-red-950 via-slate-900 to-slate-900 p-6 border-b border-slate-800 flex items-start justify-between">
              <div className="flex items-center gap-3.5">
                <div className="p-3 bg-red-500/20 text-red-400 rounded-2xl border border-red-500/30 shrink-0 shadow-lg shadow-red-950/50">
                  <Trash2 className="w-6 h-6 text-red-400" />
                </div>
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 text-[10px] font-black uppercase tracking-wider mb-1">
                    <ShieldAlert className="w-3 h-3 text-red-400" /> DESTRUCTIVE ACTION
                  </div>
                  <h3 className="text-xl font-black text-white tracking-tight">Delete Dispatched Task</h3>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  type="button"
                  onClick={() => setTaskToDelete(null)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                  title="Back to Task List"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
                <button 
                  type="button"
                  onClick={() => setTaskToDelete(null)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition cursor-pointer flex items-center gap-1 text-xs font-bold"
                  title="Close Window"
                >
                  <span>Close</span>
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content Body */}
            <div className="p-6 space-y-4">
              <p className="text-xs text-slate-300 leading-relaxed">
                You are about to permanently remove this dispatched task. Please review the details below before proceeding with deletion.
              </p>

              {/* Task Summary Card */}
              <div className="bg-slate-800/90 rounded-2xl p-4 border border-slate-700 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-700/80 pb-2.5">
                  <span className="text-[10px] font-black uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2.5 py-0.5 rounded-md">
                    {taskToDelete.category || 'General'}
                  </span>
                  <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-md border ${
                    taskToDelete.priority === 'CRITICAL' ? 'bg-red-500/20 text-red-300 border-red-500/30' :
                    taskToDelete.priority === 'HIGH' ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' :
                    'bg-slate-700 text-slate-300 border-slate-600'
                  }`}>
                    {taskToDelete.priority || 'NORMAL'} PRIORITY
                  </span>
                </div>

                <div>
                  <h4 className="text-sm font-extrabold text-white leading-snug">{taskToDelete.title}</h4>
                  {taskToDelete.description && (
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2">{taskToDelete.description}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-700/80">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Assigned Officer</span>
                    <span className="font-bold text-slate-200">
                      {taskToDelete.assignee?.firstName ? `${taskToDelete.assignee.firstName} ${taskToDelete.assignee.lastName || ''}` : 'Field Officer'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Target Location</span>
                    <span className="font-bold text-slate-200 truncate block">
                      {taskToDelete.targetLocationName || taskToDelete.locationName || 'Jurisdiction Area'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Operational Warning Box */}
              <div className="bg-red-950/40 border border-red-800/50 rounded-2xl p-3.5 text-xs space-y-1.5 text-red-200">
                <div className="font-bold flex items-center gap-1.5 text-red-400">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                  <span>Operational Impact Warning</span>
                </div>
                <ul className="list-disc list-inside space-y-1 text-[11px] text-red-300/90 leading-normal pl-1">
                  <li>Active dispatch authority for this field officer will be immediately revoked.</li>
                  <li>Pending evidence submissions and task progress logs will be permanently deleted.</li>
                  <li>This action cannot be undone.</li>
                </ul>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="bg-slate-950 p-5 border-t border-slate-800 flex items-center justify-end gap-3">
              <button
                type="button"
                disabled={isDeletingTask}
                onClick={() => setTaskToDelete(null)}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Cancel / Go Back</span>
              </button>
              <button
                type="button"
                disabled={isDeletingTask}
                onClick={handleExecuteDeleteTask}
                className="px-6 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer shadow-lg shadow-red-950/80 flex items-center gap-2 disabled:opacity-50"
              >
                {isDeletingTask ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-white" />
                    Deleting Task...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Permanently Delete Task
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Professional Email Report Dispatch Modal */}
      {reportToEmail && (
        <div 
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[70] flex items-center justify-center p-4 animate-fadeIn"
          onClick={(e) => { if (e.target === e.currentTarget) setReportToEmail(null); }}
        >
          <div className="bg-slate-900 text-white rounded-3xl max-w-lg w-full border border-slate-800 shadow-2xl overflow-hidden transform transition-all animate-scaleIn">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-slate-900 p-6 border-b border-slate-800 flex items-start justify-between">
              <div className="flex items-center gap-3.5">
                <div className="p-3 bg-indigo-500/20 text-indigo-400 rounded-2xl border border-indigo-500/30 shrink-0 shadow-lg shadow-indigo-950/50">
                  <Send className="w-6 h-6 text-indigo-400" />
                </div>
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[10px] font-black uppercase tracking-wider mb-1">
                    <ShieldCheck className="w-3 h-3 text-indigo-400" /> GMAIL INTEGRATION
                  </div>
                  <h3 className="text-xl font-black text-white tracking-tight">Email PDF Audit Report</h3>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  type="button"
                  onClick={() => setReportToEmail(null)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                  title="Back to Default View"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
                <button 
                  type="button"
                  onClick={() => setReportToEmail(null)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition cursor-pointer flex items-center gap-1 text-xs font-bold"
                  title="Close Window"
                >
                  <span>Close</span>
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content Body */}
            <div className="p-6 space-y-4">
              <p className="text-xs text-slate-300 leading-relaxed">
                Dispatch an official PDF report directly via your authenticated Google Workspace account.
              </p>

              {/* Recipient Input */}
              <div className="space-y-2">
                <label className="text-xs font-extrabold text-slate-200 uppercase tracking-wider block">
                  Recipient Email Address
                </label>
                <div className="relative">
                  <input
                    type="email"
                    placeholder="e.g. director@movitgroup.com"
                    value={emailRecipientInput}
                    onChange={(e) => setEmailRecipientInput(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                  />
                </div>
              </div>

              {/* Quick Contacts Suggestion Pills */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Quick Recipient Selection:</span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    'christianekarel@gmail.com',
                    'simpson.birungi@movitgroup.com',
                    'james.munene@movitgroup.com',
                    'bruce.mpamizo@movitgroup.com',
                    'adard.mukiibi@movitgroup.com'
                  ].map((email) => (
                    <button
                      key={email}
                      type="button"
                      onClick={() => setEmailRecipientInput(email)}
                      className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition cursor-pointer ${
                        emailRecipientInput === email
                          ? 'bg-indigo-600 text-white border-indigo-500 font-bold'
                          : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                      }`}
                    >
                      {email.split('@')[0]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Report Summary Card */}
              <div className="bg-slate-800/80 rounded-2xl p-4 border border-slate-700 space-y-2.5">
                <div className="flex items-center justify-between text-xs border-b border-slate-700/80 pb-2">
                  <span className="text-slate-400 font-bold text-[10px] uppercase">Report Subject</span>
                  <span className="text-indigo-300 font-extrabold text-[11px]">
                    {reportToEmail.task?.title || reportToEmail.reportType || 'Audit Summary'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-bold text-[10px] uppercase">Attachment</span>
                  <span className="text-emerald-400 font-extrabold text-[11px] flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5" />
                    Audit_Report_{reportToEmail.id?.substring(0, 8) || 'Export'}.pdf
                  </span>
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="bg-slate-950 p-5 border-t border-slate-800 flex items-center justify-end gap-3">
              <button
                type="button"
                disabled={isEmailing}
                onClick={() => setReportToEmail(null)}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Cancel / Go Back</span>
              </button>
              <button
                type="button"
                disabled={isEmailing || !emailRecipientInput}
                onClick={handleExecuteEmailReport}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer shadow-lg shadow-indigo-950/80 flex items-center gap-2 disabled:opacity-50"
              >
                {isEmailing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-white" />
                    Sending Email...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Send Email Report
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Real-time worker radar overlay */}
      <LiveWorkerMapOverlay />
</div>
  );
}