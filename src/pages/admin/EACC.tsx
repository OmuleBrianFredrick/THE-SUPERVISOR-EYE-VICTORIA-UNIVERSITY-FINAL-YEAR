import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router';
import { ChevronRight, Home, 
  Users, 
  ShieldCheck, 
  Activity, 
  Settings, 
  LayoutDashboard,
  CheckSquare,
  FileText,
  AlertCircle,
  Database,
  Map,
  Image as ImageIcon,
  HardDrive,
  Fingerprint,
  Eye,
  GitMerge,
  AlertTriangle,
  HeartPulse,
  Target,
  ArrowLeft,
  Webhook,
  Menu
} from 'lucide-react';
import ApprovalQueue from './ApprovalQueue';
import UserManagement from './UserManagement';
import HomepageContent from './HomepageContent';
import ComplianceCenter from './components/ComplianceCenter';
import StorageAnalytics from './components/StorageAnalytics';
import MediaGovernanceCenter from './components/MediaGovernanceCenter';
import GPSCommandCenter from './components/GPSCommandCenter';
import EvidenceAuditCenter from './components/EvidenceAuditCenter';
import OperationalIntelligence from './components/OperationalIntelligence';
import ExecutiveEvidenceReview from './components/ExecutiveEvidenceReview';
import EscalationDashboard from './components/EscalationDashboard';
import ApprovalChainsConfig from './components/ApprovalChainsConfig';
import ExecutiveIntelligenceCenter from './components/ExecutiveIntelligenceCenter';
import AIInsightsCenter from './components/AIInsightsCenter';
import OrganizationalHealthCenter from './components/OrganizationalHealthCenter';
import ReportApprovalsDashboard from './components/ReportApprovalsDashboard';
import DelegationConfig from './components/DelegationConfig';
import GovernanceConfig from './components/GovernanceConfig';
import FieldStaffIntelligence from './components/FieldStaffIntelligence';
import DepartmentIntelligence from './components/DepartmentIntelligence';
import InsightEffectivenessDashboard from './components/InsightEffectivenessDashboard';
import RoleValidationAudit from './components/RoleValidationAudit';
import WorkforceAuthSync from './components/WorkforceAuthSync';
import WorkforceIntelligence from './components/WorkforceIntelligence';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

import EnterpriseIntegrationPlatform from "./components/EnterpriseIntegrationPlatform";
import { useAdminStatsQuery } from "../../hooks/useQueries";

export default function EACC() {
  const { getToken, profile } = useAuth();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(() => {
    return new URLSearchParams(window.location.search).get('tab') || 'overview';
  });
  const { data: stats } = useAdminStatsQuery();
  useEffect(() => {
    const tab = new URLSearchParams(window.location.search).get('tab');
    if (tab && tab !== activeTab) {
      setActiveTab(tab);
    }
  }, [window.location.search]);


  const tabs = [
    { id: 'overview', label: 'EACC Dashboard', icon: LayoutDashboard },
    { id: 'role-validation', label: 'Role Validation Audit', icon: ShieldCheck },
    { id: 'workforce-sync', label: 'Workforce Auth & Sync', icon: Fingerprint },
    { id: 'exec-intelligence', label: 'Executive Intelligence', icon: Eye },
    { id: 'ai-insights', label: 'AI Insights Engine', icon: Activity },
    { id: 'org-health', label: 'Organizational Health', icon: HeartPulse },
    { id: 'dept-intelligence', label: 'Department Intelligence', icon: Target },
    { id: 'staff-intelligence', label: 'Personnel Intelligence', icon: Users },
    { id: 'workforce-intelligence', label: 'Workforce & HR Analytics', icon: GitMerge },
    { id: 'ai-feedback', label: 'AI Feedback Center', icon: CheckSquare },
    { id: 'escalations', label: 'Escalations Engine', icon: AlertTriangle },
    { id: 'chains', label: 'Approval Chains', icon: GitMerge },
    { id: 'delegations', label: 'Delegation Config', icon: Users },
    { id: 'governance-config', label: 'Governance Config', icon: Settings },
    { id: 'integrations', label: 'Integration Platform', icon: Webhook },
    { id: 'gps', label: 'GPS Command Center', icon: Map },
    { id: 'compliance', label: 'Compliance Center', icon: ShieldCheck },
    { id: 'media', label: 'Media Governance', icon: ImageIcon },
    { id: 'storage', label: 'Storage Analytics', icon: HardDrive },
    { id: 'evidence-audit', label: 'Evidence Audit', icon: Fingerprint },
    { id: 'intelligence', label: 'Operational Analytics', icon: Activity },
    { id: 'executive', label: 'Executive Review', icon: Eye },
    { id: 'users', label: 'User Directory', icon: Users },
    { id: 'report-approvals', label: 'Report Approvals', icon: CheckSquare },
    { id: 'approvals', label: 'Workforce Approvals', icon: Users },
    { id: 'content', label: 'Platform Content', icon: FileText },
  ];

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden relative">
      {/* Sidebar Backdrop for Mobile */}
      {isSidebarOpen && (
        <div 
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-30 md:hidden"
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0 transition-transform duration-300 transform md:relative md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800 shrink-0">
          <div className="font-black text-white tracking-tight flex items-center gap-2">
            <span className="text-pink-500 font-black">M</span> EACC
          </div>
          <button 
            onClick={() => navigate('/dashboard')}
            className="text-[11px] font-bold text-slate-400 hover:text-white transition flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 px-2.5 py-1.5 rounded-lg border border-slate-700 cursor-pointer"
            title="Return to regular dashboard"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Exit
          </button>
        </div>
        <div className="p-4 flex flex-col gap-2 overflow-y-auto w-full">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setIsSidebarOpen(false); }}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-colors ${
                activeTab === tab.id 
                  ? 'bg-pink-600 text-white' 
                  : 'hover:bg-slate-800 hover:text-white'
              }`}
            >
              <tab.icon className="w-5 h-5" /> {tab.label}
            </button>
          ))}
        </div>
        
        <div className="mt-auto p-4 border-t border-slate-800">
          <div className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">Authenticated As</div>
          <div className="text-sm text-white font-medium truncate">{profile?.email}</div>
          <div className="text-xs text-pink-400 font-bold uppercase mt-1">{profile?.role || 'SUPER_ADMIN'}</div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden w-full">
        {/* Top Breadcrumb Navigation */}
        <div className="bg-white border-b border-slate-200 px-4 md:px-8 py-4 shrink-0 flex items-center justify-between shadow-sm z-10">
          <div className="flex items-center gap-3 text-sm font-semibold text-slate-500 overflow-hidden">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="md:hidden p-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 transition"
              aria-label="Toggle navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 truncate text-xs sm:text-sm">
              <button onClick={() => navigate('/dashboard')} className="hover:text-slate-900 flex items-center gap-1 transition-colors shrink-0">
                <Home className="w-4 h-4" /> <span className="hidden sm:inline">Dashboard</span>
              </button>
              <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
              <span className="text-slate-700 hidden lg:inline">Enterprise Administration & Command Center</span>
              <span className="text-slate-700 lg:hidden shrink-0">EACC</span>
              <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
              <span className="text-pink-600 font-bold truncate">{tabs.find(t => t.id === activeTab)?.label || 'Overview'}</span>
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
        {activeTab === 'overview' && (
          <div className="max-w-6xl mx-auto space-y-8">
            <div>
              <h1 className="text-3xl font-black text-slate-900 mb-2">Enterprise Overview</h1>
              <p className="text-slate-500">Centralized control and metrics for Movit Group Operations.</p>
            </div>
            
            {stats && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
                  <div className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                    <Users className="w-4 h-4" /> Active Users
                  </div>
                  <div className="text-4xl font-black text-slate-900">{stats.users?.active || 0}</div>
                  <div className="text-xs text-slate-400 mt-2 font-medium">Out of {stats.users?.total || 0} total</div>
                </div>
                
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                  <div className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-500" /> Pending Approvals
                  </div>
                  <div className="text-4xl font-black text-amber-600">{stats.users?.pending || 0}</div>
                  <div className="text-xs text-slate-400 mt-2 font-medium">Require admin review</div>
                </div>
                
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                  <div className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                    <CheckSquare className="w-4 h-4" /> Approvals Total
                  </div>
                  <div className="text-4xl font-black text-emerald-600">{stats.reports?.approved || 0}</div>
                  <div className="text-xs text-slate-400 mt-2 font-medium">Successfully processed</div>
                </div>
                
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm bg-slate-900 text-white">
                  <div className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4" /> Security Status
                  </div>
                  <div className="text-2xl font-black text-emerald-400 mt-1">NOMINAL</div>
                  <div className="text-xs text-slate-400 mt-4 font-medium uppercase font-mono tracking-wider text-pink-400">Strict Enforcement</div>
                </div>
              </div>
            )}
            
            {/* Charts section layout placeholder */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                 <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                   Organizational Demographics
                 </h2>
                 <div className="h-64">
                   {stats ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={[
                          { name: 'Executives', count: stats.users.executives },
                          { name: 'Managers', count: stats.users.managers },
                          { name: 'Supervisors', count: stats.users.supervisors },
                          { name: 'Field Staff', count: stats.users.fieldStaff },
                        ]}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12}} />
                          <YAxis axisLine={false} tickLine={false} />
                          <Tooltip cursor={{fill: '#f1f5f9'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                          <Bar dataKey="count" fill="#db2777" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                   ) : (
                     <div className="h-full flex items-center justify-center text-slate-400">Loading data...</div>
                   )}
                 </div>
              </div>
              
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                 <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                   Recent Activity Stream
                 </h2>
                 <div className="space-y-4">
                    {/* Placeholder for real stream logs */}
                    {[
                      { icon: CheckSquare, text: 'New field report verified in Central.', time: '10m ago' },
                      { icon: Users, text: 'User account #E102 approved.', time: '1h ago' },
                      { icon: AlertCircle, text: 'System backup completed.', time: '3h ago' },
                      { icon: Activity, text: 'High volume of traffic mapped to Eastern region.', time: '5h ago' }
                    ].map((item, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                           <item.icon className="w-4 h-4 text-slate-600" />
                        </div>
                        <div>
                           <div className="text-sm font-medium text-slate-800">{item.text}</div>
                           <div className="text-xs text-slate-500">{item.time}</div>
                        </div>
                      </div>
                    ))}
                 </div>
              </div>
            </div>
            
          </div>
        )}
        
        {activeTab === 'role-validation' && <RoleValidationAudit />}
        {activeTab === 'workforce-sync' && <WorkforceAuthSync />}
        {activeTab === 'users' && <UserManagement />}
        {activeTab === 'report-approvals' && <ReportApprovalsDashboard />}
        {activeTab === 'approvals' && <ApprovalQueue inline />}
        {activeTab === 'content' && <HomepageContent />}
        {activeTab === 'exec-intelligence' && <ExecutiveIntelligenceCenter />}
        {activeTab === 'ai-insights' && <AIInsightsCenter />}
        {activeTab === 'ai-feedback' && <InsightEffectivenessDashboard />}
        {activeTab === 'org-health' && <OrganizationalHealthCenter />}
        {activeTab === 'dept-intelligence' && <DepartmentIntelligence />}
        {activeTab === 'staff-intelligence' && <FieldStaffIntelligence />}
        {activeTab === 'workforce-intelligence' && <WorkforceIntelligence />}
        {activeTab === 'escalations' && <EscalationDashboard />}
        {activeTab === 'chains' && <ApprovalChainsConfig />}
        {activeTab === 'delegations' && <DelegationConfig />}
        {activeTab === 'governance-config' && <GovernanceConfig />}
        {activeTab === 'integrations' && <EnterpriseIntegrationPlatform />}
        {activeTab === 'compliance' && <ComplianceCenter />}
        {activeTab === 'storage' && <StorageAnalytics />}
        {activeTab === 'media' && <MediaGovernanceCenter />}
        {activeTab === 'gps' && <GPSCommandCenter />}
        {activeTab === 'evidence-audit' && <EvidenceAuditCenter />}
        {activeTab === 'intelligence' && <OperationalIntelligence />}
        {activeTab === 'executive' && <ExecutiveEvidenceReview />}
        
        {['hierarchy', 'audit'].includes(activeTab) && (
           <div className="flex flex-col items-center justify-center h-full text-slate-400">
             <Settings className="w-16 h-16 mb-4 opacity-50" />
             <h2 className="text-xl font-bold text-slate-800">{activeTab.toUpperCase()} MODULE</h2>
             <p className="mt-2 text-sm text-center max-w-sm">This module exists structurally and is undergoing specific implementation in the next phase.</p>
           </div>
        )}
      </div>
      </div>
    </div>
  );
}
