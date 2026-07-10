import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { 
  CheckCircle2, Circle, Clock, MapPin, AlertCircle, RefreshCw, 
  ChevronLeft, Save, WifiOff, MessageSquare, Search, Filter, 
  History, Send, ArrowRight, Clipboard, Tag, Calendar, User, Eye
} from 'lucide-react';
import EvidenceUploader from '../features/EvidenceUploader';
import EvidenceGallery from '../features/EvidenceGallery';
import BarcodeScanner from '../features/BarcodeScanner';
import { 
  cacheTasks, 
  getCachedTasks, 
  cacheReports, 
  getCachedReports, 
  enqueueSync, 
  getSyncQueue, 
  removeSyncItem 
} from '../../lib/syncQueue';

// Haversine formula to calculate distance in meters
function getDistanceInMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3; // metres
  const φ1 = lat1 * Math.PI/180; // φ, λ in radians
  const φ2 = lat2 * Math.PI/180;
  const Δφ = (lat2-lat1) * Math.PI/180;
  const Δλ = (lon2-lon1) * Math.PI/180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c; // in metres
}

export default function FieldStaffDashboard() {
  const { getToken, profile } = useAuth();
  const { success: showSuccessToast, error: showErrorToast } = useToast();
  
  const [tasks, setTasks] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTask, setActiveTask] = useState<any | null>(null);
  const [notes, setNotes] = useState('');
  
  // Advanced filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  
  // Task detail modal state
  const [selectedDetailTask, setSelectedDetailTask] = useState<any | null>(null);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  
  const [checkingInTaskId, setCheckingInTaskId] = useState<string | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [currentLocation, setCurrentLocation] = useState<{lat: number, lng: number} | null>(null);
  
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    const handleOnline = () => { setIsOffline(false); fetchData(); };
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
       window.removeEventListener('online', handleOnline);
       window.removeEventListener('offline', handleOffline);
    }
  }, []);

  const fetchData = async () => {
    try {
      const token = await getToken();
      
      if (navigator.onLine) {
         setSyncing(true);
         const queue = await getSyncQueue();
         for (const item of queue) {
            if (item.type === 'SUBMIT_OFFLINE_REPORT') {
               const { taskId, reportType, notes, gpsLat, gpsLng, status } = item.payload;
               try {
                 const postRes = await fetch('/api/v1/reports', {
                   method: 'POST',
                   headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                   body: JSON.stringify({ taskId, reportType, gpsLat, gpsLng })
                 });
                 if (postRes.ok) {
                   const created = await postRes.json();
                   await fetch(`/api/v1/reports/${created.id}/status`, {
                     method: 'PATCH',
                     headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                     body: JSON.stringify({ status, notes, gpsLat, gpsLng })
                   });
                   await removeSyncItem(item.id!);
                 }
               } catch(e) {
                 break;
               }
            }
         }
         setSyncing(false);
      }

      if (navigator.onLine) {
         const [tRes, rRes] = await Promise.all([
           fetch('/api/v1/tasks', { headers: { Authorization: `Bearer ${token}` } }),
           fetch('/api/v1/reports', { headers: { Authorization: `Bearer ${token}` } })
         ]);
         if (tRes.ok && rRes.ok) {
            const tasksData = await tRes.json();
            const reportsData = await rRes.json();
            setTasks(tasksData);
            setReports(reportsData);
            await cacheTasks(tasksData);
            await cacheReports(reportsData);
            setIsOffline(false);
         } else {
            throw new Error('API request failed');
         }
      } else {
         throw new Error('Offline');
      }
    } catch (e) {
      console.log('Falling back to offline cache', e);
      setIsOffline(true);
      setTasks(await getCachedTasks());
      setReports(await getCachedReports());
      setSyncing(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleExecuteTask = async (task: any) => {
    setLocationError(null);
    setCheckingInTaskId(task.id);
    
    if (!navigator.geolocation) {
       setLocationError('Geolocation is not supported by your browser.');
       setCheckingInTaskId(null);
       return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setCurrentLocation({ lat: latitude, lng: longitude });
        
        if (task.targetLocationLat && task.targetLocationLng) {
          const distance = getDistanceInMeters(latitude, longitude, parseFloat(task.targetLocationLat), parseFloat(task.targetLocationLng));
          if (distance > 50) {
            setLocationError(`You are too far from the target location (${Math.round(distance)}m away). Must be within 50m to check in.`);
            setCheckingInTaskId(null);
            return;
          }
        }
        
        // Geolocation checks passed. Initialize draft report if not present
        const draftReport = reports.find(r => r.taskId === task.id && r.status === 'DRAFT');
        if (!draftReport) {
          if (navigator.onLine && !isOffline) {
            try {
              const token = await getToken();
              const res = await fetch('/api/v1/reports', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ 
                  taskId: task.id, 
                  reportType: task.taskType || 'FIELD_VISIT',
                  gpsLat: latitude,
                  gpsLng: longitude
                })
              });
              if (res.ok) {
                await fetchData();
              } else {
                throw new Error('Failed to create online draft');
              }
            } catch(e) {
               console.log('Failed to create draft online, falling back to offline draft', e);
               const localDraft = {
                 id: `offline_${task.id}`,
                 taskId: task.id,
                 status: 'DRAFT',
                 reportType: task.taskType || 'FIELD_VISIT',
                 gpsLat: latitude,
                 gpsLng: longitude,
                 notes: '',
                 isOffline: true
               };
               const newReports = [...reports, localDraft];
               setReports(newReports);
               await cacheReports(newReports);
            }
          } else {
             const localDraft = {
               id: `offline_${task.id}`,
               taskId: task.id,
               status: 'DRAFT',
               reportType: task.taskType || 'FIELD_VISIT',
               gpsLat: latitude,
               gpsLng: longitude,
               notes: '',
               isOffline: true
             };
             const newReports = [...reports, localDraft];
             setReports(newReports);
             await cacheReports(newReports);
          }
        }
        
        setCheckingInTaskId(null);
        setActiveTask(task);
        showSuccessToast(`Successfully checked in! Executing "${task.title}"`);
      },
      (error) => {
        setLocationError(`Error getting location: ${error.message}`);
        setCheckingInTaskId(null);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
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
          timelineNote: noteText || `Task transitioned to ${targetStatus}`
        })
      });

      if (res.ok) {
        showSuccessToast(`Task status updated to ${targetStatus}`);
        const updatedTask = await res.json();
        
        // Update list
        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...updatedTask } : t));
        
        // Update active or selected detail task
        if (selectedDetailTask && selectedDetailTask.id === taskId) {
          setSelectedDetailTask(updatedTask);
        }
        if (activeTask && activeTask.id === taskId) {
          setActiveTask(updatedTask);
        }
        
        fetchData();
      } else {
        const err = await res.json();
        showErrorToast(err.error || 'Failed to update task status');
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
        setTasks(prev => prev.map(t => t.id === updated.id ? { ...t, ...updated } : t));
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

  // Filters logic
  const filteredTasks = tasks.filter(t => {
    const matchesSearch = searchQuery ? (
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase())
    ) : true;
    
    const matchesStatus = statusFilter === 'ALL' ? true : t.extendedStatus === statusFilter;
    const matchesPriority = priorityFilter === 'ALL' ? true : t.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const pendingTasks = filteredTasks.filter(t => t.status === 'PENDING' || t.status === 'IN_PROGRESS');
  const rejectedReports = reports.filter(r => r.status === 'REJECTED');

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case 'Draft':
        return 'bg-slate-100 text-slate-700 border-slate-200';
      case 'Assigned':
        return 'bg-blue-50 text-blue-700 border-blue-100';
      case 'Accepted':
        return 'bg-indigo-50 text-indigo-700 border-indigo-100';
      case 'In Progress':
        return 'bg-amber-50 text-amber-700 border-amber-100 animate-pulse';
      case 'Awaiting Review':
        return 'bg-purple-50 text-purple-700 border-purple-100';
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

  if (activeTask) {
    const draftReport = reports.find(r => r.taskId === activeTask.id && r.status === 'DRAFT');
    
    if (!draftReport) {
       return <div className="p-8 flex justify-center text-slate-400"><RefreshCw className="w-8 h-8 animate-spin" /></div>;
    }

    return (
      <div className="flex flex-col h-full bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden animate-fadeIn">
        <div className="bg-white p-4 border-b border-slate-200 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-4">
             <button onClick={() => setActiveTask(null)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500">
               <ChevronLeft className="w-5 h-5" />
             </button>
             <div>
               <h2 className="font-bold text-lg text-slate-800">Execute: {activeTask.title}</h2>
               {currentLocation && (
                 <p className="text-xs text-emerald-600 flex items-center gap-1">
                   <MapPin className="w-3 h-3" /> Location verified
                 </p>
               )}
             </div>
          </div>
          
          <div className="flex items-center gap-3">
             {isOffline && <span className="text-xs font-bold text-amber-600 flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-md"><WifiOff className="w-3 h-3" /> OFFLINE</span>}
             <button onClick={async () => {
                  const submit = async () => {
                    if (draftReport.isOffline || isOffline || !navigator.onLine) {
                       const finalReport = { ...draftReport, status: 'PENDING_REVIEW', notes };
                       const newReports = reports.map(r => r.id === draftReport.id ? finalReport : r);
                       setReports(newReports);
                       await cacheReports(newReports);
                       
                       await enqueueSync('SUBMIT_OFFLINE_REPORT', {
                          taskId: activeTask.id,
                          reportType: draftReport.reportType,
                          notes,
                          gpsLat: draftReport.gpsLat,
                          gpsLng: draftReport.gpsLng,
                          status: 'PENDING_REVIEW'
                       });
                       setActiveTask(null);
                       return;
                    }
                    
                    try {
                      const token = await getToken();
                      await fetch(`/api/v1/reports/${draftReport.id}/status`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                        body: JSON.stringify({ 
                          status: 'PENDING_REVIEW', 
                          notes,
                          gpsLat: currentLocation?.lat,
                          gpsLng: currentLocation?.lng
                        })
                      });
                      
                      // Explicitly change task status to 'Awaiting Review'
                      await handleTransitionTask(activeTask.id, 'Awaiting Review', undefined, 'Report submitted for approval review');
                      
                      setActiveTask(null);
                      fetchData();
                    } catch(e) {
                       console.error('Submit failed', e);
                    }
                  };
                  await submit();
              }} className="bg-slate-900 text-white px-6 py-2 rounded-lg text-sm font-bold hover:bg-slate-800 flex items-center gap-2 cursor-pointer shadow">
               <Save className="w-4 h-4" /> SUBMIT WORK FOR REVIEW
             </button>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 space-y-6 flex flex-col md:flex-row gap-6">
            <div className="flex-1 space-y-6">
              <div className="bg-white p-5 rounded-xl border border-slate-200">
                <h3 className="font-bold text-slate-800 mb-2">Field Notes</h3>
                {activeTask.taskType === 'STOCK_AUDIT' && (
                  <div className="mb-4">
                    <BarcodeScanner onResult={async (result) => {
                       const newNotes = notes + (notes ? '\n' : '') + `Scanned SKU: ${result}`;
                       setNotes(newNotes);
                       if (draftReport.isOffline || isOffline || !navigator.onLine) {
                          const newReports = reports.map(r => r.id === draftReport.id ? { ...r, notes: newNotes } : r);
                          setReports(newReports);
                          await cacheReports(newReports);
                          return;
                       }
                       try {
                          const token = await getToken();
                          await fetch(`/api/v1/reports/${draftReport.id}/status`, {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                            body: JSON.stringify({ notes: newNotes })
                          });
                       } catch(e) {
                          console.error('Save notes failed', e);
                       }
                    }} />
                  </div>
                )}
                <textarea 
                   value={notes}
                   onChange={(e) => setNotes(e.target.value)}
                   className="w-full h-32 p-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 text-sm"
                   placeholder="Enter details of your visit or audit here..."
                   onBlur={async () => {
                      if (draftReport.isOffline || isOffline || !navigator.onLine) {
                         const newReports = reports.map(r => r.id === draftReport.id ? { ...r, notes } : r);
                         setReports(newReports);
                         await cacheReports(newReports);
                         return;
                      }
                      try {
                         const token = await getToken();
                         await fetch(`/api/v1/reports/${draftReport.id}/status`, {
                           method: 'PATCH',
                           headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                           body: JSON.stringify({ notes })
                         });
                      } catch(e) {
                         console.error('Save notes failed', e);
                      }
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
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:h-full md:min-h-0 h-auto">
      
      {/* Left Column - Tasks Management Panel */}
      <div className="md:col-span-8 flex flex-col gap-4 md:min-h-0 md:h-full h-auto overflow-visible md:overflow-hidden">
        {locationError && (
          <div className="bg-red-50 border border-red-200 p-4 rounded-xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold text-red-800">Location Verification Failed</h4>
              <p className="text-xs text-red-700 mt-1">{locationError}</p>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl border border-slate-200 flex-1 flex flex-col md:overflow-hidden overflow-visible shadow-sm">
          {/* Header Controls */}
          <div className="p-5 border-b border-slate-100 bg-slate-50 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 shrink-0">
            <div>
              <h3 className="font-bold text-slate-800 flex items-center gap-2 text-base">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                Assigned Tasks Domain
              </h3>
              <p className="text-xs text-slate-500">Track and report assigned retail operations tasks.</p>
            </div>
            
            <div className="flex items-center gap-3">
               {syncing && <span className="text-xs font-bold text-emerald-600 flex items-center gap-1"><RefreshCw className="w-3 h-3 animate-spin" /> SYNCING...</span>}
               {isOffline && <span className="text-xs font-bold text-amber-600 flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-md"><WifiOff className="w-3 h-3" /> OFFLINE MODE</span>}
               <span className="text-xs bg-slate-200 text-slate-700 font-bold px-3 py-1 rounded-full">{pendingTasks.length} Visible</span>
            </div>
          </div>

          {/* Filtering Rail */}
          <div className="px-5 py-3 border-b border-slate-100 flex flex-wrap items-center gap-3 bg-white shrink-0">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input 
                type="text" 
                placeholder="Search tasks..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full text-xs border border-slate-200 rounded-lg pl-9 pr-3 py-2 outline-none focus:ring-2 focus:ring-slate-950 text-slate-800"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="text-xs border border-slate-200 rounded-lg px-2.5 py-2 outline-none text-slate-700"
            >
              <option value="ALL">All Statuses</option>
              <option value="Assigned">Assigned</option>
              <option value="Accepted">Accepted</option>
              <option value="In Progress">In Progress</option>
              <option value="Awaiting Review">Awaiting Review</option>
              <option value="Revision Requested">Revision Requested</option>
              <option value="Approved">Approved</option>
              <option value="Completed">Completed</option>
            </select>

            {/* Priority Filter */}
            <select
              value={priorityFilter}
              onChange={e => setPriorityFilter(e.target.value)}
              className="text-xs border border-slate-200 rounded-lg px-2.5 py-2 outline-none text-slate-700"
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
            {pendingTasks.map(t => (
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
                      <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-md border ${getStatusBadgeStyle(t.extendedStatus)}`}>
                        {t.extendedStatus}
                      </span>
                    </div>
                    <h4 className="font-extrabold text-slate-900 text-base leading-tight group-hover:text-indigo-600 transition">{t.title}</h4>
                    <p className="text-xs text-slate-600 font-medium line-clamp-2">{t.description}</p>
                  </div>
                  
                  <span className={`text-[10px] uppercase font-bold px-2.5 py-1 rounded-md border ${
                    t.priority === 'CRITICAL' ? 'bg-red-50 text-red-700 border-red-100' :
                    t.priority === 'HIGH' ? 'bg-orange-50 text-orange-700 border-orange-100' :
                    t.priority === 'MEDIUM' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                    'bg-slate-50 text-slate-700 border-slate-200'
                  }`}>
                    {t.priority}
                  </span>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-slate-100">
                  <div className="flex items-center gap-4 text-xs font-semibold text-slate-500">
                    <div className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-slate-400" /> Due: {new Date(t.dueDate).toLocaleDateString()}</div>
                    {t.targetLocationLat && <div className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-emerald-500" /> Target Set</div>}
                    {t.comments && t.comments.length > 0 && (
                      <div className="flex items-center gap-1.5"><MessageSquare className="w-3.5 h-3.5 text-indigo-400" /> {t.comments.length} Discussion</div>
                    )}
                  </div>
                  
                  {/* Transition actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedDetailTask(t)}
                      className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg text-xs font-extrabold flex items-center gap-1 cursor-pointer transition border border-slate-200"
                    >
                      <Eye className="w-3.5 h-3.5" /> DETAILS & TIMELINE
                    </button>
                    
                    {t.extendedStatus === 'Assigned' && (
                      <button 
                        onClick={() => handleTransitionTask(t.id, 'Accepted', undefined, 'Employee accepted task')}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold px-4 py-1.5 rounded-lg transition flex items-center gap-1.5 cursor-pointer shadow-sm shadow-indigo-600/10"
                      >
                        ACCEPT TASK <ArrowRight className="w-3 h-3" />
                      </button>
                    )}

                    {t.extendedStatus === 'Accepted' && (
                      <button 
                        onClick={() => handleTransitionTask(t.id, 'In Progress', undefined, 'Employee started work')}
                        className="bg-amber-500 hover:bg-amber-600 text-white text-xs font-extrabold px-4 py-1.5 rounded-lg transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                      >
                        START WORK <ArrowRight className="w-3 h-3" />
                      </button>
                    )}

                    {(t.extendedStatus === 'In Progress' || t.extendedStatus === 'Revision Requested') && (
                      <button 
                        onClick={() => handleExecuteTask(t)} 
                        disabled={checkingInTaskId === t.id}
                        className="bg-slate-900 hover:bg-slate-850 text-white text-xs font-extrabold px-4 py-1.5 rounded-lg transition disabled:opacity-50 flex items-center gap-1.5 cursor-pointer shadow-sm"
                      >
                        {checkingInTaskId === t.id ? (
                          <><RefreshCw className="w-3 h-3 animate-spin" /> CHECKING IN...</>
                        ) : (
                          'EXECUTE & UPLOAD'
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            {pendingTasks.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 py-16">
                <CheckCircle2 className="w-12 h-12 mb-3 text-slate-200" />
                <p className="font-bold text-sm">No tasks matched your filter criteria.</p>
                <p className="text-xs text-slate-400 mt-1">Try resetting your queries or filters.</p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Right Column - Status & Revisions */}
      <div className="md:col-span-4 flex flex-col gap-6 md:min-h-0 md:h-full h-auto overflow-visible md:overflow-hidden">
        
        {/* Revisions Needed Panel */}
        <div className="bg-white rounded-2xl border border-red-200 shadow-sm flex flex-col shrink-0 overflow-hidden">
          <div className="p-4 border-b border-red-100 bg-red-50/70 rounded-t-2xl flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 animate-bounce" />
            <h3 className="font-black text-red-900 text-sm">Action Required ({rejectedReports.length})</h3>
          </div>
          <div className="p-4 space-y-3 max-h-64 overflow-y-auto">
            {rejectedReports.map(r => (
              <div key={r.id} className="p-3 bg-white border border-red-100 rounded-xl hover:border-red-200 shadow-xs">
                <p className="text-xs font-bold text-slate-800">{r.task?.title || 'Report'}</p>
                {r.notes && <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">Your Notes: "{r.notes}"</p>}
                <div className="bg-red-50 p-2.5 rounded-lg border border-red-100 mt-2">
                  <span className="text-[9px] font-bold text-red-500 uppercase">Supervisor Revision Feedback</span>
                  <p className="text-[11px] text-red-700 font-medium italic mt-0.5">"{r.reviewComments || 'Please review your uploaded evidence and notes, then submit updates.'}"</p>
                </div>
                <button 
                  onClick={() => {
                    const matchedTask = tasks.find(t => t.id === r.taskId);
                    if (matchedTask) {
                      setActiveTask(matchedTask);
                    } else {
                      setActiveTask({
                        id: r.taskId,
                        title: r.task?.title || 'Revision Task',
                        taskType: r.reportType,
                        priority: 'HIGH',
                        dueDate: new Date().toISOString()
                      });
                    }
                  }}
                  className="mt-2.5 text-[10px] font-black text-red-600 hover:text-red-800 transition uppercase tracking-wider flex items-center gap-1 cursor-pointer"
                >
                  REVISE NOW &rarr;
                </button>
              </div>
            ))}
            {rejectedReports.length === 0 && <p className="text-xs text-slate-500 text-center py-4">No pending revisions</p>}
          </div>
        </div>

        {/* Recently Submitted Feed */}
        <div className="bg-slate-900 rounded-2xl border border-slate-800 flex-1 flex flex-col overflow-hidden text-white shadow-lg">
          <div className="p-4 border-b border-slate-800 shrink-0 bg-slate-950 flex justify-between items-center">
            <h3 className="font-extrabold text-white text-sm flex items-center gap-2">
              <History className="w-4 h-4 text-slate-400" />
              Submission History
            </h3>
            <span className="text-[10px] bg-slate-800 text-slate-300 font-black px-2 py-0.5 rounded-md">LOGS</span>
          </div>
          
          <div className="p-4 overflow-y-auto flex-1 space-y-4">
             {reports.filter(r => r.status !== 'REJECTED' && r.status !== 'DRAFT').slice(0, 10).map(r => (
               <div key={r.id} className="flex items-start justify-between gap-3 border-b border-slate-800/60 pb-3 last:border-0 last:pb-0">
                 <div className="space-y-0.5">
                   <p className="text-xs font-bold text-slate-200 line-clamp-1">{r.task?.title || 'Report'}</p>
                   <p className="text-[10px] text-slate-500 font-medium">{new Date(r.submittedAt || Date.now()).toLocaleString()}</p>
                 </div>
                 <span className={`text-[9px] font-black px-2.5 py-1 rounded-md uppercase tracking-wide shrink-0 ${
                   r.status === 'APPROVED' ? 'bg-emerald-900/40 text-emerald-400 border border-emerald-800/40' : 
                   r.status === 'PENDING_REVIEW' ? 'bg-purple-900/40 text-purple-400 border border-purple-850/40' :
                   'bg-amber-900/40 text-amber-400 border border-amber-800/40'
                 }`}>
                   {r.status === 'PENDING_REVIEW' ? 'Awaiting Rev' : r.status}
                 </span>
               </div>
             ))}
             {reports.filter(r => r.status !== 'REJECTED' && r.status !== 'DRAFT').length === 0 && (
                <p className="text-xs text-slate-500 text-center py-8 italic">No submissions made yet.</p>
             )}
          </div>
        </div>

      </div>

      {/* Task Discussion & Timeline Modal */}
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
              </div>
              <button 
                type="button"
                onClick={() => setSelectedDetailTask(null)} 
                className="text-slate-400 hover:text-white transition text-2xl font-black leading-none p-1"
              >
                &times;
              </button>
            </div>
            
            {/* Body Tabs / Scrollable areas */}
            <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-12 gap-6 min-h-0">
              {/* Left Panel: Description and Timeline */}
              <div className="md:col-span-7 space-y-5">
                <div>
                  <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                    <Clipboard className="w-3.5 h-3.5 text-slate-400" />
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
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Verification Location</span>
                    <span className="text-xs font-black text-emerald-600">
                      {selectedDetailTask.targetLocationLat ? '50m GPS Verified' : 'None Required'}
                    </span>
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
                          idx === selectedDetailTask.timeline.length - 1 ? 'border-indigo-600 ring-2 ring-indigo-100 animate-pulse' : 'border-slate-350'
                        }`}>
                          <div className={`w-1 h-1 rounded-full ${idx === selectedDetailTask.timeline.length - 1 ? 'bg-indigo-600' : 'bg-slate-400'}`}></div>
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
              <div className="md:col-span-5 flex flex-col min-h-0 border-t md:border-t-0 md:border-l border-slate-100 md:pl-5 pt-4 md:pt-0">
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
                      <p className="text-[11px] font-bold">No discussion on this task yet.</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Post a message below to coordinate.</p>
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
                    placeholder="Ask a question or post update..."
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
              
              {/* Task Cards actions integrated inside details too */}
              {selectedDetailTask.extendedStatus === 'Assigned' && (
                <button 
                  onClick={() => handleTransitionTask(selectedDetailTask.id, 'Accepted', undefined, 'Employee accepted task')}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold px-5 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  ACCEPT TASK
                </button>
              )}

              {selectedDetailTask.extendedStatus === 'Accepted' && (
                <button 
                  onClick={() => handleTransitionTask(selectedDetailTask.id, 'In Progress', undefined, 'Employee started work')}
                  className="bg-amber-500 hover:bg-amber-600 text-white text-xs font-extrabold px-5 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  START WORK
                </button>
              )}

              {(selectedDetailTask.extendedStatus === 'In Progress' || selectedDetailTask.extendedStatus === 'Revision Requested') && (
                <button 
                  onClick={() => {
                    const task = selectedDetailTask;
                    setSelectedDetailTask(null);
                    handleExecuteTask(task);
                  }}
                  className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-extrabold px-5 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  EXECUTE & UPLOAD
                </button>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
