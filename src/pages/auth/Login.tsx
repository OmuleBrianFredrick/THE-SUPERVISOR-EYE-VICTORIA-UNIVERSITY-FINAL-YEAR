import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router';
import { 
  auth, 
  googleProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword 
} from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { ArrowLeft } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { currentUser, setProfileForce } = useAuth(); // for fast local Dev test if needed

  useEffect(() => {
    if (currentUser) {
      navigate('/dashboard');
    }
  }, [currentUser, navigate]);

  const handleFetchProfile = async (token: string, method: string) => {
    try {
      // Record login
      const response = await fetch('/api/v1/auth/login-success', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ loginMethod: method })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to authenticate user footprint on server');
      }

      // Navigate to dashboard based on role logic
      navigate('/dashboard');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to load profile. Please verify your account is active.');
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const userCred = await signInWithEmailAndPassword(auth, email, password);
      const token = await userCred.user.getIdToken();
      await handleFetchProfile(token, 'EMAIL');
    } catch (err: any) {
      setError(err.message || 'Failed to login');
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      // Ensure popup is not blocked by checking if we are in iframe
      if (window.self !== window.top) {
        setError('Google Sign-In popup is blocked by the embedded preview. Please click the "Open in new tab" icon (arrow escaping square) in the top right to use Google Sign-In.');
        setLoading(false);
        return;
      }
      
      const userCred = await signInWithPopup(auth, googleProvider);
      const token = await userCred.user.getIdToken();
      await handleFetchProfile(token, 'GOOGLE');
    } catch (err: any) {
      if (err.message && err.message.includes('auth/unauthorized-domain')) {
        setError('Error: This domain is not authorized for Google Sign-In. Please add the preview URL to Firebase Authorized Domains.');
      } else {
        setError(err.message || 'Google login failed');
      }
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 items-center justify-center p-4 font-sans relative">
      <button 
        onClick={() => navigate(-1)} 
        className="absolute top-6 left-6 flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
        <div className="flex justify-center mb-6">
          <img src="/logo.png" alt="Supervisor Eye Logo" className="h-32 w-auto object-contain" />
        </div>
        
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-6 font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleEmailLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Email Address</label>
            <input 
              type="email" 
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-colors"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <div className="flex justify-between mb-1">
              <label className="block text-xs font-bold text-slate-700 uppercase">Password</label>
              <Link to="/reset-password" className="text-xs text-amber-600 font-bold hover:underline">Forgot?</Link>
            </div>
            <input 
              type="password" 
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-colors"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-slate-900 text-white font-bold py-3 rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            {loading ? 'Authenticating...' : 'SIGN IN'}
          </button>
        </form>

        <div className="mt-6 flex items-center justify-between">
          <hr className="w-full border-slate-200" />
          <span className="px-3 text-xs font-bold text-slate-400 uppercase">Or</span>
          <hr className="w-full border-slate-200" />
        </div>

        <button 
          onClick={handleGoogleLogin}
          disabled={loading}
          className="mt-6 w-full flex items-center justify-center gap-3 bg-white border border-slate-200 font-bold text-slate-700 py-3 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          SIGN IN WITH GOOGLE
        </button>

        <div className="mt-6 text-center">
          <Link to="/signup" className="text-sm font-bold text-slate-600 hover:text-slate-900 transition-colors">
            Don't have an account? Sign Up
          </Link>
        </div>
      </div>
    </div>
  );
}
