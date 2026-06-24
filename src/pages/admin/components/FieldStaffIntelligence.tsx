import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { Users, ShieldAlert, Award, Star } from 'lucide-react';

export default function FieldStaffIntelligence() {
  const { getToken } = useAuth();
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = await getToken();
      const res = await fetch('/api/v1/intelligence/staff', {
         headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setData(await res.json());
    } catch(e) { console.error(e); }
  };

  if (!data || data.length === 0) return <div className="text-slate-400 p-8">Loading personnel AI analytics...</div>;

  return (
    <div className="space-y-6 max-w-6xl mx-auto h-[calc(100vh-8rem)] flex flex-col">
       <div className="shrink-0 flex items-center justify-between">
         <div>
           <h2 className="text-2xl font-black text-slate-800">Field & Supervisor Staff Intelligence</h2>
           <p className="text-slate-500">AI-generated individual performance profiles and behavior risk models.</p>
         </div>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-2 gap-4 shrink-0">
          <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-5 flex items-center gap-4">
             <div className="w-12 h-12 rounded-full bg-emerald-200 flex items-center justify-center shrink-0">
                <Award className="w-6 h-6 text-emerald-700" />
             </div>
             <div>
                <h4 className="text-sm font-bold text-emerald-800 uppercase tracking-wide">Top Performer Engine</h4>
                <p className="text-xs text-emerald-600 mt-1">Identifies staff with &gt;95% compliance and zero escalations.</p>
             </div>
          </div>
          <div className="bg-rose-50 border border-rose-100 rounded-xl p-5 flex items-center gap-4">
             <div className="w-12 h-12 rounded-full bg-rose-200 flex items-center justify-center shrink-0">
                <ShieldAlert className="w-6 h-6 text-rose-700" />
             </div>
             <div>
                <h4 className="text-sm font-bold text-rose-800 uppercase tracking-wide">High-Risk Tracker</h4>
                <p className="text-xs text-rose-600 mt-1">Flags individuals with escalating SLA breaches or fraud violations.</p>
             </div>
          </div>
       </div>

       <div className="flex-1 min-h-0 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
          <div className="flex-1 overflow-y-auto p-0">
             <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-50 sticky top-0 z-10 border-b border-slate-100">
                   <tr>
                     <th className="p-4 font-bold text-slate-500 uppercase tracking-widest text-xs">Personnel Name</th>
                     <th className="p-4 font-bold text-slate-500 uppercase tracking-widest text-xs">Productivity</th>
                     <th className="p-4 font-bold text-slate-500 uppercase tracking-widest text-xs">Quality / Compliance</th>
                     <th className="p-4 font-bold text-slate-500 uppercase tracking-widest text-xs">Risk Flags</th>
                     <th className="p-4 font-bold text-slate-500 uppercase tracking-widest text-xs">AI Insight</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                   {data.sort((a,b) => b.productivityScore - a.productivityScore).map((staff, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 transition">
                         <td className="p-4 flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold shrink-0">
                               {staff.user?.firstName?.[0] || 'U'}
                            </div>
                            <div>
                               <div className="font-bold text-slate-800">{staff.user?.firstName} {staff.user?.lastName}</div>
                               <div className="text-[10px] uppercase text-slate-400">{staff.roleType || 'STAFF'}</div>
                            </div>
                         </td>
                         <td className="p-4 font-black">{staff.productivityScore}%</td>
                         <td className="p-4 font-black">{staff.qualityScore}% / {staff.complianceScore}%</td>
                         <td className="p-4">
                            {staff.flags > 0 ? (
                               <span className="bg-rose-100 text-rose-700 px-2 py-0.5 rounded text-xs font-bold">{staff.flags} Violations</span>
                            ) : (
                               <span className="text-slate-300">-</span>
                            )}
                         </td>
                         <td className="p-4">
                            {staff.productivityScore > 90 && staff.complianceScore > 90 ? (
                               <span className="flex items-center gap-1 text-emerald-600 font-bold text-xs"><Star className="w-3 h-3"/> Top Quartile</span>
                            ) : staff.complianceScore < 70 ? (
                               <span className="text-rose-600 font-bold text-xs">Mandatory Retraining Recommended</span>
                            ) : (
                               <span className="text-slate-400 text-xs">Stable</span>
                            )}
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
