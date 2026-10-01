"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import BackLink from "../../kit/BackLink";
import { RBar } from "../../kit/Bar";
import Btn from "../../kit/Btn";
import Card, { CardHead } from "../../kit/Card";
import DocRow from "../../kit/DocRow";
import Empty from "../../kit/Empty";
import FullScreenViewer from "../../kit/FullScreenViewer";
import PhaseList from "../../kit/PhaseList";
import Pill, { ReviewChip } from "../../kit/Pill";
import LevelRings from "../../kit/LevelRings";
import SegTabs from "../../kit/SegTabs";
import { ReviewDecision, ReviewDocModal } from "../../kit/ReviewDoc";
import { useToast } from "../../kit/ToastProvider";
import { countSlots, type Counts, type PhaseGroup, type Slot } from "@/lib/review-model";
import { phaseCounts, type QacProgram } from "@/lib/qac-model";
import { approveDocuments } from "@/lib/review-actions";
import { shortDate } from "@/lib/program-names";

const apPct = (c: Counts) => (c.req ? Math.round((c.ap / c.req) * 100) : 0);
const href = (p?: string, g?: number) => `/portal/extension-monitoring${p ? `?p=${p}${g !== undefined ? `&g=${g}` : ""}` : ""}`;

function phStat(x: Counts): [string, "ok" | "pend" | "ret" | "blue" | "miss"] {
  return x.req && x.ap === x.req ? ["Approved", "ok"] : x.pe ? ["For your review", "pend"] : x.re ? ["Returned", "ret"] : x.up ? ["In progress", "blue"] : ["Not started", "miss"];
}

const lastMod = (g: PhaseGroup) => {
  const L = g.docs.map((d) => d.uploadedAt).filter((d): d is string => Boolean(d));
  return L.length ? shortDate(L.sort().at(-1)!) : "—";
};

export default function QacExtension({ programs, program, phase, meId }: { programs: QacProgram[]; program: QacProgram | null; phase: number | null; meId: string }) {
  if (!program || !program.review) return <ProgramList programs={programs} />;
  const g = phase !== null ? program.review.phases.find((x) => x.ordinal === phase) : null;
  return (
    <>
      <div className="crumb">
        <Link href={href()}>Programs</Link> <span>›</span>{" "}
        {g ? (
          <>
            <Link href={href(program.id)}>{program.short}</Link> <span>›</span> <b style={{ color: "var(--text)" }}>{g.name}</b>
          </>
        ) : (
          <b style={{ color: "var(--text)" }}>{program.short}</b>
        )}
      </div>
      {g ? <PhaseDocs p={program} g={g} meId={meId} /> : <Phases p={program} />}
    </>
  );
}

function ProgramList({ programs }: { programs: QacProgram[] }) {
  const router = useRouter();
  const [f, setF] = useState<"review" | "all">("review");
  const ong = programs.filter((p) => p.inproc && p.review);
  const review = ong.filter((p) => phaseCounts(p).pe);
  const L = f === "review" ? review : ong;
  return (
    <Card>
      <CardHead
        title="Programs"
        sub="Pre-Accreditation Phases (extension activities) you approve"
        right={
          <SegTabs
            flush
            value={f}
            onChange={setF}
            tabs={[
              { key: "review", label: "Needs review", count: review.length },
              { key: "all", label: "All programs", count: ong.length },
            ]}
          />
        }
      />
      {L.length ? (
        <div className="plx">
          {L.map((p) => {
            const c = phaseCounts(p);
            return (
              <div key={p.id} className="prw e" role="link" onClick={() => router.push(href(p.id))}>
                <div>
                  <b>{p.name}</b>
                  <small>
                    {p.college} · {p.campus}
                  </small>
                </div>
                <span>{p.levelName}</span>
                <RBar pct={apPct(c)} />
                <span>
                  {c.pe ? <Pill tone="pend">{c.pe} for your review</Pill> : c.req && c.ap === c.req ? <Pill tone="ok">All approved</Pill> : <Pill tone="miss">{c.miss} not uploaded</Pill>}
                </span>
                <span className="chev">›</span>
              </div>
            );
          })}
        </div>
      ) : (
        <Empty icon="🎉">Nothing waiting for your review.</Empty>
      )}
    </Card>
  );
}

function Phases({ p }: { p: QacProgram }) {
  const router = useRouter();
  const phases = p.review!.phases;
  const all = phaseCounts(p);
  return (
    <>
      <Card>
        <CardHead title="Extension Readiness" sub={`${p.name} · ${p.levelName}`} />
        <LevelRings
          four
          items={phases.map((g) => {
            const x = countSlots(g.docs);
            const s = phStat(x);
            const pct = apPct(x);
            return {
              key: g.id,
              short: g.name.split(" – ")[0].toUpperCase(),
              pct,
              center: `${pct}%`,
              color: pct === 100 ? "#22a33a" : "#eab308",
              pill: { tone: s[1], text: s[0] },
              sub: `${x.ap} approved · ${x.pe} to review · ${x.miss} missing`,
              onClick: () => router.push(href(p.id, g.ordinal)),
            };
          })}
        />
      </Card>
      <div className="card pac">
        <div className="pah">
          <h2>Pre-Accreditation Phases</h2>
          <BackLink to="Programs" href={href()} />
        </div>
        <PhaseList
          variant="e"
          rows={phases.map((g) => {
            const x = countSlots(g.docs);
            const s = phStat(x);
            const sub = x.miss === 0;
            const done = x.req > 0 && x.ap === x.req;
            const c = done ? 3 : sub ? 2 : 1;
            const st = (i: number) => (i < c ? "done" : i === c ? "cur" : "") as "done" | "cur" | "";
            return {
              key: g.id,
              name: g.name.replace(" – ", " (") + (g.name.includes(" – ") ? ")" : ""),
              dim: !x.up && !x.re,
              lastModified: lastMod(g),
              status: <Pill tone={s[1]}>{s[0]}</Pill>,
              steps: [
                { label: "Assigned", sub: "Phase assigned to the program", state: st(0) },
                { label: "Documents Submitted", sub: sub ? "All documents uploaded" : `${x.up + x.re} of ${x.req} uploaded`, state: st(1) },
                { label: "Completed", sub: done ? "All approved by QAC" : `${x.ap} of ${x.req} approved${x.pe ? ` · ${x.pe} to review` : ""}`, state: st(2) },
              ],
              onOpen: () => router.push(href(p.id, g.ordinal)),
            };
          })}
        />
        <div className="paf">
          <span>
            {all.pe
              ? `${all.pe} document(s) waiting for your review`
              : all.req && all.ap === all.req
                ? "✅ All phase documents approved."
                : `${all.miss} document(s) not uploaded yet`}
          </span>
          <Link className="pnext" href={`/portal/assignment?id=${p.id}&stage=req`}>
            Next: Accreditation Requirements
          </Link>
        </div>
      </div>
    </>
  );
}

function PhaseDocs({ p, g, meId }: { p: QacProgram; g: PhaseGroup; meId: string }) {
  const router = useRouter();
  const toast = useToast();
  const [busy, start] = useTransition();
  const [modal, setModal] = useState<string | null>(null);
  const [full, setFull] = useState<string | null>(null);
  const phases = p.review!.phases;
  const i = phases.findIndex((x) => x.ordinal === g.ordinal);
  const prev = phases[i - 1];
  const next = phases[i + 1];
  const x = countSlots(g.docs);
  const pct = apPct(x);
  const live = (k: string | null) => (k ? (g.docs.find((d) => d.key === k) ?? null) : null);
  const mSlot = live(modal);
  const fSlot = live(full);
  const pending = g.docs.filter((d) => d.state === "pending" && d.docId);

  const approveAll = () =>
    start(async () => {
      const r = await approveDocuments(pending.map((d) => d.docId!));
      if (!r.ok) return toast.say(r.error, true);
      toast.say(`${g.name} approved`);
      router.refresh();
    });

  const by = (d: Slot) => (d.reviewedById === meId ? "you" : (d.reviewedBy ?? "QAC"));

  return (
    <Card>
      <CardHead
        title={g.name}
        sub={
          <>
            {p.short} · {p.levelName} · {x.ap} of {x.req} approved
            {x.pe ? (
              <>
                {" "}
                · <b style={{ color: "#8a6d00" }}>{x.pe} for your review</b>
              </>
            ) : null}
          </>
        }
        right={<BackLink to="Phases" href={href(p.id)} />}
      />
      <div className="bar" style={{ marginBottom: 16 }}>
        <i style={{ width: `${pct}%`, background: pct === 100 ? "var(--green)" : undefined }} />
      </div>
      <div className="box">
        {g.docs.map((d) => {
          const missing = d.state === "missing" || d.state === "draft";
          return (
            <DocRow
              key={d.key}
              state={missing ? "missing" : d.state}
              title={d.name}
              sub={missing ? "Not uploaded by the program yet" : `${d.file} · ${d.size} · ${d.date} · by ${d.by ?? p.rep}${d.state === "approved" && d.reviewedBy ? ` · approved by ${by(d)}` : ""}`}
              status={<ReviewChip state={missing ? "missing" : d.state} />}
              actions={
                missing ? (
                  <span className="wt">Waiting for upload</span>
                ) : (
                  <Btn variant={d.state === "pending" ? "s" : "o"} sm onClick={() => setModal(d.key)}>
                    {d.state === "pending" ? "Review" : "View"}
                  </Btn>
                )
              }
              remark={d.state === "returned" && d.returnNote ? { who: d.returnedById === meId ? "You" : (d.returnedBy ?? "QAC"), text: d.returnNote, mine: d.returnedById === meId } : null}
            />
          );
        })}
      </div>
      <div className="subbar">
        {prev ? (
          <Btn variant="gh" href={href(p.id, prev.ordinal)}>
            ‹ {prev.name.split(" – ")[0]}
          </Btn>
        ) : (
          <Btn variant="gh" disabled>
            ‹ Previous
          </Btn>
        )}
        {pending.length > 0 && (
          <Btn variant="o" loading={busy} onClick={approveAll}>
            ✓ Approve all {pending.length} for review
          </Btn>
        )}
        {next ? (
          <Btn variant="gh" href={href(p.id, next.ordinal)}>
            {next.name.split(" – ")[0]} ›
          </Btn>
        ) : (
          <Btn href={`/portal/assignment?id=${p.id}&stage=req`}>Accreditation Requirements ›</Btn>
        )}
      </div>
      {mSlot && (
        <ReviewDocModal
          slot={mSlot}
          sub={`${p.short} · ${g.name} · uploaded ${mSlot.date} by ${mSlot.by ?? p.rep}`}
          locked={false}
          meId={meId}
          allowUndo
          onClose={() => setModal(null)}
          onFull={() => {
            setFull(mSlot.key);
            setModal(null);
          }}
        />
      )}
      {fSlot && (
        <FullScreenViewer
          docId={fSlot.docId}
          downloadHref={fSlot.docId ? `/api/documents/download?source=submission&id=${fSlot.docId}&download=1` : undefined}
          file={fSlot.file ?? fSlot.name}
          meta={`${p.short} · ${g.name} · ${fSlot.date}`}
          status={<ReviewChip state={fSlot.state} />}
          panelLabel="Review"
          panel={
            <>
              <h4>REVIEW DOCUMENT</h4>
              <div className="sub">{fSlot.name}</div>
              <ReviewDecision slot={fSlot} locked={false} />
            </>
          }
          note="QAC can download this file; accreditors can only view it"
          onClose={() => setFull(null)}
        />
      )}
    </Card>
  );
}
