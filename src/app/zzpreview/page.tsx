"use client";

import "../portal/portal.css";
import "../portal/portal-extra.css";
import Card, { CardHead } from "@/components/portal/kit/Card";
import RecentlyDeleted from "@/components/portal/kit/RecentlyDeleted";
import ToastProvider from "@/components/portal/kit/ToastProvider";

const ok = async () => ({ ok: true as const });
const items = [
  { id: "1", title: "AACCUP Certificate – BSIT.pdf", sub: "BSIT · Sta. Mesa", deletedAt: "2026-10-06T08:00:00Z" },
  { id: "2", title: "COPC Evaluation 2025.pdf", sub: "BSCS · Main", deletedAt: "2026-10-04T08:00:00Z" },
  { id: "3", title: "Summary of Findings – Level II.pdf", sub: "BSIS · Taguig", deletedAt: "2026-09-30T08:00:00Z" },
];

export default function Preview() {
  return (
    <div className="qp" style={{ padding: 24, minHeight: "100dvh" }}>
      <ToastProvider>
        <Card>
          <CardHead title="Recently Deleted" sub="Anything deleted from the portal stays here until you restore it or delete it permanently" />
          <RecentlyDeleted page items={items} onRestore={ok} onDelete={ok} emptyText="Nothing deleted." />
        </Card>
        <div style={{ height: 24 }} />
        <Card>
          <CardHead title="Inline variant" sub="As used under AACCUP & COPC and Documents" />
          <RecentlyDeleted items={items.slice(0, 2)} onRestore={ok} />
        </Card>
      </ToastProvider>
    </div>
  );
}
