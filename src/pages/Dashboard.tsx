import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router';
import { User, Shield, Building2, X, Clock, Calendar, Phone, Mail, BadgeCheck, CheckCircle2 } from 'lucide-react';
import FieldStaffDashboard from '../components/dashboards/FieldStaffDashboard';
import SupervisorDashboard from '../components/dashboards/SupervisorDashboard';
import ExecutiveDashboard from '../components/dashboards/ExecutiveDashboard';
import NotificationDropdown from '../components/notifications/NotificationDropdown';

export default function Dashboard() {
  const { profile, logout } = useAuth();
  const navigate = useNavigate();
  const [showProfile, setShowProfile] = useState(false);

  const roleMatch = profile?.role || '';
  const isFieldStaff = roleMatch === 'Field Staff';
  const isSupervisor = roleMatch === 'Supervisor' || roleMatch === 'Area Manager' || roleMatch === 'Manager';
  const isExecutive = roleMatch === 'Executive' || roleMatch === 'MD / Ops Director' || roleMatch === 'Platform Admin' || roleMatch === 'SUPER_ADMIN' || roleMatch === 'Administrator' || roleMatch === 'SYSTEM_ADMIN' || ['IT_ADMIN', 'IT_SUPPORT', 'NETWORK_ADMIN', 'SECURITY_ADMIN', 'DATABASE_ADMIN'].includes(roleMatch);

  const renderDashboardContent = () => {
    if (isExecutive) return <ExecutiveDashboard />;
    if (isSupervisor) return <SupervisorDashboard />;
    if (isFieldStaff) return <FieldStaffDashboard />;
    return <FieldStaffDashboard />; // Fallback
  };

  return (
    <div className="h-screen w-full bg-slate-50 text-slate-900 flex flex-col font-sans overflow-hidden">
      {/* Top Navigation Bar */}
      <header className="h-16 border-b border-slate-200 bg-white flex items-center justify-between px-8 shrink-0">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
            <span className="font-black text-xl italic tracking-tighter">MOVIT</span>
            <span className="font-bold text-slate-400">Supervisor Eye</span>
          </div>
          
          {/* Admin Navigation Pills */}
          <div className="hidden md:flex items-center gap-2 border-l border-slate-200 pl-6">
            {isExecutive && (
              <button 
                onClick={() => navigate('/eacc')}
                className="bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs px-3.5 py-1.5 rounded-full transition flex items-center gap-1.5 shadow-sm"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                EACC COMMAND CENTER
              </button>
            )}
            {isExecutive && (
              <button 
                onClick={() => navigate('/admin/approvals')}
                className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-3.5 py-1.5 rounded-full transition flex items-center gap-1.5"
              >
                APPROVAL QUEUE
              </button>
            )}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <NotificationDropdown />
          <div 
            onClick={() => setShowProfile(true)} 
            className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition border-l border-slate-200 pl-4"
            id="dashboard-profile-button"
          >
          <div className="text-right">
            <p className="text-sm font-bold text-slate-800">{profile?.firstName || 'User'} {profile?.lastName || ''}</p>
            <p className="text-[10px] text-slate-500 uppercase font-semibold">{profile?.jobTitle || profile?.role || 'Staff'}</p>
          </div>
          {profile?.profilePhotoUrl ? (
            <img src={profile.profilePhotoUrl} alt="Profile" className="w-10 h-10 rounded-full border-2 border-slate-200 shadow-sm object-cover" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-slate-900 text-white border-2 border-slate-200 shadow-sm flex items-center justify-center font-black text-sm uppercase">
              {profile?.firstName?.[0] || 'U'}{profile?.lastName?.[0] || ''}
            </div>
          )}
        </div>
        <button onClick={logout} className="ml-4 text-xs font-bold text-slate-400 hover:text-slate-800 transition uppercase tracking-wider">LOGOUT</button>
      </div>
    </header>

    {/* Main Command Center */}
    <main className="flex-1 p-6 min-h-0 overflow-auto">
       {renderDashboardContent()}
    </main>

    {/* User Profile Details Modal */}
    {showProfile && (
      <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div 
          id="profile-details-modal" 
          className="bg-white rounded-3xl max-w-md w-full border border-slate-200 shadow-xl overflow-hidden animate-scaleIn relative"
        >
          {/* Header Banner */}
          <div className="bg-slate-900 text-white p-6 relative">
            <button 
              onClick={() => setShowProfile(false)} 
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition p-1.5 hover:bg-white/10 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="flex items-center gap-4 mt-2">
              <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-white font-black text-xl uppercase shrink-0">
                {profile?.firstName?.[0] || 'U'}{profile?.lastName?.[0] || ''}
              </div>
              <div>
                <h3 className="font-extrabold text-lg tracking-tight">{profile?.firstName} {profile?.lastName}</h3>
                <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mt-0.5">{profile?.jobTitle || 'Movit Officer'}</p>
              </div>
            </div>
          </div>

          {/* Details list */}
          <div className="p-6 space-y-4">
            
            {/* Account Status */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Account Status</span>
              <span className="inline-flex items-center gap-1 text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 px-2.5 py-0.5 rounded-full uppercase">
                <CheckCircle2 className="w-3.5 h-3.5" /> ACTIVE
              </span>
            </div>

            {/* Department */}
            <div className="flex items-start gap-3">
              <div className="p-2 bg-slate-100 rounded-lg text-slate-500 shrink-0">
                <Building2 className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Department Division</p>
                <p className="text-sm font-bold text-slate-800">{profile?.department || 'Sales & Operations'}</p>
              </div>
            </div>

            {/* Supervisor */}
            <div className="flex items-start gap-3">
              <div className="p-2 bg-slate-100 rounded-lg text-slate-500 shrink-0">
                <User className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Direct Supervisor</p>
                <p className="text-sm font-bold text-slate-800">
                  {profile?.managerFirstName && profile?.managerLastName 
                    ? `${profile.managerFirstName} ${profile.managerLastName}` 
                    : 'Samuel Okello (Regional Supervisor)'}
                </p>
              </div>
            </div>

            {/* Employee ID */}
            {profile?.employeeNumber && (
              <div className="flex items-start gap-3">
                <div className="p-2 bg-slate-100 rounded-lg text-slate-500 shrink-0">
                  <BadgeCheck className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Employee Identification</p>
                  <p className="text-sm font-bold text-slate-800">{profile.employeeNumber}</p>
                </div>
              </div>
            )}

            {/* Phone */}
            {profile?.phone && (
              <div className="flex items-start gap-3">
                <div className="p-2 bg-slate-100 rounded-lg text-slate-500 shrink-0">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Contact Number</p>
                  <p className="text-sm font-semibold text-slate-700">{profile.phone}</p>
                </div>
              </div>
            )}

            {/* Joined Department */}
            <div className="flex items-start gap-3">
              <div className="p-2 bg-slate-100 rounded-lg text-slate-500 shrink-0">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Date Joined Department</p>
                <p className="text-sm font-semibold text-slate-700">
                  {profile?.dateJoinedDepartment 
                    ? new Date(profile.dateJoinedDepartment).toLocaleDateString(undefined, { dateStyle: 'long' }) 
                    : new Date().toLocaleDateString(undefined, { dateStyle: 'long' })}
                </p>
              </div>
            </div>

            {/* Onboarding Completed */}
            <div className="flex items-start gap-3">
              <div className="p-2 bg-slate-100 rounded-lg text-slate-500 shrink-0">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Onboarding Completed At</p>
                <p className="text-sm font-semibold text-slate-700">
                  {profile?.onboardingCompletedAt 
                    ? new Date(profile.onboardingCompletedAt).toLocaleString() 
                    : new Date().toLocaleString()}
                </p>
              </div>
            </div>

          </div>

          {/* Action button */}
          <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end shrink-0">
            <button 
              onClick={() => setShowProfile(false)} 
              className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition shadow-sm"
            >
              CLOSE
            </button>
          </div>
        </div>
      </div>
    )}
    </div>
  );
}
