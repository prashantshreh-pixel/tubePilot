import React from 'react';
import { CheckCircle2, AlertTriangle, Info, XCircle, X } from 'lucide-react';
import { useAppStore, ToastItem } from '../store/useAppStore';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useAppStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col space-y-2 pointer-events-none max-w-sm w-full">
      {toasts.map((toast) => {
        const Icon =
          toast.type === 'success'
            ? CheckCircle2
            : toast.type === 'error'
            ? XCircle
            : toast.type === 'warning'
            ? AlertTriangle
            : Info;

        const borderCol =
          toast.type === 'success'
            ? 'border-emerald-500/50 text-emerald-400'
            : toast.type === 'error'
            ? 'border-rose-500/50 text-rose-400'
            : toast.type === 'warning'
            ? 'border-amber-500/50 text-amber-400'
            : 'border-blue-500/50 text-blue-400';

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start justify-between p-3.5 rounded-xl bg-dark-card/95 backdrop-blur-md border ${borderCol} shadow-xl shadow-black/40 animate-in slide-in-from-bottom-2 fade-in duration-200`}
          >
            <div className="flex items-start space-x-2.5">
              <Icon className="w-4 h-4 mt-0.5 shrink-0" />
              <p className="text-xs text-slate-200 leading-relaxed">{toast.message}</p>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="p-1 text-slate-400 hover:text-white transition shrink-0 ml-2"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
