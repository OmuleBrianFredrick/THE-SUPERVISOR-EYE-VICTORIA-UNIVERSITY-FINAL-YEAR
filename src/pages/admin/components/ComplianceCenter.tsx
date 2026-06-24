import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { Activity, ShieldAlert, CheckCircle, Map, Target } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';

export default function ComplianceCenter() {
  const { getToken } = useAuth();
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetchCompliance();
  }, []);

  const fetchCompliance = async () => {
    try {
      const token = await getToken();
      const res = await fetch('/api/v1/governance/compliance', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setData(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  if (!data) return <div className="text-slate-400 p-8">Loading compliance data...</div>;

  const score = Math.max(0, 100 - (data.flagged / Math.max(1, data.totalEvidence)) * 100).toFixed(1);

  const pieData = [
    { name: 'Verified', value: data.verified, color: '#10b981' },
    { name: 'Flagged', value: data.flagged, color: '#f59e0b' },
    { name: 'Rejected', value: data.rejected, color: '#ef4444' },
    { name: 'Pending', value: data.totalEvidence - data.verified - data.flagged - data.rejected, color: '#94a3b8' }
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h2 className="text-2xl font-black text-slate-800">Compliance & Trust Center</h2>
        <p className="text-slate-500">Real-time organizational compliance and evidence integrity scoring.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-emerald-100 shadow-sm col-span-1 md:col-span-2 flex items-center justify-between">
           <div>
             <div className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-1">Global Compliance Score</div>
             <div className="text-4xl font-black text-emerald-600">{score}%</div>
           </div>
           <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center">
              <ShieldAlert className="w-8 h-8 text-emerald-500" />
           </div>
        </div>
        
        <div className="bg-white p-5 rounded-xl border border-red-100 shadow-sm">
           <div className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-1">Fraud Alerts</div>
           <div className="text-2xl font-black text-red-600 flex items-center gap-2"><Target className="w-5 h-5"/> {data.fraudAlerts}</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-amber-100 shadow-sm">
           <div className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-1">Geofence Violations</div>
           <div className="text-2xl font-black text-amber-600 flex items-center gap-2"><Map className="w-5 h-5"/> {data.geofenceViolations}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-800 mb-4">Evidence Verification Status</h3>
            <div className="h-64">
               <ResponsiveContainer width="100%" height="100%">
                 <PieChart>
                   <Pie
                     data={pieData}
                     cx="50%"
                     cy="50%"
                     innerRadius={60}
                     outerRadius={80}
                     paddingAngle={5}
                     dataKey="value"
                   >
                     {pieData.map((entry, index) => (
                       <Cell key={`cell-${index}`} fill={entry.color} />
                     ))}
                   </Pie>
                   <RechartsTooltip />
                   <Legend />
                 </PieChart>
               </ResponsiveContainer>
            </div>
         </div>

         <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-center text-center">
            <CheckCircle className="w-12 h-12 text-slate-200 mx-auto mb-4" />
            <h3 className="font-bold text-slate-800 text-lg">System Integrity Validated</h3>
            <p className="text-sm text-slate-500 mt-2 max-w-sm mx-auto">
              All automated policies including EXIF timestamp validation, identical hash rejection, and distance variance tracking are actively enforcing rules on submitted reports.
            </p>
         </div>
      </div>
    </div>
  );
}
