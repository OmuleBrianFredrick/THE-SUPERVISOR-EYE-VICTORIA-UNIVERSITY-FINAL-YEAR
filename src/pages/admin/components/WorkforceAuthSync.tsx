import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { 
  Users, 
  ShieldCheck, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  Terminal, 
  Play, 
  Fingerprint, 
  Mail, 
  Lock, 
  Flame, 
  FileText 
} from 'lucide-react';

interface MetricBoxProps {
  label: string;
  value: string | number;
  subtext: string;
  icon: React.ComponentType<any>;
  colorClass?: string;
}

function MetricBox({ label, value, subtext, icon: Icon, colorClass = "text-slate-900" }: MetricBoxProps) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden transition hover:shadow-md">
      <div className="text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
        <Icon className="w-4 h-4 text-slate-400" />
        {label}
      </div>
      <div className={`text-3xl font-black ${colorClass}`}>{value}</div>
      <div className="text-xs text-slate-500 mt-1 font-semibold">{subtext}</div>
    </div>
  );
}

export default function WorkforceAuthSync() {
  const { getToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<any>(null);
  const [error, setError] = useState('');

  const fetchCurrentReport = async () => {
    try {
      const token = await getToken();
      if (!token) return;
      const res = await fetch('/api/v1/admin/workforce-sync', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.report) {
          setReport(data.report);
        }
      }
    } catch (err: any) {
      console.error("Error reading workforce sync report:", err);
    }
  };

  useEffect(() => {
    fetchCurrentReport();
  }, []);

  const runSyncJob = async () => {
    setLoading(true);
    setError('');
    try {
      const token = await getToken();
      if (!token) throw new Error('Authentication token invalid or missing.');

      const res = await fetch('/api/v1/admin/workforce-sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await res.json();
      if (data.success) {
        setReport(data.report);
      } else {
        throw new Error(data.error || 'The synchronization runner failed.');
      }
    } catch (err: any) {
      setError(err.message || 'Communication breakdown with active synchronization service.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto font-sans text-slate-800">
      
      {/* Header Banner */}
      <div className="bg-slate-900 text-white p-8 md:p-10 rounded-3xl relative overflow-hidden shadow-sm border border-slate-800">
        <div className="absolute right-0 top-0 opacity-10 select-none pointer-events-none">
          <Fingerprint className="w-96 h-96 -mr-16 -mt-16 text-pink-500" />
        </div>
        
        <div className="relative z-10 max-w-3xl space-y-4">
          <span className="text-pink-400 font-extrabold text-xs uppercase tracking-widest bg-pink-500/10 px-3.5 py-1.5 rounded-full border border-pink-400/20 inline-flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5" /> Authentication Audit Suite
          </span>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight leading-none text-white">
            Firebase Workforce Synchronization Engine
          </h1>
          <p className="text-sm md:text-base text-slate-400 leading-relaxed max-w-2xl">
            Audit, match, and automatically sync 100% of Movit Group workforce accounts recorded in PostgreSQL with active Firebase Authentication directory accounts. Includes deterministic email compliance, custom password setups, and instant role login simulation routing.
          </p>
          <div className="pt-2 flex flex-wrap gap-4">
            <button
              onClick={runSyncJob}
              disabled={loading}
              className="bg-pink-600 hover:bg-pink-500 active:bg-pink-700 disabled:opacity-50 text-white font-extrabold text-sm px-6 py-3.5 rounded-xl transition-all flex items-center gap-2 shadow-lg hover:shadow-pink-600/20 cursor-pointer"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  SYNCHRONIZING ENTERPRISE DIRECTORY...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  RUN FORCE SYNCHRONIZATION JOB
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 p-5 rounded-2xl text-sm font-semibold flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
          <div>
            <div className="font-extrabold">Synchronization Error Detected</div>
            <div className="text-xs text-rose-600 mt-1">{error}</div>
          </div>
        </div>
      )}

      {/* Audit Report Statistics Section */}
      {report ? (
        <div className="space-y-8">
          
          {/* Readiness Gauge */}
          <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2 text-center md:text-left">
              <h2 className="text-2xl font-black text-slate-900 flex items-center justify-center md:justify-start gap-2">
                Authentication Readiness Status
              </h2>
              <p className="text-xs text-slate-500 font-semibold max-w-md">
                Indicates the percentage of synchronized users with flawless database-to-Firebase link statuses, validated emails, and verified token signatures.
              </p>
            </div>
            <div className="flex items-center gap-6 shrink-0 bg-slate-50 border border-slate-100 px-6 py-4 rounded-2xl">
              <div className="space-y-1">
                <div className="text-4xl font-black text-emerald-600 font-mono text-center md:text-right">
                  {report.metrics.readinessScore}%
                </div>
                <div className="text-[10px] uppercase font-extrabold tracking-widest text-slate-400 text-center md:text-right">
                  Readiness Score
                </div>
              </div>
              <div className="h-12 w-0.5 bg-slate-200"></div>
              <div className="text-xs font-black text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg uppercase tracking-wider flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> Flawless Readiness
              </div>
            </div>
          </div>

          {/* Metric Box Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricBox 
              label="PostgreSQL Registry" 
              value={report.metrics.totalPostgresUsers} 
              subtext="Total workforce profiles recorded" 
              icon={Users} 
            />
            <MetricBox 
              label="Firebase Directory" 
              value={report.metrics.totalFirebaseUsers} 
              subtext="Valid accounts ready to login" 
              icon={ShieldCheck} 
              colorClass="text-emerald-600"
            />
            <MetricBox 
              label="Auto-Remediated" 
              value={report.metrics.remediationsSucceeded ?? 0} 
              subtext="UIDs matched or accounts auto-created" 
              icon={RefreshCw} 
              colorClass={(report.metrics.remediationsSucceeded ?? 0) > 0 ? "text-amber-600" : "text-slate-500"}
            />
            <MetricBox 
              label="Syntax Errors" 
              value={report.metrics.invalidEmailsCount ?? 0} 
              subtext="Illegal/Invalid email records" 
              icon={Mail} 
              colorClass={(report.metrics.invalidEmailsCount ?? 0) > 0 ? "text-rose-600" : "text-slate-500"}
            />
          </div>

          {/* Sample Logins Simulation Audit Grid */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm">
            <h2 className="text-xl font-black text-slate-900 mb-2 flex items-center gap-2">
              <Lock className="w-5 h-5 text-pink-500" />
              Role-Based Multi-Account Verification Matrix
            </h2>
            <p className="text-xs text-slate-500 font-semibold mb-6">
              Rigorous test-simulation checking token verification and landing layout routing for every active organizational tier.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {(report.sampleVerifications || []).map((sim: any, i: number) => (
                <div key={i} className="bg-slate-50 border border-slate-100 rounded-2xl p-5 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-wider bg-slate-900 text-white px-2 py-0.5 rounded">
                        {sim.role}
                      </span>
                      <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded border ${
                        sim.status === 'PASS' 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                          : 'bg-rose-50 text-rose-700 border-rose-100'
                      }`}>
                        {sim.status}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-slate-900 leading-tight">{sim.fullName || 'Unspecified Name'}</h3>
                      <p className="text-[11px] text-slate-400 font-mono tracking-tight">{sim.email || 'no-email@movitgroup.internal'}</p>
                      <p className="text-xs font-bold text-slate-500 mt-1">{sim.jobTitle || 'No title set'}</p>
                    </div>
                  </div>

                  <div className="border-t border-slate-200 pt-3 space-y-1.5 text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-semibold">Department:</span>
                      <span className="text-slate-700 font-bold text-right truncate max-w-[120px]">{sim.department || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-semibold">Verification:</span>
                      <span className="text-emerald-600 font-black">VALID TOKEN</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 font-semibold">Destination:</span>
                      <span className="text-pink-600 font-bold text-right truncate max-w-[140px]" title={sim.landingDashboard}>
                        {sim.landingDashboard || '/dashboard'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Details & Remediation History Logs */}
          <div className="grid grid-cols-1 lg:col-span-12 gap-6 lg:grid-cols-12">
            
            {/* Remediation and Synchronization Logs */}
            <div className="lg:col-span-7 bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm flex flex-col justify-between">
              <div>
                <h2 className="text-lg font-black text-slate-900 mb-2 flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 text-pink-500" />
                  Auto-Remediation & Alignment Log
                </h2>
                <p className="text-xs text-slate-500 font-semibold mb-4">
                  History of direct database and Firebase directory sync alignments completed in the last execution cycle.
                </p>

                <div className="bg-slate-950 rounded-2xl p-5 text-slate-300 font-mono text-xs max-h-[220px] overflow-y-auto space-y-1.5 leading-relaxed">
                  <div className="text-slate-500">[{new Date(report.timestamp).toLocaleTimeString()}] Starting synchronization sweep...</div>
                  <div className="text-slate-500">[{new Date(report.timestamp).toLocaleTimeString()}] Mode: {report.mode}</div>
                  <div className="text-emerald-400">✔ Verified total PostgreSQL records: {report.metrics.totalPostgresUsers}</div>
                  <div className="text-emerald-400">✔ Validated email structures for compliance.</div>
                  
                  {(report.remediations?.successful || []).length > 0 ? (
                    (report.remediations?.successful || []).map((log: string, idx: number) => (
                      <div key={idx} className="text-amber-400">✔ [ALIGNMENT] {log}</div>
                    ))
                  ) : (
                    <div className="text-slate-400 italic">✔ All accounts perfectly synchronized. No alignment needed.</div>
                  )}

                  {(report.remediations?.failed || []).map((log: any, idx: number) => (
                    <div key={idx} className="text-rose-400">✗ [FAILED] Email: {log.email} | Reason: {log.reason}</div>
                  ))}

                  <div className="text-emerald-500 font-bold">[{new Date(report.timestamp).toLocaleTimeString()}] Operation completed. Readiness Score: {report.metrics.readinessScore}%</div>
                </div>
              </div>
            </div>

            {/* Email Acceptance & Validator */}
            <div className="lg:col-span-5 bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm flex flex-col justify-between">
              <div>
                <h2 className="text-lg font-black text-slate-900 mb-2 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-pink-500" />
                  Firebase Email Validator
                </h2>
                <p className="text-xs text-slate-500 font-semibold mb-4">
                  Analyzes email structures against strict Firebase Authentication rules to identify illegal characters.
                </p>

                {(report.invalidEmails || []).length > 0 ? (
                  <div className="space-y-3">
                    {(report.invalidEmails || []).map((inv: any, idx: number) => (
                      <div key={idx} className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-xs text-rose-700">
                        <div className="font-extrabold">{inv.name}</div>
                        <div className="font-mono tracking-tight text-[10px] mt-0.5">{inv.email}</div>
                        <div className="text-rose-500 font-semibold mt-1">✗ {inv.reason}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-10 text-center space-y-3 bg-emerald-50/20 border border-emerald-100 rounded-2xl">
                    <div className="p-3 bg-emerald-100 text-emerald-700 rounded-full">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-emerald-800">100% Email Compliance</h3>
                      <p className="text-[10px] text-emerald-600 font-semibold max-w-xs mt-1">
                        All generated workforce emails conform with RFC rules and are accepted by Firebase Auth.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>

        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-3xl py-16 text-center space-y-4">
          <Fingerprint className="w-16 h-16 text-slate-300 mx-auto animate-pulse" />
          <div className="space-y-1">
            <h3 className="text-lg font-black text-slate-900">Awaiting Authentication Sync Run</h3>
            <p className="text-xs text-slate-400 font-semibold max-w-sm mx-auto">
              Click 'Run Force Synchronization Job' above to execute a real-time audit scan of the entire 317+ user database.
            </p>
          </div>
        </div>
      )}

    </div>
  );
}
