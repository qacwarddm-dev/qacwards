"use client";

import { useState } from "react";
import type { ArchiveDetail as Detail, ArchiveEntry, ArchiveFile, ArchiveIssue } from "@/lib/archive-model";
import ArchiveCompare from "./ArchiveCompare";
import ArchiveDetail from "./ArchiveDetail";
import ArchiveList, { archiveAreas } from "./ArchiveList";
import Card, { CardHead } from "./Card";
import FileViewModal from "./FileViewModal";
import StatTile, { StatGrid } from "./StatTile";
import useNav from "./nav";

export default function ArchiveBrowser({
  entries,
  selectedId,
  detail,
  viewer,
  own,
}: {
  entries: ArchiveEntry[];
  selectedId: string | null;
  detail: Detail | null;
  viewer: string;
  own?: boolean;
}) {
  const nav = useNav();
  const [cmp, setCmp] = useState<ArchiveIssue | null>(null);
  const [file, setFile] = useState<ArchiveFile | null>(null);
  const entry = selectedId ? entries.find((e) => e.id === selectedId) : null;

  const open = (id: string) => nav.push(`/portal/archive?id=${id}`);
  const back = () => nav.push("/portal/archive");

  if (entry)
    return (
      <>
        <ArchiveDetail entry={entry} detail={detail} own={own} onBack={back} onCompare={setCmp} onView={setFile} />
        {cmp && <ArchiveCompare entry={entry} issue={cmp} own={own} onClose={() => setCmp(null)} />}
        {file && <FileViewModal title={file.title} sub={`Archive · ${entry.short} · ${entry.cycle}`} src={`/api/documents/download?source=repository&id=${file.id}`} viewer={viewer} onClose={() => setFile(null)} />}
      </>
    );

  const passed = entries.filter((e) => e.passed).length;
  return (
    <>
      {!own && (
        <StatGrid>
          <StatTile flat label="Archived accreditations" value={entries.length} sub="finished and recorded" />
          <StatTile flat label="Passed" value={passed} sub="with certificate" />
          <StatTile flat label="Deferred" value={entries.length - passed} sub="re-survey needed" />
          <StatTile flat label="Issues resolved" value={entries.reduce((s, e) => s + e.issues.length, 0)} sub="flagged → fixed → accepted" />
        </StatGrid>
      )}
      <Card>
        <CardHead title="Accreditation Archive" sub={own ? "Finished accreditations of your programs: what was flagged, what you changed and the result. View only." : "Finished accreditations: what the accreditors flagged, what the program changed and the result. Filter by Area to see what other programs prepared."} />
        <ArchiveList entries={entries} onOpen={open} filterable={!own} areas={archiveAreas(entries)} />
      </Card>
    </>
  );
}
