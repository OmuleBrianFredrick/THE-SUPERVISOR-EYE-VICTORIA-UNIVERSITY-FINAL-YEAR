import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { Building2, TrendingUp, TrendingDown, Target, ShieldCheck, Activity } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';

export default function DepartmentIntelligence() {
  const { getToken } = useAuth();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const res = await fetch('/api/v1/intelligence/departments', {
         headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch(e) { 
      console.error(e); 
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 text-slate-500 gap-3">
        <Activity className="w-6 h-6 animate-spin text-blue-600" />
        <span className="font-medium text-sm">Loading department AI analytics...</span>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="p-12 text-center text-slate-500 bg-white rounded-xl border border-slate-200">
        <Building2 className="w-10 h-10 mx-auto text-slate-300 mb-3" />
        <p className="font-bold text-slate-700">No Department Intelligence Data Available</p>
        <p className="text-xs text-slate-400 mt-1">Run an intelligence sync or check department audit logs.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto h-[calc(100vh-8rem)] flex flex-col">
       <div className="shrink-0">
         <h2 className="text-2xl font-black text-slate-800">Department Performance Intelligence</h2>
         <p className="text-slate-500">Cross-departmental comparisons and AI-generated efficiency health states.</p>
       </div>

       <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 shrink-0">
          <h3 className="font-bold text-slate-800 mb-4">Relative Health & Risk Scoring</h3>
          <div className="h-[250px]">
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={data}>
                 <CartesianGrid strokeDasharray="3 3" vertical={false} />
                 <XAxis dataKey="department.name" axisLine={false} tickLine={false} />
                 <YAxis axisLine={false} tickLine={false} />
                 <RechartsTooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '8px' }} />
                 <Bar name="Health Score" dataKey="healthScore" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                 <Bar name="Risk Factor" dataKey="riskScore" fill="#ef4444" radius={[4, 4, 0, 0]} />
               </BarChart>
             </ResponsiveContainer>
          </div>
       </div>

       <div className="flex-1 min-h-0 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-100 bg-slate-50 font-bold text-slate-800 flex items-center gap-2">
             <Building2 className="w-5 h-5 text-slate-500" /> Department Ranking Engine
          </div>
          <div className="flex-1 overflow-y-auto p-0">
             <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-white sticky top-0 z-10 shadow-sm border-b border-slate-100">
                   <tr>
                     <th className="p-4 font-bold text-slate-500 uppercase tracking-widest text-xs">Department Name</th>
                     <th className="p-4 font-bold text-slate-500 uppercase tracking-widest text-xs">Task Velocity</th>
                     <th className="p-4 font-bold text-slate-500 uppercase tracking-widest text-xs">Compliance</th>
                     <th className="p-4 font-bold text-slate-500 uppercase tracking-widest text-xs">SLA Met</th>
                     <th className="p-4 font-bold text-slate-500 uppercase tracking-widest text-xs">Health / Status</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                   {data.sort((a,b) => b.healthScore - a.healthScore).map((dept, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 transition">
                         <td className="p-4 font-black text-slate-800">{dept.department?.name || 'Unknown'}</td>
                         <td className="p-4 text-emerald-600 font-bold">{dept.taskCompletionRate}%</td>
                         <td className="p-4 text-blue-600 font-bold">{dept.complianceRate}%</td>
                         <td className="p-4 text-purple-600 font-bold">{dept.slaPerformance}%</td>
                         <td className="p-4 flex items-center gap-2">
                            <span className="font-bold">{dept.healthScore}</span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              dept.healthScore > 85 ? 'bg-emerald-100 text-emerald-700' :
                              dept.healthScore > 70 ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'
                            }`}>
                              {dept.healthScore > 85 ? 'EXCELLENT' : dept.healthScore > 70 ? 'MODERATE RISK' : 'CRITICAL'}
                            </span>
                         </td>
                      </tr>
                   ))}
                </tbody>
             </table>
          </div>
       </div>
    </div>
  );
}
