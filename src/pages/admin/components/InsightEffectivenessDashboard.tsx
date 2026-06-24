import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Activity, Target, AlertTriangle, Search, XCircle, ThumbsUp, ThumbsDown } from 'lucide-react';

export default function InsightEffectivenessDashboard() {
  const { getToken } = useAuth();
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const token = await getToken();
      const res = await fetch('/api/v1/intelligence/insights/feedback-stats', {
         headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setStats(await res.json());
    } catch(e) { console.error(e); }
  };

  if (!stats) return <div className="p-8 text-slate-400">Loading feedback stats...</div>;

  const data = [
    { name: 'Useful', value: stats.useful, color: '#10b981' }, // emerald
    { name: 'Not Useful', value: stats.notUseful, color: '#f43f5e' }, // rose
    { name: 'Investigating', value: stats.investigating, color: '#3b82f6' }, // blue
    { name: 'Dismissed', value: stats.dismissed, color: '#94a3b8' } // slate
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-6 max-w-6xl mx-auto h-[calc(100vh-8rem)] flex flex-col">
       <div className="shrink-0">
         <h2 className="text-2xl font-black text-slate-800">Insight Effectiveness Dashboard</h2>
         <p className="text-slate-500">Executive learning loop metrics and AI correlation accuracy.</p>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-4 gap-4 shrink-0">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
             <div className="flex items-center gap-2 mb-2"><Activity className="w-4 h-4 text-slate-400"/> <span className="text-sm font-bold text-slate-500">Total Insights</span></div>
             <div className="text-3xl font-black text-slate-800">{stats.totalInsights}</div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
             <div className="flex items-center gap-2 mb-2"><ThumbsUp className="w-4 h-4 text-emerald-500"/> <span className="text-sm font-bold text-slate-500">Useful</span></div>
             <div className="text-3xl font-black text-emerald-600">{stats.useful}</div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
             <div className="flex items-center gap-2 mb-2"><Search className="w-4 h-4 text-blue-500"/> <span className="text-sm font-bold text-slate-500">Investigating</span></div>
             <div className="text-3xl font-black text-blue-600">{stats.investigating}</div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
             <div className="flex items-center gap-2 mb-2"><Target className="w-4 h-4 text-indigo-500"/> <span className="text-sm font-bold text-slate-500">AI Accuracy Rating</span></div>
             <div className="text-3xl font-black text-indigo-600">{stats.averageRating} <span className="text-lg text-slate-400">/ 5.0</span></div>
          </div>
       </div>

       <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col">
          <h3 className="font-bold text-slate-800 mb-6 flex items-center justify-between">
             Insight Utilization Distribution
             <div className="flex gap-4">
                <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-emerald-500 rounded-full"></div><span className="text-xs font-bold text-slate-500">Useful</span></div>
                <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-blue-500 rounded-full"></div><span className="text-xs font-bold text-slate-500">Investigating</span></div>
                <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-rose-500 rounded-full"></div><span className="text-xs font-bold text-slate-500">Not Useful</span></div>
                <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-slate-400 rounded-full"></div><span className="text-xs font-bold text-slate-500">Dismissed</span></div>
             </div>
          </h3>
          <div className="flex-1 min-h-0 relative">
             {data.length > 0 ? (
               <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                     <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                     <Pie
                       data={data}
                       innerRadius="60%"
                       outerRadius="90%"
                       paddingAngle={5}
                       dataKey="value"
                     >
                       {data.map((entry, index) => (
                         <Cell key={`cell-${index}`} fill={entry.color} />
                       ))}
                     </Pie>
                  </PieChart>
               </ResponsiveContainer>
             ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400">
                   <Target className="w-12 h-12 mb-2 text-slate-200" />
                   <p className="text-sm font-bold">No feedback data recorded yet.</p>
                </div>
             )}
          </div>
       </div>
    </div>
  );
}
