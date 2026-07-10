import { useEffect, useState, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { NotificationService, NotificationRecord } from '../../services/NotificationService';
import { Bell, Check, Mail, CheckCircle, AlertCircle, Building2, UserPlus, Info, Calendar } from "lucide-react";
import { useInvalidateQueries } from "../../hooks/useQueries";
import { motion, AnimatePresence } from 'motion/react';

export default function NotificationDropdown() {
  const { profile } = useAuth();
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const invalidateQueries = useInvalidateQueries();

  const userId = profile?.id || null;

  // Real-time listener
  useEffect(() => {
    // Seed initial welcome notifications if empty
    NotificationService.seedInitialNotifications(userId);

    const unsubscribe = NotificationService.subscribeToNotifications(userId, (data) => {
      setNotifications(prev => {
        if (prev.length > 0 && data.length > 0 && data[0].id !== prev[0].id) {
          invalidateQueries([["tasks"], ["reports"], ["approvals"], ["users"], ["evidence"], ["stats"]]);
        }
        return data;
      });
    });

    return () => unsubscribe();
  }, [userId]);

  // Click outside listener to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await NotificationService.markAsRead(id);
  };

  const handleMarkAllRead = async () => {
    await NotificationService.markAllAsRead(userId);
  };

  const getIcon = (category: NotificationRecord['category'], type: string) => {
    const size = "w-4 h-4";
    switch (category) {
      case 'ACCOUNT_APPROVED':
        return <CheckCircle className={`${size} text-emerald-500`} />;
      case 'ACCOUNT_REJECTED':
        return <AlertCircle className={`${size} text-red-500`} />;
      case 'PENDING_APPROVAL':
        return <UserPlus className={`${size} text-amber-500`} />;
      case 'REPORT_APPROVED':
        return <Check className={`${size} text-emerald-500`} />;
      case 'REPORT_REJECTED':
        return <AlertCircle className={`${size} text-red-500`} />;
      case 'TASK_ASSIGNED':
        return <Calendar className={`${size} text-blue-500`} />;
      case 'ADMIN_ANNOUNCEMENT':
        return <Building2 className={`${size} text-slate-500`} />;
      default:
        return <Info className={`${size} text-blue-500`} />;
    }
  };

  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const diffMs = Date.now() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      
      return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900 rounded-full transition flex items-center justify-center shadow-sm"
        id="notification-bell-button"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span 
            className="absolute -top-1 -right-1 bg-red-500 text-white font-black text-[10px] w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow-sm animate-bounce"
            id="notification-badge-count"
          >
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Card */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95, transition: { duration: 0.15 } }}
            className="absolute right-0 mt-3 w-80 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden z-50 animate-scaleIn"
            id="notification-dropdown-card"
          >
            {/* Header */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h4 className="font-extrabold text-sm tracking-tight">Notifications</h4>
                <p className="text-[10px] text-slate-300 font-semibold uppercase mt-0.5">
                  {unreadCount} UNREAD ALERTS
                </p>
              </div>
              {unreadCount > 0 && (
                <button 
                  onClick={handleMarkAllRead}
                  className="text-[11px] font-bold text-amber-400 hover:text-amber-300 transition uppercase tracking-wider"
                >
                  Mark All Read
                </button>
              )}
            </div>

            {/* Notifications List */}
            <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 min-h-[100px]">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs font-semibold">
                  No alerts on your dashboard.
                </div>
              ) : (
                notifications.map((n) => (
                  <div 
                    key={n.id} 
                    className={`p-3.5 flex gap-3 transition-colors relative cursor-pointer hover:bg-slate-50 ${!n.read ? 'bg-amber-50/20' : ''}`}
                    onClick={() => NotificationService.markAsRead(n.id)}
                  >
                    {/* Unread dot */}
                    {!n.read && (
                      <span className="absolute top-4 right-4 w-2 h-2 rounded-full bg-amber-500"></span>
                    )}

                    {/* Icon Container */}
                    <div className="w-8 h-8 rounded-xl bg-slate-100 border border-slate-200/60 flex items-center justify-center shrink-0">
                      {getIcon(n.category, n.type)}
                    </div>

                    {/* Wording */}
                    <div className="flex-1 pr-4">
                      <h5 className={`text-xs font-extrabold tracking-tight text-slate-800 ${!n.read ? 'text-slate-950 font-black' : ''}`}>
                        {n.title}
                      </h5>
                      <p className="text-[11px] text-slate-500 mt-1 leading-normal font-medium">
                        {n.message}
                      </p>
                      <span className="text-[9px] text-slate-400 font-semibold block mt-1.5 uppercase">
                        {formatTime(n.timestamp)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="p-3 bg-slate-50 border-t border-slate-100 text-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Supervisor Eye Security
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
