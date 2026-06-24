import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { Map, MapPin, Search } from 'lucide-react';

export default function GPSCommandCenter() {
  const { getToken } = useAuth();
  const [evidenceList, setEvidenceList] = useState<any[]>([]);

  useEffect(() => {
    fetchMedia();
  }, []);

  const fetchMedia = async () => {
    try {
      const token = await getToken();
      const res = await fetch('/api/v1/governance/media', {
         headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
         setEvidenceList(await res.json());
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto h-[calc(100vh-8rem)] flex flex-col">
       <div className="shrink-0 flex justify-between items-center">
         <div>
           <h2 className="text-2xl font-black text-slate-800">GPS & Geofence Command Center</h2>
           <p className="text-slate-500">Live monitoring of spatial intelligence and geographic task compliance.</p>
         </div>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1 min-h-0">
          <div className="md:col-span-2 bg-slate-100 rounded-xl border border-slate-200 overflow-hidden relative flex flex-col items-center justify-center">
             <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#94a3b8 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
             <Map className="w-16 h-16 text-slate-300 mb-4 z-10" />
             <div className="bg-white/90 backdrop-blur px-4 py-2 rounded shadow-sm z-10 text-sm font-bold text-slate-600">
               Live Geographic Information System (Simulation)
             </div>
             
             {/* Mock mapping points */}
             <div className="absolute top-1/3 left-1/4">
               <span className="relative flex h-3 w-3">
                 <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
                 <span className="relative inline-flex rounded-full h-3 w-3 bg-pink-500"></span>
               </span>
             </div>
             <div className="absolute top-1/2 right-1/3">
               <span className="relative flex h-3 w-3">
                 <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                 <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
               </span>
             </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
             <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-bold text-slate-800">Geofence Violations & Variance</h3>
             </div>
             <div className="p-3 border-b border-slate-100 bg-slate-50">
               <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-slate-200">
                  <Search className="w-4 h-4 text-slate-400" />
                  <input type="text" placeholder="Filter by region or agent..." className="bg-transparent text-sm w-full outline-none" />
               </div>
             </div>
             <div className="flex-1 overflow-y-auto">
                <div className="divide-y divide-slate-100">
                   {evidenceList.map((item, idx) => (
                     <div key={idx} className="p-4 hover:bg-slate-50 transition">
                       <div className="flex justify-between items-start mb-2">
                         <div className="font-bold text-sm text-slate-800 truncate pr-2">Evidence #{item.id.substring(0,6).toUpperCase()}</div>
                         <span className={`text-[10px] font-bold px-2 py-0.5 rounded-sm uppercase ${
                           item.outsideGeofence ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                         }`}>
                           {item.outsideGeofence ? 'OUTSIDE GEOFENCE' : 'VERIFIED LOC'}
                         </span>
                       </div>
                       
                       <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <div className="text-slate-400 font-bold uppercase tracking-widest text-[9px] mb-0.5">Assigned Loc</div>
                            <div className="flex items-center gap-1 text-slate-600"><MapPin className="w-3 h-3"/> Task Destination</div>
                          </div>
                          <div>
                            <div className="text-slate-400 font-bold uppercase tracking-widest text-[9px] mb-0.5">Submit Loc</div>
                            <div className="flex items-center gap-1 text-slate-600 font-mono"><MapPin className="w-3 h-3"/> {item.capturedLat ? `${item.capturedLat?.toFixed(2)}, ${item.capturedLng?.toFixed(2)}` : 'UNKNOWN'}</div>
                          </div>
                          <div className="col-span-2 mt-1">
                             <div className="text-slate-400 font-bold uppercase tracking-widest text-[9px] mb-0.5">Variance</div>
                             <div className="text-slate-800 font-medium">{item.outsideGeofence ? '> 50m variance detected' : '< 50m (Within tolerance)'}</div>
                          </div>
                       </div>
                     </div>
                   ))}
                   {evidenceList.length === 0 && (
                     <div className="p-6 text-center text-slate-400 text-sm">No GPS logs available.</div>
                   )}
                </div>
             </div>
          </div>
       </div>
    </div>
  );
}
