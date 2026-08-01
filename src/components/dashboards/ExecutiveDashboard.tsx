import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { useNavigate } from 'react-router';
import { TrendingUp, Users, Target, Activity, RefreshCw, BarChart2, Send, ShieldAlert, Sparkles, MessageSquare, CheckCircle2, Award, Zap } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { useExecutiveSummaryQuery, useInvalidateQueries } from '../../hooks/useQueries';

export default function ExecutiveDashboard() {
  const { getToken, profile } = useAuth();
  const { success: showSuccessToast, error: showErrorToast } = useToast();
  const invalidateQueries = useInvalidateQueries();
  const navigate = useNavigate();
  const { data: stats, isLoading: loading } = useExecutiveSummaryQuery();

  const [isSubmittingDirective, setIsSubmittingDirective] = useState(false);
  const [directiveForm, setDirectiveForm] = useState({
    recipientScope: 'All Departments & Field Leadership',
    title: '',
    priority: 'NORMAL',
    feedbackText: ''
  });
  const [submittedDirectives, setSubmittedDirectives] = useState<any[]>([]);

  const handleIssueDirective = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!directiveForm.title.trim() || !directiveForm.feedbackText.trim()) {
      showErrorToast('Please enter both title and executive feedback text');
      return;
    }
    setIsSubmittingDirective(true);
    try {
      const token = await getToken();
      const res = await fetch('/api/v1/reports/directives', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(directiveForm)
      });
      if (res.ok) {
        const newDirective = await res.json();
        showSuccessToast('Executive directive & feedback issued to target leadership!');
        setSubmittedDirectives(prev => [newDirective, ...prev]);
        setDirectiveForm({
          recipientScope: 'All Departments & Field Leadership',
          title: '',
          priority: 'NORMAL',
          feedbackText: ''
        });
        invalidateQueries([["reports"]]);
      } else {
        const err = await res.json();
        showErrorToast(err.error || 'Failed to issue executive directive');
      }
    } catch (e) {
      showErrorToast('Error connecting to executive directive endpoint');
    } finally {
      setIsSubmittingDirective(false);
    }
  };

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
           className="mt-4 w-full bg-amber-900 text-white text-xs font-bold py-3 rounded-xl hover:bg-amber-800 transition shadow-sm cursor-pointer"
         >
            GENERATE FULL REPORT
         </button>
      </div>

      {/* Top Management (CEO & MD) Feedback & Executive Directives Portal */}
      <div className="md:col-span-12 bg-slate-900 text-white rounded-3xl p-6 md:p-8 border border-slate-800 shadow-xl space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800 pb-5">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-bold uppercase tracking-wider mb-2">
              <Zap className="w-3.5 h-3.5 text-indigo-400" /> EXECUTIVE GOVERNANCE & FEEDBACK PORTAL
            </div>
            <h3 className="text-2xl font-black text-white tracking-tight">Issue Executive Directive & Management Feedback</h3>
            <p className="text-slate-400 text-xs mt-1 max-w-2xl">
              Provides Managing Directors, CEOs, and Executive Leadership with direct organizational computation analysis and feedback tools to guide departmental performance and communicate strategic directives to subordinates.
            </p>
          </div>
          <div className="flex items-center gap-3 bg-slate-800/80 px-4 py-2.5 rounded-2xl border border-slate-700/80">
            <Award className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <div className="text-[10px] text-slate-400 font-bold uppercase">Executive Authority</div>
              <div className="text-xs font-extrabold text-white">{profile?.jobTitle || profile?.role || 'Managing Director & CEO'}</div>
            </div>
          </div>
        </div>

        <form onSubmit={handleIssueDirective} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                Target Recipient Scope
              </label>
              <select
                value={directiveForm.recipientScope}
                onChange={e => setDirectiveForm(prev => ({ ...prev, recipientScope: e.target.value }))}
                className="w-full text-xs font-bold border border-slate-700 rounded-xl p-3 bg-slate-800 text-white outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="All Departments & Field Leadership">All Departments & Field Leadership</option>
                <option value="Department Managers Only">Department Managers Only</option>
                <option value="Division & Area Supervisors">Division & Area Supervisors</option>
                <option value="Field Audit & Compliance Operations">Field Audit & Compliance Operations</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                Directive / Feedback Title
              </label>
              <input
                type="text"
                required
                value={directiveForm.title}
                onChange={e => setDirectiveForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="e.g. Q3 Field Audit Standards & Operations SLA Guidance"
                className="w-full text-xs font-bold border border-slate-700 rounded-xl p-3 bg-slate-800 text-white outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                Priority Level
              </label>
              <select
                value={directiveForm.priority}
                onChange={e => setDirectiveForm(prev => ({ ...prev, priority: e.target.value }))}
                className="w-full text-xs font-bold border border-slate-700 rounded-xl p-3 bg-slate-800 text-white outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="NORMAL">NORMAL - Standard Guidance</option>
                <option value="HIGH">HIGH - Urgent Alignment</option>
                <option value="CRITICAL">CRITICAL - Executive SLA Correction</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
              Executive Guidance, Remarks & Departmental Analysis
            </label>
            <textarea
              required
              rows={4}
              value={directiveForm.feedbackText}
              onChange={e => setDirectiveForm(prev => ({ ...prev, feedbackText: e.target.value }))}
              placeholder="Enter executive feedback regarding departmental task velocities, evidence compliance rates, and strategic directives for subordinate managers..."
              className="w-full text-xs font-medium border border-slate-700 rounded-xl p-3.5 bg-slate-800/90 text-white outline-none focus:ring-2 focus:ring-indigo-500"
            ></textarea>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isSubmittingDirective}
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-7 py-3 rounded-xl font-extrabold text-xs uppercase tracking-wider transition cursor-pointer shadow-lg flex items-center gap-2 disabled:opacity-50"
            >
              <Send className="w-4 h-4 text-emerald-400" />
              {isSubmittingDirective ? 'Broadcasting Directive...' : 'Broadcast Directive & Feedback'}
            </button>
          </div>
        </form>

        {submittedDirectives.length > 0 && (
          <div className="pt-4 border-t border-slate-800 space-y-3">
            <h4 className="text-xs font-black uppercase text-indigo-400 tracking-wider">Recently Issued Directives & Broadcasts</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {submittedDirectives.map((d, i) => (
                <div key={d.id || i} className="p-3.5 bg-slate-800/60 rounded-xl border border-slate-700 text-xs">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-indigo-300">{d.locationName || 'Executive HQ'}</span>
                    <span className="text-[10px] text-slate-400">{new Date(d.submittedAt || Date.now()).toLocaleTimeString()}</span>
                  </div>
                  <p className="text-slate-300 font-medium line-clamp-2">{d.notes}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
