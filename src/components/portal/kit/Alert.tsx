"use client";

import { AlertTriangle, CheckCircle2, Info, X, XCircle } from "lucide-react";

export type AlertTone = "info" | "success" | "warning" | "error";

/* Tones map to frozen tokens only (09b §9's status registry does the same
   mapping for pills): success -> approved, warning -> yellow with black text
   (the same contrast fix as StatusPill), error -> maroon, info -> holiday. */
const SKIN: Record<AlertTone, string> = {
  info: "bg-[color:var(--color-holiday)]/10 border-[color:var(--color-holiday)]/30 text-black",
  success: "bg-[color:var(--tint-approved)] border-[color:var(--color-approved)]/40 text-black",
  warning: "bg-[color:var(--tint-yellow)] border-[color:var(--color-yellow)]/60 text-black",
  error: "bg-[color:var(--tint-maroon)] border-[color:var(--color-maroon)]/30 text-black",
};

const ICON: Record<AlertTone, typeof Info> = {
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  error: XCircle,
};

/** Page-level inline banner. Never the only carrier of a mutation result — see
 *  Toast for that; this is for page-load and validation-summary messages. */
export default function Alert({
  tone,
  title,
  children,
  action,
  onDismiss,
}: {
  tone: AlertTone;
  title: string;
  children?: React.ReactNode;
  action?: { label: string; onClick: () => void };
  onDismiss?: () => void;
}) {
  const Icon = ICON[tone];
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={`flex items-start gap-3 rounded-[var(--radius-md)] border px-4 py-3 ${SKIN[tone]}`}
    >
      <Icon className="mt-0.5 h-5 w-5 shrink-0" strokeWidth={1.75} aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="t-h3">{title}</p>
        {children && <div className="t-sm mt-1 text-black/80">{children}</div>}
        {action && (
          <button
            type="button"
            onClick={action.onClick}
            className="t-sm mt-2 font-semibold underline underline-offset-2 hover:opacity-70"
          >
            {action.label}
          </button>
        )}
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss"
          className="shrink-0 text-black/60 hover:text-black"
        >
          <X className="h-4 w-4" strokeWidth={1.75} aria-hidden />
        </button>
      )}
    </div>
  );
}
