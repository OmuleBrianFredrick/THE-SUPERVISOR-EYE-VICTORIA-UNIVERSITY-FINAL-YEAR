import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { LogOut } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export default function PendingApproval() {
  const { currentUser, loading, requiresOnboarding, accountStatus, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading) {
      if (!currentUser) {
        navigate('/login', { replace: true });
      } else if (requiresOnboarding) {
        navigate('/onboarding', { replace: true });
      } else if (accountStatus === 'ACTIVE') {
        navigate('/dashboard', { replace: true });
      } else if (accountStatus === 'REJECTED') {
        navigate('/rejected', { replace: true });
      }
    }
  }, [currentUser, loading, requiresOnboarding, accountStatus, navigate]);
  
  return (
    <div className="flex h-screen bg-slate-50 items-center justify-center p-4 font-sans text-center">
      <div className="max-w-md w-full">
        <div className="p-4 bg-amber-100 text-amber-800 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
          <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 mb-2">Account Pending Review</h2>
        <p className="text-slate-500 mb-8 max-w-sm mx-auto">
          Your registration request is currently awaiting administrator approval. You will receive an email once your account has been reviewed.
        </p>
        <button 
          onClick={logout}
          className="inline-flex items-center gap-2 bg-white border border-slate-200 text-slate-700 font-bold py-2 px-6 rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
        >
          <LogOut className="w-4 h-4" />
          SIGN OUT
        </button>
      </div>
    </div>
  );
}
