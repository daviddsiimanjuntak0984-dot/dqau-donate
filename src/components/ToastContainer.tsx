import React, { useState, useEffect } from 'react';
import { subscribeToasts, type ToastMessage } from '../services/toast';
import { CheckCircle2, Info, AlertTriangle, AlertCircle } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    const unsubscribe = subscribeToasts((updatedToasts) => {
      setToasts(updatedToasts);
    });
    return unsubscribe;
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[9999] max-w-sm w-full space-y-2 pointer-events-none px-3">
      {toasts.map((toast) => {
        let icon = <Info size={18} className="text-blue-400 shrink-0" />;
        let borderClass = 'border-blue-500/40 bg-blue-950/90 text-blue-100';

        if (toast.type === 'success') {
          icon = <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />;
          borderClass = 'border-emerald-500/40 bg-[#0B1A1E]/95 text-emerald-100';
        } else if (toast.type === 'warning') {
          icon = <AlertTriangle size={18} className="text-amber-400 shrink-0" />;
          borderClass = 'border-amber-500/40 bg-[#1A1608]/95 text-amber-100';
        } else if (toast.type === 'error') {
          icon = <AlertCircle size={18} className="text-red-400 shrink-0" />;
          borderClass = 'border-red-500/40 bg-[#1E0E12]/95 text-red-100';
        }

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl border shadow-2xl backdrop-blur-md animate-fade transition ${borderClass}`}
          >
            {icon}
            <div className="flex-1 text-xs font-medium leading-relaxed">
              {toast.message}
            </div>
          </div>
        );
      })}
    </div>
  );
};
