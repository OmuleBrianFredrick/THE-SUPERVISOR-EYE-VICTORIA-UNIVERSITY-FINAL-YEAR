import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router';
import { auth, createUserWithEmailAndPassword } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { Loader2, ArrowLeft } from 'lucide-react';
import GoogleSignInButton from '../../components/auth/GoogleSignInButton';

export default function SignUp() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { currentUser, setProfileForce } = useAuth(); 

  useEffect(() => {
    if (currentUser && !loading) {
      navigate('/dashboard');
    }
  }, [currentUser, loading, navigate]);

  const handleFetchProfile = async (token: string, method: string) => {
    try {
      const response = await fetch('/api/v1/auth/login-success', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ loginMethod: method })
      });

      if (!response.ok) {
        // Will likely 404 since it's a new account, this is expected since they haven't finished onboarding.
        // We'll let AuthContext catch it on next refresh and direct to /onboarding
      }

      navigate('/onboarding');
    } catch (err: any) {
      console.error(err);
      navigate('/onboarding');
    }
  };

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const userCred = await createUserWithEmailAndPassword(auth, email, password);
      const token = await userCred.user.getIdToken();
      await handleFetchProfile(token, 'EMAIL');
    } catch (err: any) {
      setError(err.message || 'Failed to create account');
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 items-center justify-center p-4 font-sans relative">
      <button 
        onClick={() => navigate('/')} 
        className="absolute top-6 left-6 flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
        <div className="flex justify-center mb-2">
          <img src="/logo.png" alt="Supervisor Eye Logo" className="h-32 w-auto object-contain" />
        </div>
        <p className="text-center text-sm font-semibold uppercase tracking-widest text-slate-500 mb-6">Create Account</p>
        
        <div className="mb-6">
          <GoogleSignInButton 
            label="SIGN UP WITH GOOGLE" 
            disabled={loading} 
            onLoadingChange={setLoading}
            onError={setError}
          />
        </div>

        <div className="mb-6 flex items-center justify-between">
          <hr className="w-full border-slate-200" />
          <span className="px-3 text-xs font-bold text-slate-400 uppercase shrink-0">Or with email</span>
          <hr className="w-full border-slate-200" />
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-6 font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleEmailSignUp} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Email Address</label>
            <input 
              type="email" 
              disabled={loading}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Password</label>
            <input 
              type="password" 
              disabled={loading}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-slate-900 text-white font-bold py-3 rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <><Loader2 className="w-5 h-5 animate-spin"/> Creating...</> : 'SIGN UP'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link to="/login" className="text-sm font-bold text-slate-600 hover:text-slate-900 transition-colors">
            Already have an account? Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
