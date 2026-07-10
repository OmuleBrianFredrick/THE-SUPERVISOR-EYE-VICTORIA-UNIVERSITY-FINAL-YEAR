import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router';
import { TrendingUp, Users, Target, Activity, RefreshCw, BarChart2 } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { useExecutiveSummaryQuery, useInvalidateQueries } from '../../hooks/useQueries';

export default function ExecutiveDashboard() {
  const { getToken } = useAuth();
  const invalidateQueries = useInvalidateQueries();
  const navigate = useNavigate();
  const { data: stats, isLoading: loading } = useExecutiveSummaryQuery();

  if (loading || !stats) return <div className="p-8 flex justify-center text-slate-400"><RefreshCw className="w-8 h-8 animate-spin" /></div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:h-full md:min-h-0 h-auto md:overflow-y-auto overflow-visible">
      
      {/* KPI Cards */}
      <div className="md:col-span-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 shrink-0">
        <div 
          onClick={() => navigate('/eacc?tab=intelligence')}
          className="bg-slate-900 p-6 rounded-2xl text-white cursor-pointer hover:scale-[1.02] transition-transform shadow-md"
        >
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Completed Tasks</h3>
            <Target className="w-5 h-5 text-emerald-400" />
          </div>
          <p className="text-4xl font-black">{stats.completedTasks}</p>
          <div className="mt-4 flex items-center gap-2 text-xs">
            <span className="text-emerald-400 flex items-center"><TrendingUp className="w-3 h-3 mr-1" /> +12%</span>
            <span className="text-slate-500">vs last month</span>
          </div>
        </div>

        <div 
          onClick={() => navigate('/eacc?tab=intelligence')}
          className="bg-white p-6 rounded-2xl border border-slate-200 cursor-pointer hover:scale-[1.02] transition-transform shadow-sm"
        >
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Active Tasks</h3>
            <Activity className="w-5 h-5 text-amber-500" />
          </div>
          <p className="text-4xl font-black text-slate-800">{stats.activeTasks}</p>
          <div className="mt-4 flex items-center gap-2 text-xs">
             <div className="w-full bg-slate-100 rounded-full h-1.5"><div className="bg-amber-500 h-1.5 rounded-full w-2/3"></div></div>
          </div>
        </div>

        <div 
          onClick={() => navigate('/eacc?tab=org-health')}
          className="bg-white p-6 rounded-2xl border border-slate-200 cursor-pointer hover:scale-[1.02] transition-transform shadow-sm"
        >
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Avg Performance</h3>
            <BarChart2 className="w-5 h-5 text-blue-500" />
          </div>
          <p className="text-4xl font-black text-slate-800">{stats.averagePerformanceScore ? Math.round(stats.averagePerformanceScore) : '--'}/100</p>
          <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
             Across {stats.approvedReports} approved reports
          </div>
        </div>

        <div 
          onClick={() => navigate('/eacc?tab=staff-intelligence')}
          className="bg-white p-6 rounded-2xl border border-slate-200 cursor-pointer hover:scale-[1.02] transition-transform shadow-sm"
        >
          <div className="flex justify-between items-start mb-4">
             <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Staff</h3>
             <Users className="w-5 h-5 text-slate-400" />
          </div>
          <p className="text-4xl font-black text-slate-800">{stats.totalStaff}</p>
          <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
              Active accounts in system
          </div>
        </div>

        <div 
          onClick={() => navigate('/evidence')}
          className="bg-white p-6 rounded-2xl border border-slate-200 cursor-pointer hover:scale-[1.02] transition-transform shadow-sm flex flex-col justify-between"
        >
          <div className="flex justify-between items-start mb-4">
             <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Evidence Gov.</h3>
             <Activity className="w-5 h-5 text-purple-500" />
          </div>
          <p className="text-4xl font-black text-slate-800">Media</p>
          <div className="mt-4 flex items-center gap-2 text-xs text-purple-600 font-bold">
              Access Enterprise Library &rarr;
          </div>
        </div>
      </div>

      {/* Main Charts Area */}
      <div className="md:col-span-8 bg-white rounded-2xl border border-slate-200 p-6 min-h-[300px]">
         <div className="flex justify-between items-center mb-6">
           <h3 className="font-bold text-slate-800">Operational Velocity</h3>
           <select className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 font-bold outline-none">
             <option>This Month</option>
             <option>Last Quarter</option>
           </select>
         </div>
         <div className="h-48 w-full mt-2">
           <ResponsiveContainer width="100%" height="100%">
             <AreaChart 
               data={[
                 { name: 'Mon', tasks: 12, velocity: 65 },
                 { name: 'Tue', tasks: 19, velocity: 72 },
                 { name: 'Wed', tasks: stats?.activeTasks || 15, velocity: 68 },
                 { name: 'Thu', tasks: stats?.completedTasks ? Math.floor(stats.completedTasks / 2) : 22, velocity: 80 },
                 { name: 'Fri', tasks: stats?.completedTasks || 31, velocity: 85 },
                 { name: 'Sat', tasks: 8, velocity: 90 },
                 { name: 'Sun', tasks: 5, velocity: 92 },
               ]} 
               margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
             >
               <defs>
                 <linearGradient id="colorTasks" x1="0" y1="0" x2="0" y2="1">
                   <stop offset="5%" stopColor="#ec4899" stopOpacity={0.2}/>
                   <stop offset="95%" stopColor="#ec4899" stopOpacity={0}/>
                 </linearGradient>
                 <linearGradient id="colorVelocity" x1="0" y1="0" x2="0" y2="1">
                   <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                   <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                 </linearGradient>
               </defs>
               <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
               <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
               <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
               <Tooltip contentStyle={{ background: '#0f172a', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '11px' }} />
               <Area type="monotone" dataKey="tasks" stroke="#ec4899" strokeWidth={2} fillOpacity={1} fill="url(#colorTasks)" name="Tasks Completed" />
               <Area type="monotone" dataKey="velocity" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorVelocity)" name="Operational Velocity (%)" />
             </AreaChart>
           </ResponsiveContainer>
         </div>
      </div>

      {/* AI Insights / Summary */}
      <div className="md:col-span-4 bg-amber-50 rounded-2xl border border-amber-200 p-6 flex flex-col">
         <h3 className="font-bold text-amber-900 mb-4 flex items-center gap-2">
           <span className="w-2 h-2 rounded-full bg-amber-500"></span> Executive Summary
         </h3>
         <div className="flex-1 text-sm text-amber-900 leading-relaxed font-medium">
            <p className="mb-4">
              {stats.executiveSummaryText || "No executive summary has been generated yet. Please trigger an intelligence generation cycle."}
            </p>
         </div>
         <button 
           onClick={async () => {
             const token = await getToken();
             await fetch('/api/v1/intelligence/simulate-generation', {
               method: 'POST',
               headers: { Authorization: `Bearer ${token}` }
             });
             invalidateQueries([["analytics", "executive-summary"]]);
           }}
           className="mt-4 w-full bg-amber-900 text-white text-xs font-bold py-3 rounded-xl hover:bg-amber-800 transition shadow-sm"
         >
            GENERATE FULL REPORT
         </button>
      </div>

    </div>
  );
}
