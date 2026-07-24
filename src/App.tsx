import React from 'react';
import { Routes, Route } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import { AuthGuard, RoleGuard } from './components/auth/AuthGuard';
import IframeBreakoutBanner from './components/IframeBreakoutBanner';
import SessionTimeout from './components/auth/SessionTimeout';
import LivePushNotifications from './components/LivePushNotifications';
import { ErrorBoundary } from './components/ErrorBoundary';

// Pages
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Legal from './pages/Legal';
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
import Reports from './pages/Reports';
import EvidenceLibrary from './pages/EvidenceLibrary';

// Configure query client with default options
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: true,
      retry: 2,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <AuthProvider>
          <IframeBreakoutBanner />
          <SessionTimeout />
          <LivePushNotifications />
          <ErrorBoundary>
            <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/privacy" element={<Legal />} />
          <Route path="/terms" element={<Legal />} />
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
          
          <Route path="/reports" element={
            <AuthGuard>
              <Reports />
            </AuthGuard>
          } />
          <Route path="/evidence" element={
            <AuthGuard>
              <RoleGuard allowedRoles={['SUPER_ADMIN', 'SYSTEM_ADMIN', 'Executive', 'MD / Ops Director', 'Platform Admin', 'Administrator', 'IT_ADMIN', 'IT_SUPPORT', 'NETWORK_ADMIN', 'SECURITY_ADMIN', 'DATABASE_ADMIN']}>
                <EvidenceLibrary />
              </RoleGuard>
            </AuthGuard>
          } />
          
          <Route path="/admin/approvals" element={
            <AuthGuard>
              <RoleGuard allowedRoles={['SUPER_ADMIN', 'SYSTEM_ADMIN', 'Executive', 'MD / Ops Director', 'Platform Admin', 'Administrator', 'IT_ADMIN', 'IT_SUPPORT', 'NETWORK_ADMIN', 'SECURITY_ADMIN', 'DATABASE_ADMIN']}>
                <ApprovalQueue />
              </RoleGuard>
            </AuthGuard>
          } />

          <Route path="/eacc" element={
            <AuthGuard>
              <RoleGuard allowedRoles={['SUPER_ADMIN', 'SYSTEM_ADMIN', 'Executive', 'MD / Ops Director', 'Platform Admin', 'Administrator', 'IT_ADMIN', 'IT_SUPPORT', 'NETWORK_ADMIN', 'SECURITY_ADMIN', 'DATABASE_ADMIN']}>
                <EACC />
              </RoleGuard>
            </AuthGuard>
          } />
            </Routes>
          </ErrorBoundary>
        </AuthProvider>
    </ToastProvider>
    </QueryClientProvider>
  );
}
