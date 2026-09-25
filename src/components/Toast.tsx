import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  title: string;
  description?: string;
}

interface ToastProps {
  toast: ToastMessage | null;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ toast, onClose }) => {
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      onClose();
    }, 4500);
    return () => clearTimeout(timer);
  }, [toast, onClose]);

  if (!toast) return null;

  const bgStyles = {
    success: 'bg-emerald-900/95 text-white border-emerald-700',
    error: 'bg-rose-900/95 text-white border-rose-700',
    info: 'bg-slate-900/95 text-white border-slate-700'
  }[toast.type];

  const Icon = {
    success: CheckCircle2,
    error: AlertCircle,
    info: Info
  }[toast.type];

  const iconColor = {
    success: 'text-emerald-400',
    error: 'text-rose-400',
    info: 'text-sky-400'
  }[toast.type];

  return (
    <div
      id="toast-notification"
      role="status"
      aria-live="polite"
      className="fixed bottom-5 right-5 z-50 max-w-md w-full px-4 sm:px-0"
    >
      <div className={`flex items-start gap-3 p-4 rounded-lg shadow-xl border ${bgStyles}`}>
        <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${iconColor}`} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold leading-5">{toast.title}</p>
          {toast.description && (
            <p className="text-xs text-slate-200 mt-1 leading-normal break-words">{toast.description}</p>
          )}
        </div>
        <button
          id="btn-close-toast"
          onClick={onClose}
          className="text-slate-300 hover:text-white p-1 rounded transition-colors shrink-0"
          aria-label="Dismiss notification"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
