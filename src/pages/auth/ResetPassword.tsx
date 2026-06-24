import { useState } from 'react';
import { sendPasswordResetEmail } from '../../lib/firebase';
import { auth } from '../../lib/firebase';
import { Link } from 'react-router';

export default function ResetPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    
    try {
      // Log request
      await fetch('/api/v1/auth/public-audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'PASSWORD_RESET_REQUESTED', metadata: { email } })
      });
      
      await sendPasswordResetEmail(auth, email);
      setMessage('Password reset email sent. Please check your inbox.');
      
      // Log completion
      await fetch('/api/v1/auth/public-audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'PASSWORD_RESET_COMPLETED', metadata: { email } })
      });
    } catch (err: any) {
      setError(err.message || 'Failed to send reset email.');
    }
    setLoading(false);
  };

  return (
    <div className="flex h-screen bg-slate-50 items-center justify-center p-4 font-sans">
      <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
        <h2 className="text-2xl font-bold tracking-tight text-slate-800 mb-2">Reset Password</h2>
        <p className="text-sm text-slate-500 mb-6">Enter your Movit Group email address to receive reset instructions.</p>
        
        {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-6 font-medium">{error}</div>}
        {message && <div className="bg-emerald-50 text-emerald-600 p-3 rounded-lg text-sm mb-6 font-medium">{message}</div>}

        <form onSubmit={handleReset} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Email Address</label>
            <input 
              type="email" 
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-slate-900 text-white font-bold py-3 rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            {loading ? 'SENDING...' : 'SEND RESET LINK'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link to="/login" className="text-sm font-bold text-slate-600 hover:text-slate-900 transition-colors">
            Return to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
