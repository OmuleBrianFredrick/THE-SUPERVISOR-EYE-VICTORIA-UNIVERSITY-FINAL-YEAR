import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Users, FileCheck, Map, Activity, RefreshCw, ChevronLeft } from 'lucide-react';
import EvidenceGallery from '../features/EvidenceGallery';

export default function SupervisorDashboard() {
  const { getToken } = useAuth();
  const [tasks, setTasks] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<any | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = await getToken();
      const [tRes, rRes] = await Promise.all([
        fetch('/api/v1/tasks', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/v1/reports', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      if (tRes.ok) setTasks(await tRes.json());
      if (rRes.ok) setReports(await rRes.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string, decision: 'APPROVED' | 'REJECTED') => {
     try {
       const token = await getToken();
       const res = await fetch(`/api/v1/reports/${id}/status`, {
         method: 'PATCH',
         headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
         body: JSON.stringify({ status: decision })
       });
       if(res.ok) {
         fetchData();
         setSelectedReport(null);
       }
     } catch (e) {
       console.error(e);
     }
  };

  const pendingApprovals = reports.filter(r => r.status === 'DRAFT' || r.status === 'SUBMITTED' || r.status === 'PENDING_REVIEW');
  
  if (loading) return <div className="p-8 flex justify-center text-slate-400"><RefreshCw className="w-8 h-8 animate-spin" /></div>;

  if (selectedReport) {
    return (
      <div className="flex flex-col h-full bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden">
        {/* Workspace Header */}
        <div className="bg-white p-4 border-b border-slate-200 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-4">
             <button onClick={() => setSelectedReport(null)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500">
               <ChevronLeft className="w-5 h-5" />
             </button>
             <div>
               <h2 className="font-bold text-lg text-slate-800">Review: {selectedReport.task?.title || selectedReport.reportType}</h2>
               <p className="text-xs text-slate-500">Submitted by {selectedReport.submitter?.firstName} {selectedReport.submitter?.lastName} on {new Date(selectedReport.submittedAt).toLocaleString()}</p>
             </div>
          </div>
          <div className="flex gap-2">
             <button onClick={() => handleApprove(selectedReport.id, 'REJECTED')} className="bg-red-50 text-red-600 border border-red-200 px-4 py-2 rounded-lg text-sm font-bold hover:bg-red-100">REQUEST REVISION</button>
             <button onClick={() => handleApprove(selectedReport.id, 'APPROVED')} className="bg-emerald-600 text-white px-6 py-2 rounded-lg text-sm font-bold hover:bg-emerald-700">APPROVE REPORT</button>
          </div>
        </div>

        {/* Workspace Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
           <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
             <h3 className="font-bold text-slate-800 mb-2">Field Notes</h3>
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
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 h-full min-h-0">
      
      {/* Top row: Metrics */}
      <div className="md:col-span-12 grid grid-cols-2 md:grid-cols-4 gap-4 shrink-0">
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <p className="text-xs font-bold text-slate-400 uppercase">Team Activity</p>
          <div className="text-3xl font-black text-slate-800 mt-1">{tasks.filter(t => t.status === 'IN_PROGRESS').length}</div>
          <p className="text-[10px] text-slate-500">Tasks in progress</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <p className="text-xs font-bold text-slate-400 uppercase">Pending Review</p>
          <div className="text-3xl font-black text-amber-600 mt-1">{pendingApprovals.length}</div>
          <p className="text-[10px] text-slate-500">Reports awaiting approval</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <p className="text-xs font-bold text-slate-400 uppercase">Completion Rate</p>
          <div className="text-3xl font-black text-emerald-600 mt-1">
             {tasks.length > 0 ? Math.round((tasks.filter(t => t.status === 'COMPLETED').length / tasks.length) * 100) : 0}%
          </div>
          <p className="text-[10px] text-slate-500">Of assigned tasks</p>
        </div>
        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 text-white">
          <p className="text-xs font-bold text-slate-400 uppercase whitespace-nowrap">Create New Task</p>
          <button className="w-full mt-3 bg-white text-slate-900 text-xs font-bold py-2 rounded-lg hover:bg-slate-100 transition">
            + ASSIGN TASK
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="md:col-span-8 flex flex-col min-h-0 bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between shrink-0">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-slate-500" />
            Approval Queue
          </h3>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {pendingApprovals.map(r => (
            <div key={r.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 border border-slate-200 rounded-xl hover:border-slate-300 bg-white gap-4">
               <div>
                 <div className="flex items-center gap-2 mb-1">
                   {r.submitter && <span className="text-xs font-bold bg-slate-100 px-2 py-0.5 rounded text-slate-700">{r.submitter.firstName} {r.submitter.lastName}</span>}
                   <span className="text-[10px] text-slate-400">{new Date(r.submittedAt).toLocaleString()}</span>
                 </div>
                 <p className="font-bold text-sm text-slate-900">{r.task?.title || r.reportType}</p>
                 {r.evidence && r.evidence.length > 0 && (
                   <p className="text-[10px] bg-slate-100 px-2 py-1 mt-2 inline-block rounded text-slate-600 font-bold">{r.evidence.length} Evidence Items attached</p>
                 )}
               </div>
               <div className="flex gap-2 w-full sm:w-auto">
                 <button onClick={() => setSelectedReport(r)} className="flex-1 sm:flex-none px-3 py-1.5 text-xs font-bold rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50">VIEW WORKSPACE</button>
                 <button onClick={() => handleApprove(r.id, 'APPROVED')} className="flex-1 sm:flex-none px-3 py-1.5 text-xs font-bold rounded-lg bg-emerald-500 text-white hover:bg-emerald-600">APPROVE</button>
               </div>
            </div>
          ))}
          {pendingApprovals.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-slate-400">
               <FileCheck className="w-12 h-12 mb-3 text-slate-200" />
               <p>Queue is empty</p>
            </div>
          )}
        </div>
      </div>

      {/* Side Panel: Active Team */}
      <div className="md:col-span-4 bg-slate-50 rounded-2xl border border-slate-200 p-5 flex flex-col min-h-0 overflow-hidden">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2 shrink-0">
          <Map className="w-4 h-4" /> Team Locations
        </h3>
        <div className="bg-slate-200 flex-1 rounded-xl w-full border border-slate-300 relative overflow-hidden flex items-center justify-center">
           {/* Placeholder for actual map */}
           <Map className="w-12 h-12 text-slate-400 opacity-50 absolute" />
           <div className="absolute inset-0 p-4">
             {/* Fake markers depending on active task */}
             <div className="w-3 h-3 bg-emerald-500 rounded-full animate-bounce absolute top-20 left-10 shadow-lg shadow-emerald-500/50 outline outline-2 outline-white"></div>
             <div className="w-3 h-3 bg-amber-500 rounded-full absolute bottom-20 right-16 shadow-lg outline outline-2 outline-white"></div>
           </div>
        </div>
        <div className="shrink-0 mt-4 space-y-2">
           <div className="flex justify-between items-center text-xs">
             <span className="font-bold flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> On Route</span>
             <span className="text-slate-500">12</span>
           </div>
           <div className="flex justify-between items-center text-xs">
             <span className="font-bold flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-amber-500"></div> Delayed</span>
             <span className="text-slate-500">3</span>
           </div>
        </div>
      </div>

    </div>
  );
}
