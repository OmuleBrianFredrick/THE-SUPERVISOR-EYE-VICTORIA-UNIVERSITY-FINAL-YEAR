import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { auth, googleProvider, signInWithPopup } from '../../lib/firebase';
import { Loader2 } from 'lucide-react';

interface GoogleSignInButtonProps {
  label?: string;
  className?: string;
  disabled?: boolean;
  onLoadingChange?: (loading: boolean) => void;
  onError?: (error: string) => void;
}

export default function GoogleSignInButton({ 
  label = 'CONTINUE WITH GOOGLE', 
  className = '', 
  disabled = false,
  onLoadingChange,
  onError
}: GoogleSignInButtonProps) {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();

  const handleGoogleAuth = async () => {
    setLoading(true);
    if (onLoadingChange) onLoadingChange(true);
    setErrorMsg('');
    if (onError) onError('');
    try {
      // Execute popup sign-in (smoothly falls back to account simulation dialog if preview domain is unauthorized)
      const userCred = await signInWithPopup(auth, googleProvider);
      const token = await userCred.user.getIdToken();

      // Record authentication footprint on server
      await fetch('/api/v1/auth/login-success', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ loginMethod: 'GOOGLE' })
      });

      // Check whether account exists in platform and onboarding status
      const meRes = await fetch('/api/v1/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (meRes.ok) {
        const profileData = await meRes.json();
        // Hierarchy order: redirect existing onboarded accounts to dashboard, pending accounts to onboarding
        if (profileData?.onboardingComplete === false) {
          navigate('/onboarding');
        } else {
          navigate('/dashboard');
        }
      } else {
        // New account opening -> route directly to onboarding setup
        navigate('/onboarding');
      }
    } catch (err: any) {
      console.error('Google Auth Error:', err);
      let msg = 'Failed to authenticate via Google.';
      if (err?.code !== 'auth/popup-closed-by-user' && !err?.message?.includes('popup-closed')) {
        msg = err?.message || 'Failed to authenticate via Google.';
        setErrorMsg(msg);
        if (onError) onError(msg);
      }
    } finally {
      setLoading(false);
      if (onLoadingChange) onLoadingChange(false);
    }
  };

  return (
    <div className="w-full">
      {errorMsg && (
        <div className="bg-red-50 text-red-600 p-2.5 rounded-lg text-xs font-semibold mb-3 border border-red-200">
          {errorMsg}
        </div>
      )}
      <button 
        type="button"
        onClick={handleGoogleAuth}
        disabled={loading || disabled}
        className={`w-full flex items-center justify-center gap-3 bg-white border border-slate-200 font-bold text-slate-700 py-3 px-4 rounded-lg hover:bg-slate-50 active:bg-slate-100 transition-all shadow-sm disabled:opacity-50 text-sm ${className}`}
      >
        {loading ? (
          <Loader2 className="w-5 h-5 animate-spin text-slate-500" />
        ) : (
          <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
        )}
        <span>{loading ? 'Connecting Google Account...' : label}</span>
      </button>
    </div>
  );
}
