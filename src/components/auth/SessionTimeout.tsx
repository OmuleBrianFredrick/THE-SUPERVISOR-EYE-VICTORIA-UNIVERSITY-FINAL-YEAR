import { useEffect, useState, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { AlertCircle, Clock, LogOut } from 'lucide-react';

// Configuration: 10 minutes of complete inactivity before warning, then 60 seconds countdown.
const IDLE_LIMIT = 10 * 60 * 1000; 
const WARNING_LIMIT = 60; // seconds

export default function SessionTimeout() {
  const { currentUser, logout } = useAuth();
  const [showWarning, setShowWarning] = useState(false);
  const [countdown, setCountdown] = useState(WARNING_LIMIT);
  
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Function to reset the inactivity timer
  const resetIdleTimer = () => {
    if (showWarning) return; // Don't reset if we are already showing the warning modal

    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
    }

    idleTimerRef.current = setTimeout(() => {
      // Trigger warning after IDLE_LIMIT
      setShowWarning(true);
      setCountdown(WARNING_LIMIT);
    }, IDLE_LIMIT);
  };

  // Setup user activity listeners
  useEffect(() => {
    if (!currentUser) {
      // Clear timers if user is logged out
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
      setShowWarning(false);
      return;
    }

    const events = ['mousemove', 'keydown', 'scroll', 'click', 'touchstart'];
    
    // Add event listeners
    events.forEach(event => {
      window.addEventListener(event, resetIdleTimer);
    });

    // Initial trigger
    resetIdleTimer();

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, resetIdleTimer);
      });
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    };
  }, [currentUser, showWarning]);

  // Handle warning countdown ticking
  useEffect(() => {
    if (showWarning) {
      countdownTimerRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(countdownTimerRef.current!);
            handleLogout();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
      }
    }

    return () => {
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    };
  }, [showWarning]);

  const handleLogout = async () => {
    setShowWarning(false);
    await logout();
  };

  const handleContinue = () => {
    setShowWarning(false);
    resetIdleTimer();
  };

  if (!showWarning || !currentUser) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
      <div 
        id="session-timeout-modal"
        className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden p-6 text-center animate-scaleIn"
      >
        <div className="mx-auto w-16 h-16 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mb-4">
          <Clock className="w-8 h-8 animate-pulse" />
        </div>
        
        <h3 className="text-xl font-extrabold text-slate-800 tracking-tight mb-2">Session Inactivity Alert</h3>
        
        <p className="text-slate-500 text-sm mb-6 leading-relaxed">
          Your session has been idle. For security, you will be automatically logged out in{' '}
          <span className="font-bold text-amber-600 text-base">{countdown}</span> seconds.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button 
            onClick={handleContinue}
            className="flex-1 px-5 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm rounded-xl transition shadow-sm"
          >
            Continue Working
          </button>
          
          <button 
            onClick={handleLogout}
            className="flex-1 px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-xl transition flex items-center justify-center gap-1.5"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
