import React from 'react';
import { Routes, Route } from 'react-router';
import { AuthProvider } from './contexts/AuthContext';
import { AuthGuard, RoleGuard } from './components/auth/AuthGuard';
import IframeBreakoutBanner from './components/IframeBreakoutBanner';

// Pages
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Login from './pages/auth/Login';
import SignUp from './pages/auth/SignUp';
import ResetPassword from './pages/auth/ResetPassword';
import Unauthorized from './pages/auth/Unauthorized';
import Inactive from './pages/auth/Inactive';
import Onboarding from './pages/auth/Onboarding';
import PendingApproval from './pages/auth/PendingApproval';
import Rejected from './pages/auth/Rejected';
import ApprovalQueue from './pages/admin/ApprovalQueue';
import EACC from './pages/admin/EACC';

export default function App() {
  return (
    <AuthProvider>
      <IframeBreakoutBanner />
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/unauthorized" element={<Unauthorized />} />
        <Route path="/inactive" element={<Inactive />} />
        <Route path="/pending-approval" element={<PendingApproval />} />
        <Route path="/rejected" element={<Rejected />} />
        
        {/* Onboarding - protected lightly through logical redirects */}
        <Route path="/onboarding" element={<Onboarding />} />

        {/* Protected Routes */}
        <Route path="/" element={
          <Home />
        } />

        <Route path="/dashboard" element={
          <AuthGuard>
            <Dashboard />
          </AuthGuard>
        } />
        
        <Route path="/admin/approvals" element={
          <AuthGuard>
            <RoleGuard allowedRoles={['SUPER_ADMIN', 'SYSTEM_ADMIN', 'Executive', 'MD / Ops Director', 'Platform Admin', 'Administrator']}>
              <ApprovalQueue />
            </RoleGuard>
          </AuthGuard>
        } />

        <Route path="/eacc" element={
          <AuthGuard>
            <RoleGuard allowedRoles={['SUPER_ADMIN', 'SYSTEM_ADMIN', 'Executive', 'MD / Ops Director', 'Platform Admin', 'Administrator']}>
              <EACC />
            </RoleGuard>
          </AuthGuard>
        } />
      </Routes>
    </AuthProvider>
  );
}
