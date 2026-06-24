import { useAuth } from '../../contexts/AuthContext';

export default function Inactive() {
  const { logout } = useAuth();
  
  return (
    <div className="flex flex-col h-screen bg-slate-50 items-center justify-center p-4 font-sans text-center">
      <div className="w-16 h-16 bg-slate-200 text-slate-500 rounded-full flex items-center justify-center font-bold text-2xl mb-6">X</div>
      <h1 className="text-3xl font-black text-slate-800 tracking-tight mb-2">Account Inactive</h1>
      <p className="text-slate-500 max-w-md mb-8">
        Your account has been deactivated or suspended. Please contact HR or the System Administrator to restore access.
      </p>
      <button onClick={logout} className="px-6 py-3 bg-slate-900 text-white font-bold rounded-lg hover:bg-slate-800 transition">
        SIGN OUT
      </button>
    </div>
  );
}
