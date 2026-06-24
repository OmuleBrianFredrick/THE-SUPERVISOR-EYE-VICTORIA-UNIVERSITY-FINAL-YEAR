import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { AlertTriangle, MapPin, Eye, FileWarning } from 'lucide-react';
import EvidenceGallery from '../../../components/features/EvidenceGallery';

export default function ExecutiveEvidenceReview() {
  const { getToken } = useAuth();
  const [evidenceList, setEvidenceList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMedia();
  }, []);

  const fetchMedia = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const res = await fetch('/api/v1/governance/media', {
         headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
         const all = await res.json();
         // Filter for high-risk, flagged, geofence violations, fraud alerts
         const highRisk = all.filter((e: any) => e.fraudFlag || e.outsideGeofence || e.verificationStatus === 'FLAGGED' || e.verificationStatus === 'REJECTED');
         setEvidenceList(highRisk);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto h-[calc(100vh-8rem)] flex flex-col">
       <div className="shrink-0">
         <h2 className="text-2xl font-black text-slate-800">Executive Evidence Review</h2>
         <p className="text-slate-500">Read-only oversight of high-risk operational anomalies and compliance flags.</p>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-3 gap-4 shrink-0">
          <div className="bg-red-50 p-4 rounded-xl border border-red-100 flex items-center gap-4">
             <div className="p-3 bg-red-100 text-red-600 rounded-lg"><AlertTriangle className="w-6 h-6" /></div>
             <div>
               <div className="text-2xl font-black text-red-700">{evidenceList.filter(e => e.fraudFlag).length}</div>
               <div className="text-xs font-bold text-red-600 uppercase tracking-wide">Fraud Alerts</div>
             </div>
          </div>
          <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 flex items-center gap-4">
             <div className="p-3 bg-amber-100 text-amber-600 rounded-lg"><MapPin className="w-6 h-6" /></div>
             <div>
               <div className="text-2xl font-black text-amber-700">{evidenceList.filter(e => e.outsideGeofence).length}</div>
               <div className="text-xs font-bold text-amber-600 uppercase tracking-wide">Geofence Violations</div>
             </div>
          </div>
          <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex items-center gap-4">
             <div className="p-3 bg-slate-700 text-slate-300 rounded-lg"><FileWarning className="w-6 h-6" /></div>
             <div>
               <div className="text-2xl font-black text-white">{evidenceList.filter(e => e.verificationStatus === 'REJECTED').length}</div>
               <div className="text-xs font-bold text-slate-400 uppercase tracking-wide">Rejected Submissions</div>
             </div>
          </div>
       </div>

       <div className="flex-1 min-h-0 overflow-y-auto">
          {loading ? (
             <div className="p-12 text-center text-slate-400">Loading anomalous records...</div>
          ) : (
             <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-2">
                <EvidenceGallery evidenceList={evidenceList} isSupervisor={false} />
             </div>
          )}
       </div>
    </div>
  );
}
