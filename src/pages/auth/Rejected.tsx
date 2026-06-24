import { LogOut } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export default function Rejected() {
  const { logout } = useAuth();
  
  return (
    <div className="flex h-screen bg-slate-50 items-center justify-center p-4 font-sans text-center">
      <div className="max-w-md w-full">
        <div className="p-4 bg-red-100 text-red-800 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
          <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 mb-2">Account Rejected</h2>
        <p className="text-slate-500 mb-8 max-w-sm mx-auto">
          Your access request has been declined by an administrator. Please contact IT support if you believe this is an error.
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
