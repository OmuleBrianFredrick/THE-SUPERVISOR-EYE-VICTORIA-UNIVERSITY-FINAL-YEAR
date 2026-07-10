import React from 'react';
import { Link, useLocation } from 'react-router';
import { Shield, FileText, ArrowLeft, CheckCircle2 } from 'lucide-react';

export default function Legal() {
  const location = useLocation();
  const isPrivacy = location.pathname.includes('privacy');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8 flex items-center justify-between border-b border-slate-800 pb-6">
          <Link to="/login" className="inline-flex items-center text-sm font-medium text-emerald-400 hover:text-emerald-300 transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Sign In
          </Link>
          <div className="flex space-x-4 text-sm">
            <Link 
              to="/privacy" 
              className={`pb-1 font-medium transition-colors ${isPrivacy ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Privacy Policy
            </Link>
            <Link 
              to="/terms" 
              className={`pb-1 font-medium transition-colors ${!isPrivacy ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Terms of Service
            </Link>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-8 shadow-xl">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-emerald-400">
              {isPrivacy ? <Shield className="w-6 h-6" /> : <FileText className="w-6 h-6" />}
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white">
                {isPrivacy ? 'Privacy Policy' : 'Terms of Service'}
              </h1>
              <p className="text-xs text-slate-400 font-mono">Supervisor Eye Enterprise Platform • Movit Group</p>
            </div>
          </div>

          {isPrivacy ? (
            <div className="space-y-6 text-slate-300 text-sm leading-relaxed">
              <p>
                <strong>Last Updated:</strong> June 2026
              </p>
              <p>
                Welcome to <strong>Supervisor Eye</strong>. We respect your privacy and are committed to protecting your corporate digital footprint and personal data.
              </p>
              <h2 className="text-lg font-semibold text-white pt-2">1. Data Collection & Purpose</h2>
              <p>
                Supervisor Eye exclusively collects user email addresses, basic Google profile names, and profile avatars via secure Firebase Authentication & Google OAuth 2.0. This information is utilized strictly for single sign-on (SSO) identity verification, role assignment, and internal enterprise authorization audit trails.
              </p>
              <h2 className="text-lg font-semibold text-white pt-2">2. Data Sharing & Third Parties</h2>
              <p>
                We do not sell, rent, or distribute employee or administrator authentication details to any external third parties or advertisers. All footprint data remains strictly within corporate cloud tenant boundaries.
              </p>
              <h2 className="text-lg font-semibold text-white pt-2">3. Data Security & Retention</h2>
              <p>
                Session tokens and authenticated credentials are encrypted in transit via industry-standard TLS. Footprint mappings are retained only as long as the user maintains an active role within the Movit Group corporate directory.
              </p>
              <div className="mt-8 pt-6 border-t border-slate-800 flex items-center text-xs text-slate-400">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 mr-2 shrink-0" />
                Compliant with Google API Services User Data Policy
              </div>
            </div>
          ) : (
            <div className="space-y-6 text-slate-300 text-sm leading-relaxed">
              <p>
                <strong>Last Updated:</strong> June 2026
              </p>
              <p>
                By accessing and signing into <strong>Supervisor Eye</strong>, you agree to comply with the following enterprise terms.
              </p>
              <h2 className="text-lg font-semibold text-white pt-2">1. Authorized Enterprise Use</h2>
              <p>
                Supervisor Eye is an internal operational control and supervisor oversight platform designed exclusively for authorized personnel, executives, and directors affiliated with Movit Group. Unauthorized access attempts are strictly prohibited and monitored.
              </p>
              <h2 className="text-lg font-semibold text-white pt-2">2. Account Responsibility</h2>
              <p>
                Users are responsible for safeguarding their Google Workspace credentials. Any activities or approvals executed under your authenticated footprint will be legally attributed to your designated user profile.
              </p>
              <h2 className="text-lg font-semibold text-white pt-2">3. System Availability</h2>
              <p>
                The platform is provided for internal governance and workflow management. Administrators reserve the right to revoke access privileges or suspend footprint sessions at any time to preserve security integrity.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
