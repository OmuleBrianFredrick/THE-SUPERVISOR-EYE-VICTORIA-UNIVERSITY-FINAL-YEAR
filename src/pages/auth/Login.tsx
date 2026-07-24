import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router';
import { 
  auth, 
  signInWithEmailAndPassword 
} from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { ArrowLeft, Loader2 } from 'lucide-react';
import GoogleSignInButton from '../../components/auth/GoogleSignInButton';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { currentUser, setProfileForce } = useAuth(); // for fast local Dev test if needed

  useEffect(() => {
    if (currentUser && !loading) {
      navigate('/dashboard');
    }
  }, [currentUser, loading, navigate]);

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
        if (response.status === 404) {
          // User not mapped yet, will be redirected to onboarding
          navigate('/dashboard');
          return;
        }
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



  const demoAccountsList = [
    { label: 'CEO — Executive', email: 'james.munene@movitgroup.com' },
    { label: 'Managing Director — Executive', email: 'simpson.birungi@movitgroup.com' },
    { label: 'Operations Director — Executive', email: 'bruce.mpamizo@movitgroup.com' },
    { label: 'Finance Director — Executive', email: 'adard.mukiibi@movitgroup.com' },
    { label: 'HR Director — Executive', email: 'evelyn.atieno@movitgroup.internal' },
    { label: 'Sales Manager — Manager', email: 'john.kato@movitgroup.internal' },
    { label: 'Distribution Manager — Manager', email: 'ronald.mayanja@movitgroup.internal' },
    { label: 'Sales Supervisor — Supervisor', email: 'samuel.okello@movitgroup.internal' },
    { label: 'Distribution Supervisor — Supervisor', email: 'mukasa.onyango@movitgroup.internal' },
    { label: 'Field Staff Officer — Field Staff', email: 'wasswa.robinson@movitgroup.internal' },
    { label: 'Platform Owner — Super Admin', email: 'christianekarel@gmail.com' },
  ];

  const handleSelectDemoUser = (selectedEmail: string) => {
    setEmail(selectedEmail);
    setPassword('Password123!');
  };

  return (
    <div className="flex h-screen bg-slate-50 items-center justify-center p-4 font-sans relative overflow-y-auto">
      <button 
        onClick={() => navigate('/')} 
        className="absolute top-6 left-6 flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 p-8 shadow-sm my-auto">
        <div className="flex justify-center mb-6">
          <img src="/logo.png" alt="Supervisor Eye Logo" className="h-48 w-auto object-contain" />
        </div>
        
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-6 font-medium">
            {error}
          </div>
        )}

        {/* Quick Demo Login Selector */}
        <div className="mb-6 p-3 bg-amber-50 border border-amber-200 rounded-xl">
          <label className="block text-xs font-bold text-amber-900 uppercase mb-1.5 flex items-center justify-between">
            <span>⚡ Demo Hierarchy Login Picker</span>
            <span className="text-[10px] text-amber-700 bg-amber-100 px-2 py-0.5 rounded font-medium">18 Accounts Synced</span>
          </label>
          <select 
            onChange={(e) => e.target.value && handleSelectDemoUser(e.target.value)}
            className="w-full text-xs bg-white border border-amber-300 rounded-lg p-2 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
            defaultValue=""
          >
            <option value="" disabled>Select a demo role to auto-fill credentials...</option>
            {demoAccountsList.map((acc) => (
              <option key={acc.email} value={acc.email}>
                {acc.label} ({acc.email})
              </option>
            ))}
          </select>
          <p className="text-[11px] text-amber-700 mt-1 font-sans">
            Password auto-fills as <code className="bg-amber-100 px-1 py-0.5 rounded text-amber-900 font-mono font-bold">Password123!</code>
          </p>
        </div>

        <form onSubmit={handleEmailLogin} className="space-y-4">
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
            <div className="flex justify-between mb-1">
              <label className="block text-xs font-bold text-slate-700 uppercase">Password</label>
              <Link to="/reset-password" className="text-xs text-amber-600 font-bold hover:underline">Forgot?</Link>
            </div>
            <input 
              type="password" 
              disabled={loading}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-slate-900 text-white font-bold py-3 rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Authenticating...</> : 'SIGN IN'}
          </button>
        </form>

        <div className="mt-6 flex items-center justify-between">
          <hr className="w-full border-slate-200" />
          <span className="px-3 text-xs font-bold text-slate-400 uppercase">Or</span>
          <hr className="w-full border-slate-200" />
        </div>

        <div className="mt-6">
          <GoogleSignInButton 
            label="SIGN IN WITH GOOGLE" 
            disabled={loading} 
            onLoadingChange={setLoading}
            onError={setError}
          />
        </div>

        <div className="mt-6 text-center">
          <Link to="/signup" className="text-sm font-bold text-slate-600 hover:text-slate-900 transition-colors">
            Don't have an account? Sign Up
          </Link>
        </div>
      </div>
    </div>
  );
}
