"use client";

import { useState } from "react";
import type { ArchiveCycle, ArchiveDetail as Detail, ArchiveEntry, ArchiveFile, ArchiveIssue, CycleContents, CycleDoc, CycleProgram } from "@/lib/archive-model";
import ArchiveCompare from "./ArchiveCompare";
import ArchiveCycles from "./ArchiveCycles";
import ArchiveCycleView from "./ArchiveCycleView";
import ArchiveDetail from "./ArchiveDetail";
import ArchiveList, { archiveAreas } from "./ArchiveList";
import Card, { CardHead } from "./Card";
import FileViewModal from "./FileViewModal";
import StatTile, { StatGrid } from "./StatTile";
import useNav from "./nav";

export default function ArchiveBrowser({
  entries,
  cycles,
  cycleId,
  contents,
  selectedId,
  detail,
  viewer,
  own,
}: {
  entries: ArchiveEntry[];
  cycles: ArchiveCycle[];
  cycleId: string | null;
  contents: CycleContents | null;
  selectedId: string | null;
  detail: Detail | null;
  viewer: string;
  own?: boolean;
}) {
  const nav = useNav();
  const [cmp, setCmp] = useState<ArchiveIssue | null>(null);
  const [file, setFile] = useState<ArchiveFile | null>(null);
  const [doc, setDoc] = useState<{ d: CycleDoc; p: CycleProgram } | null>(null);
  const entry = selectedId ? entries.find((e) => e.id === selectedId) : null;
  const cycle = cycleId ? cycles.find((c) => c.id === cycleId) : null;

  const open = (id: string) => nav.push(`/portal/archive?id=${id}`);
  const back = () => nav.push(cycleId ? `/portal/archive?cycle=${cycleId}` : "/portal/archive");

  if (entry)
    return (
      <>
        <ArchiveDetail entry={entry} detail={detail} own={own} onBack={back} onCompare={setCmp} onView={setFile} />
        {cmp && <ArchiveCompare entry={entry} issue={cmp} own={own} onClose={() => setCmp(null)} />}
        {file && <FileViewModal title={file.title} sub={`Archive · ${entry.short} · ${entry.cycle}`} src={`/api/documents/download?source=repository&id=${file.id}`} viewer={viewer} onClose={() => setFile(null)} />}
      </>
    );

  if (cycle && contents)
    return (
      <>
        <ArchiveCycleView cycle={cycle} contents={contents} own={own} onBack={() => nav.push("/portal/archive")} onRecord={open} onView={(d, p) => setDoc({ d, p })} />
        {doc && <FileViewModal title={doc.d.title} sub={`${cycle.name} · ${doc.p.short} · ${doc.d.area}`} src={`/api/documents/download?source=submission&id=${doc.d.id}`} viewer={viewer} own={own} onClose={() => setDoc(null)} />}
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
      {cycles.length > 0 && (
        <Card>
          <CardHead title="Closed cycles" sub="Cycles QAC has closed. Their submissions are frozen as read-only history. Select one to see what was submitted and what happened in it." />
          <ArchiveCycles cycles={cycles} onPick={(id) => nav.push(`/portal/archive?cycle=${id}`)} />
        </Card>
      )}
      <Card>
        <CardHead title="Accreditation Archive" sub={own ? "Finished accreditations of your programs: what was flagged, what you changed and the result. View only." : "Finished accreditations: what the accreditors flagged, what the program changed and the result. Filter by Area to see what other programs prepared."} />
        <ArchiveList entries={entries} onOpen={open} filterable={!own} areas={archiveAreas(entries)} />
      </Card>
    </>
  );
}
