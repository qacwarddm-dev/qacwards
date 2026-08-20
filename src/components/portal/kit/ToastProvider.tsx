"use client";

import { CheckCircle2, Info, X, XCircle, AlertTriangle } from "lucide-react";
import { createContext, useCallback, useContext, useId, useMemo, useState } from "react";

export type Toast = {
  id: string;
  tone: "info" | "success" | "warning" | "error";
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
  duration?: number;
};

type ToastContextValue = {
  push(t: Omit<Toast, "id">): void;
  dismiss(id: string): void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

/** Mutations report through here; validation reports inline on the field
 *  (09-ui-refactor §F8). Mounted once, in the portal and auth layouts. */
export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside a ToastProvider");
  return ctx;
}

const ICON: Record<Toast["tone"], typeof Info> = {
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  error: XCircle,
};

const SKIN: Record<Toast["tone"], string> = {
  info: "border-l-[color:var(--color-holiday)]",
  success: "border-l-[color:var(--color-approved)]",
  warning: "border-l-[color:var(--color-yellow)]",
  error: "border-l-[color:var(--color-maroon)]",
};

const DEFAULT_DURATION = 5000;

export default function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (t: Omit<Toast, "id">) => {
      const id = crypto.randomUUID();
      setToasts((prev) => [...prev, { ...t, id }]);
      const duration = t.duration ?? DEFAULT_DURATION;
      if (duration > 0) setTimeout(() => dismiss(id), duration);
    },
    [dismiss],
  );

  const value = useMemo(() => ({ push, dismiss }), [push, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        role="region"
        aria-label="Notifications"
        className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex flex-col items-center gap-2 p-4 sm:items-end"
      >
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onDismiss={() => dismiss(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const Icon = ICON[toast.tone];
  const headingId = useId();
  return (
    <div
      role="status"
      aria-labelledby={headingId}
      className={`pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-[var(--radius-md)] border-l-4 bg-white p-4 shadow-[var(--elev-3)] motion-safe:animate-[toast-in_var(--motion-base)_var(--ease-out)] ${SKIN[toast.tone]}`}
    >
      <Icon className="mt-0.5 h-5 w-5 shrink-0 text-black" strokeWidth={1.75} aria-hidden />
      <div className="min-w-0 flex-1">
        <p id={headingId} className="t-h3 text-black">
          {toast.title}
        </p>
        {toast.description && <p className="t-sm mt-1 text-black/70">{toast.description}</p>}
        {toast.action && (
          <button
            type="button"
            onClick={toast.action.onClick}
            className="t-sm mt-2 font-semibold text-maroon underline underline-offset-2 hover:opacity-70"
          >
            {toast.action.label}
          </button>
        )}
      </div>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss notification"
        className="shrink-0 text-black/50 hover:text-black"
      >
        <X className="h-4 w-4" strokeWidth={1.75} aria-hidden />
      </button>
    </div>
  );
}
