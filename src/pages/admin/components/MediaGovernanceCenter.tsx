import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import EvidenceGallery from '../../../components/features/EvidenceGallery';
import { RefreshCw } from 'lucide-react';

export default function MediaGovernanceCenter() {
  const { getToken } = useAuth();
  const [evidenceList, setEvidenceList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMedia = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const res = await fetch('/api/v1/governance/media', {
         headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setEvidenceList(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedia();
  }, []);

  return (
    <div className="space-y-6 max-w-6xl mx-auto h-[calc(100vh-8rem)] flex flex-col">
       <div className="shrink-0 flex justify-between items-center">
         <div>
           <h2 className="text-2xl font-black text-slate-800">Media Governance (EACC)</h2>
           <p className="text-slate-500">Enterprise root access to all captured organizational media.</p>
         </div>
         <button onClick={fetchMedia} disabled={loading} className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-500">
           <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
         </button>
       </div>

       <div className="flex-1 overflow-y-auto">
         {loading ? (
             <div className="flex justify-center p-12 text-slate-400"><RefreshCw className="w-8 h-8 animate-spin" /></div>
         ) : (
             <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <EvidenceGallery evidenceList={evidenceList} isSupervisor={true} onRefresh={fetchMedia} />
             </div>
         )}
       </div>
    </div>
  );
}
