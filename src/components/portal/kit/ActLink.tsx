"use client";

import { useState } from "react";
import { MiniRing } from "./Spinner";

export default function ActLink({ onClick, plain, children }: { onClick: () => unknown; plain?: boolean; children: React.ReactNode }) {
  const [busy, setBusy] = useState(false);
  const cls = [plain ? "" : "lnk", busy ? "q-link-loading" : ""].filter(Boolean).join(" ");
  return (
    <a
      className={cls || undefined}
      role="button"
      aria-busy={busy || undefined}
      onClick={() => {
        if (busy) return;
        const r = onClick();
        if (r instanceof Promise) {
          setBusy(true);
          r.finally(() => setBusy(false));
        }
      }}
    >
      {busy && <MiniRing />}
      {children}
    </a>
  );
}
