"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle2, AlertCircle, X, Info } from "lucide-react";

export type ToastType = "success" | "error" | "info";

interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
}

interface ToastContextType {
  toast: (payload: Omit<ToastMessage, "id">) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const toast = useCallback(({ type, title, message }: Omit<ToastMessage, "id">) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, type, title, message }]);

    // Auto dismiss after 5 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      
      {/* Toast Container */}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 w-80 bg-[#111111] border rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.8)] animate-in slide-in-from-right-8 slide-in-from-bottom-2 fade-in duration-300 relative overflow-hidden group
              ${t.type === 'success' ? 'border-emerald-500/30 hover:border-emerald-500/50' : 
                t.type === 'error' ? 'border-rose-500/30 hover:border-rose-500/50' : 
                'border-cyan-500/30 hover:border-cyan-500/50'}`}
          >
            {/* Background Glow */}
            <div className={`absolute -top-10 -right-10 w-32 h-32 rounded-full blur-2xl transition-colors pointer-events-none opacity-20
              ${t.type === 'success' ? 'bg-emerald-500' : 
                t.type === 'error' ? 'bg-rose-500' : 
                'bg-cyan-500'}`} 
            />

            {/* Icon */}
            <div className={`shrink-0 mt-0.5
              ${t.type === 'success' ? 'text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 
                t.type === 'error' ? 'text-rose-400 drop-shadow-[0_0_8px_rgba(244,63,94,0.5)]' : 
                'text-cyan-400 drop-shadow-[0_0_8px_rgba(6,182,212,0.5)]'}`}
            >
              {t.type === 'success' && <CheckCircle2 size={20} />}
              {t.type === 'error' && <AlertCircle size={20} />}
              {t.type === 'info' && <Info size={20} />}
            </div>

            {/* Content */}
            <div className="flex-1 pr-4 relative z-10">
              <h4 className="text-sm font-bold text-white tracking-wide">{t.title}</h4>
              {t.message && (
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  {t.message}
                </p>
              )}
            </div>

            {/* Close Button */}
            <button
              onClick={() => removeToast(t.id)}
              className="absolute top-3 right-3 text-slate-500 hover:text-white transition-colors p-1 bg-[#1A1A1A] hover:bg-[#222] rounded-md"
            >
              <X size={14} />
            </button>
            
            {/* Countdown Bar */}
            <div className={`absolute bottom-0 left-0 h-0.5 animate-shrink-width
              ${t.type === 'success' ? 'bg-emerald-500/50' : 
                t.type === 'error' ? 'bg-rose-500/50' : 
                'bg-cyan-500/50'}`} 
            />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
