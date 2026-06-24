import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { CheckCircle2, Circle, Clock, MapPin, AlertCircle, RefreshCw, ChevronLeft, Save } from 'lucide-react';
import EvidenceUploader from '../features/EvidenceUploader';
import EvidenceGallery from '../features/EvidenceGallery';

export default function FieldStaffDashboard() {
  const { getToken } = useAuth();
  const [tasks, setTasks] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTask, setActiveTask] = useState<any | null>(null);
  const [notes, setNotes] = useState('');

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

  useEffect(() => {
    fetchData();
  }, [getToken]);

  const handleSubmitReport = async () => {
    if (!activeTask) return;
    try {
      const token = await getToken();
      const res = await fetch('/api/v1/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          taskId: activeTask.id,
          reportType: activeTask.taskType || 'FIELD_VISIT',
          notes,
          gpsLat: 0.3476,
          gpsLng: 32.5825
        })
      });
      if (res.ok) {
        setNotes('');
        setActiveTask(null);
        fetchData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (activeTask) {
       const draft = reports.find(r => r.taskId === activeTask.id && r.status === 'DRAFT');
       if (draft) {
          setNotes(draft.notes || '');
       } else {
          setNotes('');
       }
    }
  }, [activeTask, reports]);

  const pendingTasks = tasks.filter(t => t.status === 'PENDING' || t.status === 'IN_PROGRESS');
  const rejectedReports = reports.filter(r => r.status === 'REJECTED');

  if (loading) return <div className="p-8 flex justify-center text-slate-400"><RefreshCw className="w-8 h-8 animate-spin" /></div>;

  if (activeTask) {
    const draftReport = reports.find(r => r.taskId === activeTask.id && r.status === 'DRAFT');
    
    if (!draftReport) {
       const initDraft = async () => {
         const token = await getToken();
         const res = await fetch('/api/v1/reports', {
           method: 'POST',
           headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
           body: JSON.stringify({ taskId: activeTask.id, reportType: activeTask.taskType || 'FIELD_VISIT' })
         });
         if (res.ok) fetchData();
       }
       initDraft();
       return <div className="p-8 flex justify-center text-slate-400"><RefreshCw className="w-8 h-8 animate-spin" /></div>;
    }

    return (
      <div className="flex flex-col h-full bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden">
        <div className="bg-white p-4 border-b border-slate-200 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-4">
             <button onClick={() => setActiveTask(null)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500">
               <ChevronLeft className="w-5 h-5" />
             </button>
             <div>
               <h2 className="font-bold text-lg text-slate-800">Execute: {activeTask.title}</h2>
             </div>
          </div>
          <button onClick={() => {
              const submit = async () => {
                const token = await getToken();
                await fetch(`/api/v1/reports/${draftReport.id}/status`, {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                  body: JSON.stringify({ status: 'PENDING_REVIEW', notes })
                });
                setActiveTask(null);
                fetchData();
              };
              submit();
          }} className="bg-slate-900 text-white px-6 py-2 rounded-lg text-sm font-bold hover:bg-slate-800 flex items-center gap-2">
            <Save className="w-4 h-4" /> SUBMIT REPORT
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 space-y-6 flex flex-col md:flex-row gap-6">
           <div className="flex-1 space-y-6">
             <div className="bg-white p-5 rounded-xl border border-slate-200">
               <h3 className="font-bold text-slate-800 mb-2">Field Notes</h3>
               <textarea 
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full h-32 p-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 text-sm"
                  placeholder="Enter details of your visit or audit here..."
                  onBlur={async () => {
                     const token = await getToken();
                     await fetch(`/api/v1/reports/${draftReport.id}/status`, {
                       method: 'PATCH',
                       headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                       body: JSON.stringify({ notes })
                     });
                  }}
               ></textarea>
             </div>
             <EvidenceGallery evidenceList={draftReport.evidence || []} />
           </div>
           
           <div className="w-full md:w-80">
             <EvidenceUploader reportId={draftReport.id} onUploadComplete={fetchData} />
           </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 h-full min-h-0">
      
      {/* Left Column - Tasks */}
      <div className="md:col-span-8 flex flex-col gap-6 min-h-0 h-full overflow-hidden">
        <div className="bg-white rounded-2xl border border-slate-200 flex-1 flex flex-col overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              My Assigned Tasks
            </h3>
            <span className="text-xs bg-slate-200 text-slate-700 font-bold px-2.5 py-1 rounded-full">{pendingTasks.length} Pending</span>
          </div>
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {pendingTasks.map(t => (
              <div key={t.id} className="border border-slate-200 p-4 rounded-xl hover:border-slate-300 transition bg-white flex flex-col gap-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-slate-800">{t.title}</h4>
                    <p className="text-xs text-slate-500 mt-1">{t.description}</p>
                  </div>
                  <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded-md ${
                    t.priority === 'CRITICAL' ? 'bg-red-100 text-red-700' :
                    t.priority === 'HIGH' ? 'bg-orange-100 text-orange-700' :
                    t.priority === 'MEDIUM' ? 'bg-amber-100 text-amber-700' :
                    'bg-slate-100 text-slate-700'
                  }`}>
                    {t.priority}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs font-medium text-slate-500">
                  <div className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Due: {new Date(t.dueDate).toLocaleDateString()}</div>
                  {t.targetLocationLat && <div className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> Location Set</div>}
                </div>
                <div className="pt-3 flex justify-end">
                  <button onClick={() => setActiveTask(t)} className="bg-slate-900 text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-slate-800 transition">
                    EXECUTE TASK
                  </button>
                </div>
              </div>
            ))}
            {pendingTasks.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-slate-400">
                <CheckCircle2 className="w-12 h-12 mb-3 text-slate-200" />
                <p>All caught up!</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right Column - Status & Revisions */}
      <div className="md:col-span-4 flex flex-col gap-6 min-h-0 h-full overflow-hidden">
        
        {/* Revisions Needed */}
        <div className="bg-white rounded-2xl border border-red-200 shadow-sm flex flex-col shrink-0">
          <div className="p-4 border-b border-red-100 bg-red-50 rounded-t-2xl flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <h3 className="font-bold text-red-900 text-sm">Action Required ({rejectedReports.length})</h3>
          </div>
          <div className="p-4 space-y-3 max-h-64 overflow-y-auto">
            {rejectedReports.map(r => (
              <div key={r.id} className="p-3 bg-white border border-red-100 rounded-xl">
                <p className="text-xs font-bold text-slate-800">{r.task?.title || 'Report'}</p>
                {r.reviewComments && <p className="text-[11px] text-red-700 mt-1 italic">"{r.reviewComments}"</p>}
                <button className="mt-2 text-[10px] font-bold text-red-600 hover:text-red-800">REVISE NOW &rarr;</button>
              </div>
            ))}
            {rejectedReports.length === 0 && <p className="text-xs text-slate-500 text-center py-2">No revisions needed</p>}
          </div>
        </div>

        {/* Recently Submitted */}
        <div className="bg-slate-900 rounded-2xl border border-slate-800 flex-1 flex flex-col overflow-hidden text-white">
          <div className="p-4 border-b border-slate-800 shrink-0">
            <h3 className="font-bold text-white text-sm">Recent Submissions</h3>
          </div>
          <div className="p-4 overflow-y-auto flex-1 space-y-3">
             {reports.filter(r => r.status !== 'REJECTED').slice(0, 5).map(r => (
               <div key={r.id} className="flex items-center justify-between">
                 <div>
                   <p className="text-xs font-medium text-slate-200">{r.task?.title || 'Report'}</p>
                   <p className="text-[10px] text-slate-500">{new Date(r.submittedAt).toLocaleDateString()}</p>
                 </div>
                 <span className={`text-[10px] font-bold px-2 py-1 rounded-md ${r.status === 'APPROVED' ? 'bg-emerald-900/50 text-emerald-400' : 'bg-amber-900/50 text-amber-400'}`}>
                   {r.status}
                 </span>
               </div>
             ))}
          </div>
        </div>

      </div>

    </div>
  );
}
