import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { Target, ShieldCheck, Zap, Activity, Clock, HeartPulse, RefreshCw } from 'lucide-react';

export default function OrganizationalHealthCenter() {
  const { getToken } = useAuth();
  const [health, setHealth] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchHealth = async () => {
    try {
      const token = await getToken();
      const res = await fetch('/api/v1/intelligence/health', {
         headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setHealth(await res.json());
    } catch(e) { console.error(e); }
  };

  const simulate = async () => {
     setLoading(true);
     try {
       const token = await getToken();
       await fetch('/api/v1/intelligence/simulate-generation', { 
           method: 'POST',
           headers: { Authorization: `Bearer ${token}` }
       });
       await fetchHealth();
     } catch(e) {}
     setLoading(false);
  };

  useEffect(() => { fetchHealth(); }, []);

  if (!health) return <div className="text-slate-400 p-8">Loading intelligence data...</div>;

  return (
    <div className="space-y-6 max-w-6xl mx-auto h-[calc(100vh-8rem)] flex flex-col">
       <div className="shrink-0 flex justify-between items-center">
         <div>
           <h2 className="text-2xl font-black text-slate-800">Organizational Health Index (OHI)</h2>
           <p className="text-slate-500">Live AI computation of enterprise vitals across 5 strategic pillars.</p>
         </div>
         <button onClick={simulate} disabled={loading} className="bg-indigo-50 text-indigo-700 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-indigo-100">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Run AI Simulation Engine
         </button>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-3 gap-6 shrink-0">
          <div className="col-span-1 md:col-span-3 bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
             <div>
                <div className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-1">Global Health Index</div>
                <div className="text-5xl font-black text-slate-900">{health.healthScore || '--'} <span className="text-2xl text-slate-400">/ 100</span></div>
             </div>
             <div className="w-24 h-24 rounded-full bg-slate-50 border-8 border-indigo-500 flex items-center justify-center">
                <HeartPulse className="w-10 h-10 text-indigo-500" />
             </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
             <div className="flex items-center gap-2 mb-4">
                <div className="p-2 bg-emerald-100 rounded text-emerald-600"><ShieldCheck className="w-5 h-5" /></div>
                <div className="font-bold text-slate-800">Compliance Factor</div>
             </div>
             <div className="text-3xl font-black text-slate-900">{health.complianceScore || '--'}%</div>
             <div className="mt-2 text-xs font-bold text-slate-400">35% Weight</div>
          </div>
          
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
             <div className="flex items-center gap-2 mb-4">
                <div className="p-2 bg-blue-100 rounded text-blue-600"><Target className="w-5 h-5" /></div>
                <div className="font-bold text-slate-800">Productivity Factor</div>
             </div>
             <div className="text-3xl font-black text-slate-900">{health.productivityScore || '--'}%</div>
             <div className="mt-2 text-xs font-bold text-slate-400">25% Weight</div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
             <div className="flex items-center gap-2 mb-4">
                <div className="p-2 bg-rose-100 rounded text-rose-600"><Clock className="w-5 h-5" /></div>
                <div className="font-bold text-slate-800">SLA Adherence</div>
             </div>
             <div className="text-3xl font-black text-slate-900">{health.slaScore || '--'}%</div>
             <div className="mt-2 text-xs font-bold text-slate-400">15% Weight</div>
          </div>
       </div>

       <div className="flex-1 min-h-0 bg-slate-900 rounded-xl shadow-sm border border-slate-800 p-6 flex flex-col justify-center text-center text-white relative overflow-hidden">
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
          <Activity className="w-16 h-16 mx-auto mb-4 text-indigo-400 relative z-10" />
          <h3 className="text-2xl font-black relative z-10 mb-2">Health Index Formula is Active</h3>
          <p className="text-slate-400 max-w-lg mx-auto relative z-10">
            Algorithm continuous scoring enabled. The system autonomously monitors field compliance, execution velocity, evidence integrity, and supervisor SLA adherence to generate predictive health vectors.
          </p>
       </div>
    </div>
  );
}
