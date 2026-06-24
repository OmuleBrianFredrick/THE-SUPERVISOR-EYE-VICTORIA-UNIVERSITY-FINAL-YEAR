import { Navigate } from 'react-router';
import { useAuth } from '../../contexts/AuthContext';
import { ReactNode } from 'react';

export const AuthGuard = ({ children }: { children: ReactNode }) => {
  const { currentUser, profile, loading, requiresOnboarding, accountStatus } = useAuth();

  if (loading) return null; // or a spinner

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (requiresOnboarding) {
    return <Navigate to="/onboarding" replace />;
  }

  if (!profile) {
    if (accountStatus === 'PENDING_APPROVAL') return <Navigate to="/pending-approval" replace />;
    if (accountStatus === 'REJECTED') return <Navigate to="/rejected" replace />;
    return <Navigate to="/login" replace />;
  }

  if (profile.status !== 'ACTIVE') {
    return <Navigate to="/inactive" replace />;
  }

  return <>{children}</>;
};

export const RoleGuard = ({ children, allowedRoles }: { children: ReactNode, allowedRoles: string[] }) => {
  const { profile, loading } = useAuth();

  if (loading) return null;

  if (!profile || !allowedRoles.includes(profile.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};
