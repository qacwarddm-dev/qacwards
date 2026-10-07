"use client";

import { useState } from "react";
import Card, { CardHead } from "../../kit/Card";
import RecentlyDeleted from "../../kit/RecentlyDeleted";
import SegTabs from "../../kit/SegTabs";
import type { RecentlyDeletedData } from "@/lib/recently-deleted";
import { purgeCommonDoc, restoreCommonDoc } from "@/lib/qac-document-actions";
import { purgeCopcFile, restoreCopcFile } from "@/lib/repository-actions";
import { purgeProgram, purgeUser, restoreProgram, restoreUser } from "@/lib/settings-actions";

type Tab = "files" | "docs" | "programs" | "users";

export default function QacRecentlyDeleted({ data }: { data: RecentlyDeletedData }) {
  const [tab, setTab] = useState<Tab>("files");
  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: "files", label: "AACCUP & COPC", count: data.files.length || undefined },
    { key: "docs", label: "Common Documents", count: data.docs.length || undefined },
    ...(data.programs ? [{ key: "programs" as const, label: "Programs", count: data.programs.length || undefined }] : []),
    ...(data.users ? [{ key: "users" as const, label: "Users", count: data.users.length || undefined }] : []),
  ];
  return (
    <Card>
      <CardHead title="Recently Deleted" sub="Anything deleted from the portal stays here until you restore it or delete it permanently" />
      <SegTabs value={tab} onChange={setTab} tabs={tabs} />
      {tab === "files" && <RecentlyDeleted page items={data.files} onRestore={restoreCopcFile} onDelete={purgeCopcFile} emptyText="No deleted AACCUP & COPC files." />}
      {tab === "docs" && <RecentlyDeleted page items={data.docs} onRestore={restoreCommonDoc} onDelete={purgeCommonDoc} emptyText="No deleted common documents." />}
      {tab === "programs" && data.programs && (
        <RecentlyDeleted page items={data.programs.map((p) => ({ ...p, kind: "program" as const }))} onRestore={restoreProgram} onDelete={purgeProgram} emptyText="No deleted programs." />
      )}
      {tab === "users" && data.users && <RecentlyDeleted page items={data.users.map((u) => ({ ...u, kind: "person" as const }))} onRestore={restoreUser} onDelete={purgeUser} emptyText="No deleted users." />}
    </Card>
  );
}
