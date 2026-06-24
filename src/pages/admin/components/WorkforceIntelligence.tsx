import { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { 
  Users, 
  Clock, 
  GitCommit, 
  Building2, 
  ChevronRight, 
  Loader2,
  Calendar,
  UserCheck,
  ShieldAlert,
  HelpCircle,
  FileCheck2
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';

interface TransferRecord {
  id: string;
  effectiveDate: string;
  reason: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
  };
  previousDepartment: string | null;
  newDepartment: string;
  assignedBy: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

interface IntelligenceData {
  avgOnboardingDurationDays: number;
  totalOnboardingCompleted: number;
  departmentGrowth: Array<{ departmentName: string; count: number }>;
  joinTrends: Array<{ month: string; count: number }>;
  transfers: TransferRecord[];
}

export default function WorkforceIntelligence() {
  const { getToken } = useAuth();
  const [data, setData] = useState<IntelligenceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadWorkforceData() {
      try {
        const token = await getToken();
        if (!token) return;

        const res = await fetch('/api/v1/admin/workforce-intelligence', {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (!res.ok) {
          throw new Error('Failed to load workforce intelligence data.');
        }

        const stats = await res.json();
        setData(stats);
      } catch (err: any) {
        console.error(err);
        setError(err.message || 'Failed to connect to HR analytical services.');
      } finally {
        setLoading(false);
      }
    }

    loadWorkforceData();
  }, [getToken]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3 text-slate-500">
        <Loader2 className="w-10 h-10 animate-spin text-pink-600" />
        <p className="text-sm font-semibold tracking-wide">Assembling enterprise workforce telemetry...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-rose-50 border border-rose-200 text-rose-600 p-6 rounded-2xl max-w-lg mx-auto mt-12">
        <h3 className="font-extrabold text-lg flex items-center gap-2 mb-2">
          <ShieldAlert className="w-5 h-5" /> Analytics Connection Interrupted
        </h3>
        <p className="text-sm font-medium leading-relaxed">{error || 'Data is currently unreachable.'}</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fadeIn">
      {/* Upper Title Header */}
      <div>
        <h1 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">
          Workforce & HR Analytics
        </h1>
        <p className="text-slate-500">
          Executive monitoring of onboarding durations, departmental headcount distributions, and employee lifecycle transfers.
        </p>
      </div>

      {/* Summary Stats Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div id="stat-total-onboarded" className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-emerald-500" /> Total Active Onboarded
          </div>
          <div className="text-4xl font-black text-slate-900">{data.totalOnboardingCompleted}</div>
          <div className="text-[11px] text-slate-500 mt-2 font-semibold">Self-enrollment completed & approved</div>
        </div>

        <div id="stat-avg-onboarding" className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-500" /> Avg Onboarding Duration
          </div>
          <div className="text-4xl font-black text-indigo-600">
            {data.avgOnboardingDurationDays} <span className="text-lg font-bold text-slate-500">Days</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-2 font-semibold">Time from account creation to registration completion</div>
        </div>

        <div id="stat-departments-headcount" className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm bg-slate-900 text-white">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-pink-400" /> Managed Departments
          </div>
          <div className="text-4xl font-black text-pink-400">{data.departmentGrowth.length}</div>
          <div className="text-[11px] text-slate-400 mt-2 font-semibold uppercase tracking-wider font-mono">Real-time isolation active</div>
        </div>
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Join Trends Chart */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col">
          <div className="mb-4">
            <h2 className="text-lg font-extrabold text-slate-800 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-pink-600" /> Workforce Join Trends
            </h2>
            <p className="text-xs text-slate-500 mt-1">Number of active employees joining departments per month.</p>
          </div>
          <div className="h-64 mt-4 flex-1">
            {data.joinTrends.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-400 italic text-sm">No historical join data available</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.joinTrends}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} allowDecimals={false} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px -2px rgb(0 0 0 / 0.05)' }} />
                  <Line type="monotone" dataKey="count" stroke="#db2777" strokeWidth={3} activeDot={{ r: 8 }} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Department growth chart */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col">
          <div className="mb-4">
            <h2 className="text-lg font-extrabold text-slate-800 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-indigo-600" /> Department Demographics
            </h2>
            <p className="text-xs text-slate-500 mt-1">Assigned headcount representation across Movit divisions.</p>
          </div>
          <div className="h-64 mt-4 flex-1">
            {data.departmentGrowth.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-400 italic text-sm">No department distribution data available</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.departmentGrowth}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="departmentName" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} allowDecimals={false} />
                  <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px -2px rgb(0 0 0 / 0.05)' }} />
                  <Bar dataKey="count" fill="#4f46e5" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Department Transfer History Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
          <h2 className="text-lg font-extrabold text-slate-800 flex items-center gap-2">
            <GitCommit className="w-5 h-5 text-pink-600 animate-pulse" /> Department Transfer History Logs
          </h2>
          <p className="text-xs text-slate-500 mt-1">Audit-compliant trail capturing manual and onboarding department assignment history.</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600 border-collapse">
            <thead>
              <tr className="bg-slate-50/75 border-b border-slate-100 text-slate-500 text-xs font-bold uppercase tracking-wider">
                <th className="px-6 py-4">Employee</th>
                <th className="px-6 py-4">Transfer Boundary</th>
                <th className="px-6 py-4">Authorized By</th>
                <th className="px-6 py-4">Reason</th>
                <th className="px-6 py-4">Effective Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {data.transfers.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50/50 transition duration-150">
                  <td className="px-6 py-4 font-bold text-slate-800">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-pink-100 text-pink-700 flex items-center justify-center font-bold text-xs">
                        {t.user.firstName?.[0] || 'U'}{t.user.lastName?.[0] || ''}
                      </div>
                      <span>{t.user.firstName} {t.user.lastName}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5 text-xs">
                      <span className={`px-2 py-0.5 rounded-md font-bold ${
                        t.previousDepartment 
                          ? 'bg-slate-100 text-slate-600 border border-slate-200' 
                          : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                      }`}>
                        {t.previousDepartment || 'Onboarding'}
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                      <span className="px-2 py-0.5 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-md font-bold">
                        {t.newDepartment}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs font-semibold text-slate-500">
                    {t.assignedBy ? `${t.assignedBy.firstName} ${t.assignedBy.lastName}` : 'System'}
                  </td>
                  <td className="px-6 py-4 text-slate-500 italic max-w-xs truncate text-xs">
                    "{t.reason}"
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-400 font-mono">
                    {new Date(t.effectiveDate).toLocaleString()}
                  </td>
                </tr>
              ))}
              {data.transfers.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-slate-400 italic text-sm">
                    No departmental transfer events recorded in history database.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
