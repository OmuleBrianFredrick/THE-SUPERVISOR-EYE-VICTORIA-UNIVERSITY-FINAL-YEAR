import React, { createContext, useContext, useState, ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'warning' | 'error' | 'info';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  toast: (message: string, type?: ToastType) => void;
  success: (message: string) => void;
  warning: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastContextType>({} as ToastContextType);

export const useToast = () => useContext(ToastContext);

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = (message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    // Auto dismiss after 4 seconds
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  };

  const success = (msg: string) => toast(msg, 'success');
  const warning = (msg: string) => toast(msg, 'warning');
  const error = (msg: string) => toast(msg, 'error');
  const info = (msg: string) => toast(msg, 'info');

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const getToastStyle = (type: ToastType) => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-emerald-50 border-emerald-100',
          text: 'text-emerald-800',
          icon: <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
        };
      case 'warning':
        return {
          bg: 'bg-amber-50 border-amber-100',
          text: 'text-amber-800',
          icon: <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
        };
      case 'error':
        return {
          bg: 'bg-red-50 border-red-100',
          text: 'text-red-800',
          icon: <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
        };
      case 'info':
      default:
        return {
          bg: 'bg-blue-50 border-blue-100',
          text: 'text-blue-800',
          icon: <Info className="w-5 h-5 text-blue-500 shrink-0" />
        };
    }
  };

  return (
    <ToastContext.Provider value={{ toast, success, warning, error, info }}>
      {children}
      
      {/* Toast Render Area */}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 max-w-sm w-full pointer-events-none">
        <AnimatePresence>
          {toasts.map((t) => {
            const style = getToastStyle(t.type);
            return (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85, transition: { duration: 0.2 } }}
                className={`pointer-events-auto flex items-start gap-3 p-4 rounded-2xl border shadow-lg ${style.bg} transition-all`}
              >
                {style.icon}
                <div className={`flex-1 text-sm font-bold ${style.text} tracking-tight leading-snug`}>
                  {t.message}
                </div>
                <button
                  onClick={() => removeToast(t.id)}
                  className="text-slate-400 hover:text-slate-600 transition p-0.5"
                >
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};
