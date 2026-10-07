"use client";

import { useState } from "react";
import type { ArchiveCycle, ArchiveDetail as Detail, ArchiveEntry, ArchiveFile, ArchiveIssue, CycleContents } from "@/lib/archive-model";
import ArchiveCompare from "./ArchiveCompare";
import ArchiveCycles from "./ArchiveCycles";
import ArchiveCycleView from "./ArchiveCycleView";
import ArchiveDetail from "./ArchiveDetail";
import ArchiveList, { archiveAreas } from "./ArchiveList";
import ArchiveProgramFiles from "./ArchiveProgramFiles";
import Card, { CardHead } from "./Card";
import FileViewModal from "./FileViewModal";
import StatTile, { StatGrid } from "./StatTile";
import useNav from "./nav";

export default function ArchiveBrowser({
  entries,
  cycles,
  cycleId,
  programId,
  contents,
  selectedId,
  detail,
  viewer,
  own,
}: {
  entries: ArchiveEntry[];
  cycles: ArchiveCycle[];
  cycleId: string | null;
  programId: string | null;
  contents: CycleContents | null;
  selectedId: string | null;
  detail: Detail | null;
  viewer: string;
  own?: boolean;
}) {
  const nav = useNav();
  const [cmp, setCmp] = useState<ArchiveIssue | null>(null);
  const [file, setFile] = useState<ArchiveFile | null>(null);
  const entry = selectedId ? entries.find((e) => e.id === selectedId) : null;
  const cycle = cycleId ? cycles.find((c) => c.id === cycleId) : null;

  const root = () => nav.push("/portal/archive");
  const toCycle = () => nav.push(cycle ? `/portal/archive?cycle=${cycle.id}` : "/portal/archive");
  const toFiles = () => nav.push(cycle && programId ? `/portal/archive?cycle=${cycle.id}&program=${programId}` : "/portal/archive");
  const fromFiles = Boolean(cycle && programId);

  if (entry)
    return (
      <>
        <ArchiveDetail
          entry={entry}
          detail={detail}
          own={own}
          backTo={fromFiles ? `${entry.short} files` : cycle ? "Closed cycle" : "Archive"}
          onRoot={root}
          onBack={fromFiles ? toFiles : cycle ? toCycle : root}
          onCompare={setCmp}
          onView={setFile}
        />
        {cmp && <ArchiveCompare entry={entry} issue={cmp} own={own} onClose={() => setCmp(null)} />}
        {file && <FileViewModal title={file.title} sub={`Archive · ${entry.short} · ${entry.cycle}`} src={`/api/documents/download?source=repository&id=${file.id}`} viewer={viewer} onClose={() => setFile(null)} />}
      </>
    );

  if (cycle && contents) {
    const program = programId ? contents.programs.find((p) => p.id === programId) : null;
    if (program)
      return (
        <ArchiveProgramFiles
          cycle={cycle}
          program={program}
          own={own}
          viewer={viewer}
          onRoot={root}
          onBack={toCycle}
          onRecord={(id) => nav.push(`/portal/archive?id=${id}&cycle=${cycle.id}&program=${program.id}`)}
        />
      );
    return <ArchiveCycleView cycle={cycle} contents={contents} own={own} onBack={root} onOpen={(id) => nav.push(`/portal/archive?cycle=${cycle.id}&program=${id}`)} />;
  }

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
        <CardHead
          title="Closed cycles"
          sub={own ? "Cycles QAC has closed where your programs took part. Their files are frozen as read-only history. Select one to see your programs and files." : "Cycles QAC has closed. Their submissions are frozen as read-only history. Select one to see its programs and files."}
        />
        {cycles.length ? <ArchiveCycles cycles={cycles} own={own} onPick={(id) => nav.push(`/portal/archive?cycle=${id}`)} /> : <div className="empty">{own ? "None of your programs took part in a closed cycle yet." : "No cycle has been closed yet."}</div>}
      </Card>
      <Card>
        <CardHead title="Accreditation Archive" sub={own ? "Finished accreditations of your programs: what was flagged, what you changed and the result. View only." : "Finished accreditations: what the accreditors flagged, what the program changed and the result. Filter by Area to see what other programs prepared."} />
        <ArchiveList entries={entries} onOpen={(id) => nav.push(`/portal/archive?id=${id}`)} filterable={!own} areas={archiveAreas(entries)} />
      </Card>
    </>
  );
}
