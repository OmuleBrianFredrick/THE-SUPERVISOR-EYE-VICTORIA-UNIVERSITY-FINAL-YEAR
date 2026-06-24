import React from 'react';
import { Activity, Target, TrendingUp, Users } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

export default function OperationalIntelligence() {
  
  // Mock trend data
  const velocityData = [
    { day: 'Mon', completion: 45, compliance: 98 },
    { day: 'Tue', completion: 52, compliance: 97 },
    { day: 'Wed', completion: 60, compliance: 95 },
    { day: 'Thu', completion: 74, compliance: 98 },
    { day: 'Fri', completion: 80, compliance: 99 },
    { day: 'Sat', completion: 35, compliance: 96 },
    { day: 'Sun', completion: 20, compliance: 98 },
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
       <div>
         <h2 className="text-2xl font-black text-slate-800">Operational Intelligence (AI Foundation)</h2>
         <p className="text-slate-500">Executive metrics on task completion velocity and operational fluidity.</p>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
             <div className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-1">Active Operations</div>
             <div className="text-3xl font-black text-slate-900">1,248</div>
             <Activity className="absolute right-[-10px] bottom-[-10px] w-20 h-20 text-slate-100" />
          </div>
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
             <div className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-1">Weekly Velocity</div>
             <div className="text-3xl font-black text-emerald-600">+14.2%</div>
             <TrendingUp className="absolute right-[-10px] bottom-[-10px] w-20 h-20 text-emerald-50" />
          </div>
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
             <div className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-1">Task Compliance</div>
             <div className="text-3xl font-black text-blue-600">97.8%</div>
             <Target className="absolute right-[-10px] bottom-[-10px] w-20 h-20 text-blue-50" />
          </div>
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden bg-slate-900 text-white">
             <div className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">Field Agents</div>
             <div className="text-3xl font-black text-white">842</div>
             <Users className="absolute right-[-10px] bottom-[-10px] w-20 h-20 text-slate-800" />
          </div>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
             <h3 className="font-bold text-slate-800 mb-6">Task Completion Velocity (7-Day Trend)</h3>
             <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                   <AreaChart data={velocityData}>
                     <defs>
                        <linearGradient id="colorCompletion" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#db2777" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#db2777" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} />
                     <XAxis dataKey="day" axisLine={false} tickLine={false} />
                     <YAxis axisLine={false} tickLine={false} />
                     <RechartsTooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '8px' }} />
                     <Area type="monotone" dataKey="completion" stroke="#db2777" fillOpacity={1} fill="url(#colorCompletion)" strokeWidth={3} />
                   </AreaChart>
                </ResponsiveContainer>
             </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
             <h3 className="font-bold text-slate-800 mb-6">Compliance Trending</h3>
             <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                   <LineChart data={velocityData}>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} />
                     <XAxis dataKey="day" axisLine={false} tickLine={false} />
                     <YAxis domain={[90, 100]} axisLine={false} tickLine={false} />
                     <RechartsTooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '8px' }} />
                     <Line type="monotone" dataKey="compliance" stroke="#0ea5e9" strokeWidth={3} dot={{ strokeWidth: 2, r: 4 }} activeDot={{ r: 6 }} />
                   </LineChart>
                </ResponsiveContainer>
             </div>
          </div>
       </div>
    </div>
  );
}
