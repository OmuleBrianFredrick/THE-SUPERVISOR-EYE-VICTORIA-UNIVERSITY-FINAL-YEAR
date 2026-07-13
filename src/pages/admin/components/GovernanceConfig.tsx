import React, { useState, useEffect } from 'react';
import { Settings, ShieldCheck, Clock, AlertTriangle, Save, Bell, Bot, Loader2 } from 'lucide-react';
import { useToast } from '../../../contexts/ToastContext';
import { useAuth } from '../../../contexts/AuthContext';

export default function GovernanceConfig() {
  const { success, error } = useToast();
  const { getToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Policy States
  const [aiFrequency, setAiFrequency] = useState('DAILY');
  const [intelligenceThreshold, setIntelligenceThreshold] = useState('HIGH');
  const [executiveBriefingSchedule, setExecutiveBriefingSchedule] = useState('WEEKLY');
  const [scoringRules, setScoringRules] = useState('BALANCED');
  const [defaultSlaHours, setDefaultSlaHours] = useState(24);
  const [slaBreachAction, setSlaBreachAction] = useState('ESCALATE');
  const [criticalEscalationDelay, setCriticalEscalationDelay] = useState('2');
  const [autoResolveEscalations, setAutoResolveEscalations] = useState(true);
  const [geofenceVarianceLimit, setGeofenceVarianceLimit] = useState(500);
  const [timeAnomalyTolerance, setTimeAnomalyTolerance] = useState(60);
  const [alertSensitivity, setAlertSensitivity] = useState('HIGH');
  const [slaBreachExecutiveDigest, setSlaBreachExecutiveDigest] = useState(true);
  const [fraudAlertPush, setFraudAlertPush] = useState(true);

  useEffect(() => {
    fetchPolicies();
  }, []);

  const fetchPolicies = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      const res = await fetch('/api/v1/governance/policies', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAiFrequency(data.aiFrequency || 'DAILY');
        setIntelligenceThreshold(data.intelligenceThreshold || 'HIGH');
        setExecutiveBriefingSchedule(data.executiveBriefingSchedule || 'WEEKLY');
        setScoringRules(data.scoringRules || 'BALANCED');
        setDefaultSlaHours(data.defaultSlaHours !== undefined ? data.defaultSlaHours : 24);
        setSlaBreachAction(data.slaBreachAction || 'ESCALATE');
        setCriticalEscalationDelay(data.criticalEscalationDelay || '2');
        setAutoResolveEscalations(data.autoResolveEscalations !== undefined ? data.autoResolveEscalations : true);
        setGeofenceVarianceLimit(data.geofenceVarianceLimit !== undefined ? data.geofenceVarianceLimit : 500);
        setTimeAnomalyTolerance(data.timeAnomalyTolerance !== undefined ? data.timeAnomalyTolerance : 60);
        setAlertSensitivity(data.alertSensitivity || 'HIGH');
        setSlaBreachExecutiveDigest(data.slaBreachExecutiveDigest !== undefined ? data.slaBreachExecutiveDigest : true);
        setFraudAlertPush(data.fraudAlertPush !== undefined ? data.fraudAlertPush : true);
      } else {
        error('Failed to load governance policies');
      }
    } catch (e) {
      error('An error occurred loading policies');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const token = await getToken();
      
      const payload = {
        aiFrequency,
        intelligenceThreshold,
        executiveBriefingSchedule,
        scoringRules,
        defaultSlaHours,
        slaBreachAction,
        criticalEscalationDelay,
        autoResolveEscalations,
        geofenceVarianceLimit,
        timeAnomalyTolerance,
        alertSensitivity,
        slaBreachExecutiveDigest,
        fraudAlertPush
      };

      const res = await fetch('/api/v1/governance/policies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        success("Governance and Intelligence policies successfully updated");
      } else {
        error("Failed to save governance policies");
      }
    } catch (e) {
      error("An error occurred saving policies");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-12 text-slate-400">
         <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto h-[calc(100vh-8rem)] flex flex-col">
       <div className="shrink-0 flex justify-between items-center">
         <div>
           <h2 className="text-2xl font-black text-slate-800">Governance & Intelligence Configuration</h2>
           <p className="text-slate-500">Global policies for compliance, service level agreements, and AI operations.</p>
         </div>
         <button onClick={handleSave} disabled={saving} className="bg-slate-900 text-white px-5 py-2.5 rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-slate-800 transition cursor-pointer">
            <Save className="w-4 h-4" /> {saving ? 'SAVING...' : 'SAVE POLICIES'}
         </button>
       </div>

       <div className="flex-1 overflow-y-auto space-y-6">
          {/* AI Intelligence Configuration */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
             <div className="bg-slate-50 border-b border-slate-100 p-4 flex items-center gap-3">
                <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg"><Bot className="w-5 h-5"/></div>
                <h3 className="font-bold text-slate-800">AI Intelligence Engine Settings</h3>
             </div>
             <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                   <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">AI Generation Frequency</label>
                   <select className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 transition" value={aiFrequency} onChange={e => setAiFrequency(e.target.value)}>
                      <option value="HOURLY">Hourly Processing</option>
                      <option value="DAILY">Daily Batch Processing</option>
                      <option value="WEEKLY">Weekly Deep Analysis</option>
                   </select>
                   <p className="text-xs text-slate-400 mt-2">How often the background AI engine analyzes operational data.</p>
                </div>
                <div>
                   <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Intelligence Thresholds</label>
                   <select className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 transition" value={intelligenceThreshold} onChange={e => setIntelligenceThreshold(e.target.value)}>
                      <option value="LOW">Low (Log all insights)</option>
                      <option value="MEDIUM">Medium (Filter minor noise)</option>
                      <option value="HIGH">High (Critical & Major Trends Only)</option>
                   </select>
                   <p className="text-xs text-slate-400 mt-2">Sensitivity setting for insight generation algorithms.</p>
                </div>
                <div>
                   <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Executive Briefing Schedule</label>
                   <select className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 transition" value={executiveBriefingSchedule} onChange={e => setExecutiveBriefingSchedule(e.target.value)}>
                      <option value="DAILY">Daily Standup Brief</option>
                      <option value="WEEKLY">Weekly Executive Summary</option>
                      <option value="MONTHLY">Monthly Strategy Report</option>
                   </select>
                </div>
                <div>
                   <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Organization Scoring Rules</label>
                   <select className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 transition" value={scoringRules} onChange={e => setScoringRules(e.target.value)}>
                      <option value="BALANCED">Balanced (Standard Metrics)</option>
                      <option value="COMPLIANCE_HEAVY">Strict Compliance Weighting</option>
                      <option value="VELOCITY_HEAVY">High Velocity/Output Weighting</option>
                   </select>
                </div>
             </div>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
             <div className="bg-slate-50 border-b border-slate-100 p-4 flex items-center gap-3">
                <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg"><Clock className="w-5 h-5"/></div>
                <h3 className="font-bold text-slate-800">Global SLA Defaults</h3>
             </div>
             <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                   <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Default Approval SLA (Hours)</label>
                   <input type="number" value={defaultSlaHours} onChange={e => setDefaultSlaHours(parseInt(e.target.value) || 0)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 transition" />
                   <p className="text-xs text-slate-400 mt-2">Fallback SLA if no chain-specific SLA is configured.</p>
                </div>
                <div>
                   <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">SLA Breach Action</label>
                   <select className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 transition" value={slaBreachAction} onChange={e => setSlaBreachAction(e.target.value)}>
                      <option value="ESCALATE">Escalate to Executive/Manager</option>
                      <option value="AUTO_APPROVE">Auto-Approve Report</option>
                      <option value="NOTIFY">Send Warning Notification Only</option>
                   </select>
                </div>
             </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
             <div className="bg-slate-50 border-b border-slate-100 p-4 flex items-center gap-3">
                <div className="p-2 bg-rose-100 text-rose-600 rounded-lg"><AlertTriangle className="w-5 h-5"/></div>
                <h3 className="font-bold text-slate-800">Escalation Thresholds</h3>
             </div>
             <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                   <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Critical Escalation Delay</label>
                   <select className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 transition" value={criticalEscalationDelay} onChange={e => setCriticalEscalationDelay(e.target.value)}>
                      <option value="1">1 Hour Past SLA</option>
                      <option value="2">2 Hours Past SLA</option>
                      <option value="4">4 Hours Past SLA</option>
                      <option value="24">24 Hours Past SLA</option>
                   </select>
                </div>
                <div>
                   <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Auto-Resolve Escalations</label>
                   <div className="flex items-center gap-3 mt-3">
                      <input type="checkbox" className="w-5 h-5 rounded border-slate-300 text-slate-900 focus:ring-slate-900" checked={autoResolveEscalations} onChange={e => setAutoResolveEscalations(e.target.checked)} />
                      <span className="text-sm font-semibold text-slate-700">Auto-resolve if original action is completed</span>
                   </div>
                </div>
             </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
             <div className="bg-slate-50 border-b border-slate-100 p-4 flex items-center gap-3">
                <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg"><ShieldCheck className="w-5 h-5"/></div>
                <h3 className="font-bold text-slate-800">Compliance Triggers</h3>
             </div>
             <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                   <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Geofence Variance Limit (Meters)</label>
                   <input type="number" value={geofenceVarianceLimit} onChange={e => setGeofenceVarianceLimit(parseInt(e.target.value) || 0)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 transition" />
                   <p className="text-xs text-slate-400 mt-2">Reports submitted further than this distance from task location trigger an anomaly.</p>
                </div>
                <div>
                   <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Time Anomaly Tolerance (Minutes)</label>
                   <input type="number" value={timeAnomalyTolerance} onChange={e => setTimeAnomalyTolerance(parseInt(e.target.value) || 0)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 transition" />
                   <p className="text-xs text-slate-400 mt-2">Difference between evidence EXIF time and system submission time.</p>
                </div>
             </div>
          </div>
          
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
             <div className="bg-slate-50 border-b border-slate-100 p-4 flex items-center gap-3">
                <div className="p-2 bg-amber-100 text-amber-600 rounded-lg"><Bell className="w-5 h-5"/></div>
                <h3 className="font-bold text-slate-800">Executive Alert Rules</h3>
             </div>
             <div className="p-6 space-y-4">
                <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-xl">
                   <div className="w-2/3">
                      <div className="font-bold text-slate-800 text-sm">Alert Sensitivity</div>
                      <div className="text-xs text-slate-500 mt-1">Configure the severity threshold for triggering real-time executive push notifications.</div>
                   </div>
                   <select className="w-1/3 bg-white border border-slate-200 rounded-xl p-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 transition" value={alertSensitivity} onChange={e => setAlertSensitivity(e.target.value)}>
                      <option value="ALL">All Alerts (High Noise)</option>
                      <option value="MEDIUM">Medium & Above</option>
                      <option value="HIGH">High & Critical Only</option>
                      <option value="CRITICAL">Critical System Failures Only</option>
                   </select>
                </div>
                <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-xl">
                   <div>
                      <div className="font-bold text-slate-800 text-sm">SLA Breach Executive Digest</div>
                      <div className="text-xs text-slate-500 mt-1">Send a daily summary of all unresolved SLA breaches to Executive roles.</div>
                   </div>
                   <input type="checkbox" className="w-5 h-5 rounded border-slate-300 text-slate-900 focus:ring-slate-900" checked={slaBreachExecutiveDigest} onChange={e => setSlaBreachExecutiveDigest(e.target.checked)} />
                </div>
                <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-xl">
                   <div>
                      <div className="font-bold text-slate-800 text-sm">Fraud Alert Real-time Push</div>
                      <div className="text-xs text-slate-500 mt-1">Immediately notify Operations Directors when evidence fraud (e.g. spoofed GPS, EXIF mismatch) is detected.</div>
                   </div>
                   <input type="checkbox" className="w-5 h-5 rounded border-slate-300 text-slate-900 focus:ring-slate-900" checked={fraudAlertPush} onChange={e => setFraudAlertPush(e.target.checked)} />
                </div>
             </div>
          </div>
       </div>
    </div>
  );
}
