"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Toast, ToastType } from "@/types";

interface ToastContextType {
  toasts: Toast[];
  showToast: (title: string, message?: string, type?: ToastType) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
  dismissToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (title: string, message?: string, type: ToastType = "info") => {
      const id = Math.random().toString(36).substring(2, 9);
      const newToast: Toast = { id, title, message, type };

      setToasts((prev) => [...prev, newToast]);

      setTimeout(() => {
        dismissToast(id);
      }, 5000);
    },
    [dismissToast]
  );

  const success = useCallback((title: string, message?: string) => showToast(title, message, "success"), [showToast]);
  const error = useCallback((title: string, message?: string) => showToast(title, message, "error"), [showToast]);
  const info = useCallback((title: string, message?: string) => showToast(title, message, "info"), [showToast]);
  const warning = useCallback((title: string, message?: string) => showToast(title, message, "warning"), [showToast]);

  return (
    <ToastContext.Provider value={{ toasts, showToast, success, error, info, warning, dismissToast }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

function ToastContainer({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: string) => void }) {
  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
        ))}
      </AnimatePresence>
    </div>
  );
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  const icons = {
    success: <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />,
    error: <XCircle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />,
    warning: <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />,
    info: <Info className="h-4 w-4 text-indigo-500 shrink-0 mt-0.5" />,
  };

  const borders = {
    success: "border-emerald-500/20 bg-emerald-950/90 text-emerald-200 dark:border-emerald-500/30 dark:bg-emerald-950/95 dark:text-emerald-200 Light:border-emerald-200 Light:bg-emerald-50 Light:text-emerald-900",
    error: "border-rose-500/20 bg-rose-950/90 text-rose-200 dark:border-rose-500/30 dark:bg-rose-950/95 dark:text-rose-200 Light:border-rose-200 Light:bg-rose-50 Light:text-rose-900",
    warning: "border-amber-500/20 bg-amber-950/90 text-amber-200 dark:border-amber-500/30 dark:bg-amber-950/95 dark:text-amber-200 Light:border-amber-200 Light:bg-amber-50 Light:text-amber-900",
    info: "border-indigo-500/20 bg-indigo-950/90 text-indigo-200 dark:border-indigo-500/30 dark:bg-indigo-950/95 dark:text-indigo-200 Light:border-indigo-200 Light:bg-indigo-50 Light:text-indigo-900",
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16, scale: 0.94 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.94 }}
      transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
      className={cn(
        "pointer-events-auto relative overflow-hidden flex items-start gap-3 rounded-xl border p-3.5 shadow-xl backdrop-blur-xl",
        borders[toast.type]
      )}
    >
      {icons[toast.type]}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-foreground tracking-tight">{toast.title}</p>
        {toast.message && (
          <p className="mt-0.5 text-[11px] text-muted-foreground leading-relaxed">{toast.message}</p>
        )}
      </div>
      <button
        onClick={() => onDismiss(toast.id)}
        className="text-muted-foreground hover:text-foreground p-0.5 rounded-md hover:bg-muted/40 transition-colors"
      >
        <X className="h-3.5 w-3.5" />
      </button>

      {/* Subtle bottom progress bar */}
      <motion.div
        initial={{ scaleX: 1 }}
        animate={{ scaleX: 0 }}
        transition={{ duration: 5, ease: "linear" }}
        className="absolute bottom-0 left-0 right-0 h-0.5 bg-current opacity-30 origin-left"
      />
    </motion.div>
  );
}
