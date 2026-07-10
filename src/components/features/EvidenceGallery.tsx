import React, { useState } from 'react';
import { Camera, MapPin, AlertTriangle, CheckCircle, Video, FileText, BadgeInfo } from 'lucide-react';

interface Evidence {
  id: string;
  reportId?: string;
  mediaUrl: string;
  thumbnailUrl?: string;
  mediaType: string;
  fraudFlag: boolean;
  fraudReason?: string;
  verificationStatus: string;
  capturedAt: string;
  capturedLat?: number;
  capturedLng?: number;
}

interface EvidenceGalleryProps {
  evidenceList: Evidence[];
  isSupervisor?: boolean;
  onRefresh?: () => void;
}

export default function EvidenceGallery({ evidenceList, isSupervisor = false, onRefresh }: EvidenceGalleryProps) {
  const [selectedItem, setSelectedItem] = useState<Evidence | null>(null);
  const [processing, setProcessing] = useState(false);

  const handleVerify = async (status: string) => {
    if (!selectedItem) return;
    setProcessing(true);
    try {
       // get token dynamically by triggering a custom event or passing getToken from prop, 
       // but here we can just assume API cookie/token or we use window.localStorage?
       // Since it depends on AuthContext, we need useAuth.
       // It's better to pass it as an action. Let's do it via Context since it's a child.
       // I'll grab getAuth from a quick window storage or we can't...
       // Wait, `useAuth` is exposed. Let's import it.
       const { getAuth } = await import('firebase/auth');
       const auth = getAuth();
       const token = await auth.currentUser?.getIdToken();

       const reportId = selectedItem.reportId || 'unknown';
       const res = await fetch(`/api/v1/reports/${reportId}/evidence/${selectedItem.id}/verify`, {
         method: 'PATCH',
         headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
         body: JSON.stringify({ verificationStatus: status })
       });
       
       if (res.ok) {
         setSelectedItem({ ...selectedItem, verificationStatus: status });
         onRefresh?.();
       }
    } catch (e) {
       console.error(e);
    } finally {
       setProcessing(false);
    }
  };

  if (!evidenceList || evidenceList.length === 0) {
    return (
      <div className="bg-slate-50 border border-slate-200 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-slate-400">
        <Camera className="w-8 h-8 mb-2 opacity-50" />
        <p className="font-medium text-sm">No evidence attached yet</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
        <h3 className="font-bold text-slate-800 flex items-center gap-2">
          <Camera className="w-5 h-5 text-slate-500" />
          Attached Evidence ({evidenceList.length})
        </h3>
      </div>
      
      <div className="p-5 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {evidenceList.map((item) => (
          <div 
            key={item.id} 
            className={`relative group rounded-xl overflow-hidden cursor-pointer border-2 transition ${item.fraudFlag ? 'border-red-400 shadow-[0_0_10px_rgba(248,113,113,0.3)]' : 'border-slate-200 hover:border-slate-400'}`}
            onClick={() => setSelectedItem(item)}
          >
            <div className="aspect-square bg-slate-100 flex items-center justify-center relative">
              {item.mediaType === 'PHOTO' && (
                <img src={item.thumbnailUrl || item.mediaUrl} alt="Evidence" className="w-full h-full object-cover" />
              )}
              {item.mediaType === 'VIDEO' && (
                <div className="w-full h-full flex flex-col items-center justify-center bg-slate-800 text-white">
                  <Video className="w-8 h-8 mb-2" />
                  <span className="text-[10px] font-bold tracking-widest">VIDEO</span>
                </div>
              )}
              {item.mediaType === 'DOCUMENT' && (
                <div className="w-full h-full flex flex-col items-center justify-center bg-slate-200 text-slate-500">
                  <FileText className="w-8 h-8 mb-2" />
                  <span className="text-[10px] font-bold tracking-widest">DOCUMENT</span>
                </div>
              )}

              {/* Status Badges */}
              <div className="absolute top-2 right-2 flex gap-1">
                {item.fraudFlag && (
                  <div className="bg-red-500 text-white p-1 rounded-full shadow-md tooltip-trigger" title="Fraud Flag Detected">
                    <AlertTriangle className="w-3.5 h-3.5" />
                  </div>
                )}
                {item.verificationStatus === 'VERIFIED' && (
                  <div className="bg-emerald-500 text-white p-1 rounded-full shadow-md">
                    <CheckCircle className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
            </div>

            <div className="p-2 bg-white">
              <p className="text-[10px] text-slate-500 font-medium truncate">
                {new Date(item.capturedAt).toLocaleString()}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox / Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/90 flex flex-col items-center justify-center p-4 sm:p-8 backdrop-blur-sm" onClick={() => setSelectedItem(null)}>
          <div className="max-w-4xl w-full bg-white rounded-2xl overflow-hidden flex flex-col md:flex-row shadow-2xl" onClick={e => e.stopPropagation()}>
            
            {/* Main Media Area */}
            <div className="flex-1 bg-black flex items-center justify-center min-h-[300px] md:min-h-[500px]">
              {selectedItem.mediaType === 'PHOTO' && (
                 <img src={selectedItem.mediaUrl} className="max-w-full max-h-[80vh] object-contain" />
              )}
              {selectedItem.mediaType === 'VIDEO' && (
                 <video src={selectedItem.mediaUrl} controls className="max-w-full max-h-[80vh]"></video>
              )}
              {selectedItem.mediaType === 'DOCUMENT' && (
                 <iframe src={selectedItem.mediaUrl} className="w-full h-[80vh] bg-white"></iframe>
              )}
            </div>

            {/* Sidebar Metadata Area */}
            <div className="w-full md:w-80 bg-slate-50 border-l border-slate-200 p-6 flex flex-col overflow-y-auto">
              <h3 className="font-bold text-slate-800 text-lg mb-6">Evidence Details</h3>
              
              <div className="space-y-5 flex-1">
                 <div>
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Captured At</p>
                   <p className="text-sm font-medium text-slate-800">{new Date(selectedItem.capturedAt).toLocaleString()}</p>
                 </div>

                 {selectedItem.capturedLat && selectedItem.capturedLng && (
                   <div>
                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">GPS Location</p>
                     <div className="flex items-start gap-2 bg-slate-100 p-2 rounded border border-slate-200">
                       <MapPin className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" />
                       <p className="text-xs font-mono text-slate-700">{selectedItem.capturedLat}, {selectedItem.capturedLng}</p>
                     </div>
                   </div>
                 )}

                 {selectedItem.fraudFlag && (
                   <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                     <p className="text-xs font-bold text-red-800 uppercase tracking-widest mb-1 flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5" /> Integrity Warning</p>
                     <p className="text-xs text-red-600 mt-2">{selectedItem.fraudReason || 'Suspicious activity detected.'}</p>
                   </div>
                 )}
                 
                 <div>
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Status</p>
                   <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase ${
                     selectedItem.verificationStatus === 'VERIFIED' ? 'bg-emerald-100 text-emerald-700' :
                     selectedItem.verificationStatus === 'FLAGGED' ? 'bg-amber-100 text-amber-700' :
                     selectedItem.verificationStatus === 'REJECTED' ? 'bg-red-100 text-red-700' :
                     'bg-slate-200 text-slate-700'
                   }`}>
                     {selectedItem.verificationStatus}
                   </span>
                 </div>
              </div>

              {isSupervisor && selectedItem.verificationStatus === 'PENDING' && (
                <div className="pt-6 border-t border-slate-200 mt-6 flex gap-2">
                   <button disabled={processing} onClick={() => handleVerify('REJECTED')} className="flex-1 bg-white border border-slate-300 text-slate-700 text-xs font-bold py-2.5 rounded-lg hover:bg-slate-50 disabled:opacity-50">REJECT</button>
                   <button disabled={processing} onClick={() => handleVerify('VERIFIED')} className="flex-1 bg-emerald-600 text-white text-xs font-bold py-2.5 rounded-lg hover:bg-emerald-700 disabled:opacity-50">VERIFY</button>
                </div>
              )}
              {isSupervisor && selectedItem.verificationStatus === 'FLAGGED' && (
                <div className="pt-6 border-t border-slate-200 mt-6 flex flex-col gap-2">
                   <p className="text-[10px] font-bold text-amber-600 mb-1 text-center">Requires override decision</p>
                   <button disabled={processing} onClick={() => handleVerify('REJECTED')} className="w-full bg-red-600 text-white text-xs font-bold py-2.5 rounded-lg hover:bg-red-700 disabled:opacity-50">CONFIRM FRAUD</button>
                   <button disabled={processing} onClick={() => handleVerify('VERIFIED')} className="w-full bg-slate-900 text-white text-xs font-bold py-2.5 rounded-lg hover:bg-slate-800 disabled:opacity-50">OVERRIDE & ACCEPT</button>
                </div>
              )}
              
              <div className="mt-4 flex gap-2">
                <a 
                  href={selectedItem.mediaUrl} 
                  download={`evidence-${selectedItem.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-1/2 bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center gap-2 text-xs font-bold py-2.5 rounded-lg hover:bg-blue-100 transition"
                >
                  <FileText className="w-4 h-4" /> DOWNLOAD
                </a>
                <button onClick={() => setSelectedItem(null)} className="w-1/2 bg-slate-200 text-slate-700 text-xs font-bold py-2.5 rounded-lg hover:bg-slate-300 transition">
                  CLOSE
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
