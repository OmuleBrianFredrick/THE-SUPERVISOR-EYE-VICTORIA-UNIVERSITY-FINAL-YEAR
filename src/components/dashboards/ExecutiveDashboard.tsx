import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { TrendingUp, Users, Target, Activity, RefreshCw, BarChart2 } from 'lucide-react';

export default function ExecutiveDashboard() {
  const { getToken } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = await getToken();
      const res = await fetch('/api/v1/analytics/executive-summary', { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        setStats(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !stats) return <div className="p-8 flex justify-center text-slate-400"><RefreshCw className="w-8 h-8 animate-spin" /></div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 h-full min-h-0 overflow-y-auto">
      
      {/* KPI Cards */}
      <div className="md:col-span-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
        <div className="bg-slate-900 p-6 rounded-2xl text-white">
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

        <div className="bg-white p-6 rounded-2xl border border-slate-200">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Active Tasks</h3>
            <Activity className="w-5 h-5 text-amber-500" />
          </div>
          <p className="text-4xl font-black text-slate-800">{stats.activeTasks}</p>
          <div className="mt-4 flex items-center gap-2 text-xs">
             <div className="w-full bg-slate-100 rounded-full h-1.5"><div className="bg-amber-500 h-1.5 rounded-full w-2/3"></div></div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Avg Performance</h3>
            <BarChart2 className="w-5 h-5 text-blue-500" />
          </div>
          <p className="text-4xl font-black text-slate-800">{stats.averagePerformanceScore ? Math.round(stats.averagePerformanceScore) : '--'}/100</p>
          <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
             Across {stats.approvedReports} approved reports
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200">
          <div className="flex justify-between items-start mb-4">
             <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Staff</h3>
             <Users className="w-5 h-5 text-slate-400" />
          </div>
          <p className="text-4xl font-black text-slate-800">{stats.totalStaff}</p>
          <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
             Active accounts in system
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
         {/* Placeholder for real chart (recharts) */}
         <div className="h-48 w-full flex items-end gap-2 px-4 opacity-70">
            <div className="flex-1 bg-slate-100 rounded-t-sm h-[30%] hover:bg-slate-200 transition"></div>
            <div className="flex-1 bg-slate-100 rounded-t-sm h-[40%] hover:bg-slate-200 transition"></div>
            <div className="flex-1 bg-slate-200 rounded-t-sm h-[20%] hover:bg-slate-300 transition"></div>
            <div className="flex-1 bg-slate-300 rounded-t-sm h-[60%] hover:bg-slate-400 transition"></div>
            <div className="flex-1 bg-pink-100 rounded-t-sm h-[75%] hover:bg-pink-200 transition"></div>
            <div className="flex-1 bg-pink-200 rounded-t-sm h-[90%] hover:bg-pink-300 transition"></div>
            <div className="flex-1 bg-pink-500 rounded-t-sm h-[100%] shadow-[0_0_15px_rgba(236,72,153,0.5)]"></div>
         </div>
         <div className="flex justify-between text-[10px] text-slate-400 mt-2 font-bold uppercase px-4">
            <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
         </div>
      </div>

      {/* AI Insights / Summary */}
      <div className="md:col-span-4 bg-amber-50 rounded-2xl border border-amber-200 p-6 flex flex-col">
         <h3 className="font-bold text-amber-900 mb-4 flex items-center gap-2">
           <span className="w-2 h-2 rounded-full bg-amber-500"></span> Executive Summary
         </h3>
         <div className="flex-1 text-sm text-amber-900 leading-relaxed font-medium">
            <p className="mb-4">
              Overall field operations are running smoothly with a high completion rate. The primary bottleneck identified in the Western Region has shown a 14% improvement over the last week.
            </p>
            <p>
              AI Recommendation: Consider deploying a "Stock Audit" template task for the Central Region to verify inventory discrepancies reported in recent distribution logs.
            </p>
         </div>
         <button className="mt-4 w-full bg-amber-900 text-white text-xs font-bold py-3 rounded-xl hover:bg-amber-800 transition shadow-sm">
            GENERATE FULL REPORT
         </button>
      </div>

    </div>
  );
}
