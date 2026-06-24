import { Link } from 'react-router';
import { useAuth } from '../../contexts/AuthContext';

export default function Unauthorized() {
  const { logout } = useAuth();
  
  return (
    <div className="flex flex-col h-screen bg-slate-50 items-center justify-center p-4 font-sans text-center">
      <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center font-bold text-2xl mb-6">!</div>
      <h1 className="text-3xl font-black text-slate-800 tracking-tight mb-2">Access Denied</h1>
      <p className="text-slate-500 max-w-md mb-8">
        You do not have the required permissions to view this module. Please contact your system administrator if you believe this is an error.
      </p>
      <div className="flex gap-4">
        <Link to="/" className="px-6 py-3 bg-slate-900 text-white font-bold rounded-lg hover:bg-slate-800 transition">
          RETURN TO DASHBOARD
        </Link>
        <button onClick={logout} className="px-6 py-3 bg-white border border-slate-200 text-slate-700 font-bold rounded-lg hover:bg-slate-50 transition">
          SIGN OUT
        </button>
      </div>
    </div>
  );
}
