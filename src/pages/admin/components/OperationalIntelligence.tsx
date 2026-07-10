import React from 'react';
import { Activity, Target, TrendingUp, Users, Zap } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, AreaChart, Area, ComposedChart, Bar } from 'recharts';

export default function OperationalIntelligence() {
  
  // Mock trend data
  const velocityData = [
    { day: 'Mon', completion: 45, compliance: 98, forecast: 46 },
    { day: 'Tue', completion: 52, compliance: 97, forecast: 50 },
    { day: 'Wed', completion: 60, compliance: 95, forecast: 58 },
    { day: 'Thu', completion: 74, compliance: 98, forecast: 70 },
    { day: 'Fri', completion: 80, compliance: 99, forecast: 78 },
    { day: 'Sat', completion: 35, compliance: 96, forecast: 38 },
    { day: 'Sun', completion: 20, compliance: 98, forecast: 25 },
    { day: 'Next Mon', completion: null, compliance: null, forecast: 48 },
    { day: 'Next Tue', completion: null, compliance: null, forecast: 55 },
  ];

  const forecastingData = [
    { month: 'Jul', actual: 4200, predicted: 4100 },
    { month: 'Aug', actual: 4800, predicted: 4750 },
    { month: 'Sep', actual: 5100, predicted: 5000 },
    { month: 'Oct', actual: null, predicted: 5300 },
    { month: 'Nov', actual: null, predicted: 5800 },
    { month: 'Dec', actual: null, predicted: 6200 },
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
       <div>
         <h2 className="text-2xl font-black text-slate-800">Operational Intelligence (AI Foundation)</h2>
         <p className="text-slate-500">Executive metrics, trend analysis, predictive charts, and operational forecasting.</p>
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
             <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
               Task Completion Velocity & AI Forecast (Trend Analysis)
             </h3>
             <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                   <ComposedChart data={velocityData}>
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
                     <Area type="monotone" dataKey="completion" stroke="#db2777" fillOpacity={1} fill="url(#colorCompletion)" strokeWidth={3} name="Actual Completion" />
                     <Line type="monotone" dataKey="forecast" stroke="#94a3b8" strokeWidth={2} strokeDasharray="5 5" dot={false} name="AI Forecast" />
                   </ComposedChart>
                </ResponsiveContainer>
             </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
             <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                Long-Term Operational Forecasting (Predictive Chart)
             </h3>
             <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                   <ComposedChart data={forecastingData}>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} />
                     <XAxis dataKey="month" axisLine={false} tickLine={false} />
                     <YAxis axisLine={false} tickLine={false} />
                     <RechartsTooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '8px' }} />
                     <Bar dataKey="actual" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Actual Volume" maxBarSize={40} />
                     <Line type="monotone" dataKey="predicted" stroke="#8b5cf6" strokeWidth={3} dot={{ strokeWidth: 2, r: 4 }} name="Predicted Volume" />
                   </ComposedChart>
                </ResponsiveContainer>
             </div>
          </div>
       </div>
    </div>
  );
}
