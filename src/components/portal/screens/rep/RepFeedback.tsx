"use client";

import Link from "next/link";
import { useState } from "react";
import Btn from "../../kit/Btn";
import DocDetailModal from "../../kit/DocDetailModal";
import Empty from "../../kit/Empty";
import FilterPills from "../../kit/FilterPills";
import { Thread } from "../../kit/History";
import Pill from "../../kit/Pill";
import SegTabs from "../../kit/SegTabs";
import UploadFlow, { type TemplateFile, type UploadMode } from "../../kit/UploadFlow";
import { evalBadge, evalTitle, pendingOf, useEvaluations } from "../../kit/useEvaluations";
import { includedAreas, type Slot } from "@/lib/review-model";
import { levelCounts, type RepLevel, type RepProgram } from "@/lib/rep-model";
import { programMid, programShort } from "@/lib/program-names";
import type { CompletedVisit } from "@/lib/visit-evaluations";

type Kind = "rev" | "resub" | "ok";
const FK: Record<Kind, [string, "ret" | "pend" | "ok"]> = { rev: ["Needs revision", "ret"], resub: ["Resubmitted", "pend"], ok: ["Approved", "ok"] };

type Item = { key: string; slot: Slot; p: RepProgram; l: RepLevel; group: string; ctx: string; kind: Kind; who: string; date: string; msg: string };

export default function RepFeedback({
  programs,
  visits,
  me,
  tpl,
  initialTab,
  initialDoc,
}: {
  programs: RepProgram[];
  visits: CompletedVisit[];
  me: string;
  tpl: TemplateFile;
  initialTab?: "qac" | "eval";
  initialDoc?: string;
}) {
  const [tab, setTab] = useState<"qac" | "eval">(initialTab ?? "qac");
  const [f, setF] = useState<"all" | Kind>("all");
  const [sel, setSel] = useState<string | null>(null);
  const [upload, setUpload] = useState<{ item: Item; mode: UploadMode } | null>(null);
  const [view, setView] = useState<Item | null>(null);
  const ev = useEvaluations(visits);

  const items: Item[] = [];
  for (const p of programs)
    for (const l of p.levels) {
      if (!l.review) continue;
      const groups = [
        ...l.review.phases.flatMap((g) => g.docs.map((d) => ({ d, group: g.name, ctx: g.name }))),
        ...includedAreas(l.review).map((d) => ({ d, group: d.name, ctx: "Accreditation Requirements" })),
      ];
      for (const { d, group, ctx } of groups) {
        const rv = d.history.filter((h) => h.tone !== "me").at(-1);
        if (!rv) continue;
        const kind: Kind | null = d.state === "returned" ? "rev" : d.state === "pending" ? "resub" : d.state === "approved" ? "ok" : null;
        if (!kind) continue;
        items.push({ key: `${l.levelId}:${d.key}`, slot: d, p, l, group, ctx: `${programShort(p.name)} · ${l.name} · ${ctx}`, kind, who: rv.who, date: rv.date, msg: rv.msg });
      }
    }
  const order: Record<Kind, number> = { rev: 0, resub: 1, ok: 2 };
  items.sort((a, b) => order[a.kind] - order[b.kind]);
  const nrev = items.filter((i) => i.kind === "rev").length;
  const left = ev.visits.flatMap(pendingOf).length;
  const list = items.filter((i) => f === "all" || i.kind === f);
  const initial = initialDoc ? list.find((i) => i.slot.docId === initialDoc)?.key : undefined;
  const cur = list.find((i) => i.key === (sel ?? initial)) ?? list[0];
  const c = (k: Kind) => items.filter((i) => i.kind === k).length;

  return (
    <>
      <div className="card">
        <SegTabs
          value={tab}
          onChange={setTab}
          tabs={[
            { key: "qac", label: "From Accreditors", count: nrev },
            { key: "eval", label: "Your Evaluations", count: left },
          ]}
        />
        <div className="lvhint" style={{ marginBottom: 14 }}>
          {tab === "qac" ? "Comments from your internal accreditors on the documents you uploaded." : "Evaluations to answer after each accreditation visit."}
        </div>
        {tab === "eval" ? (
          <>
            <p className="sub" style={{ margin: "-6px 0 14px" }}>
              After each visit, answer one evaluation for the QA Center and one for each internal accreditor who visited.
            </p>
            {ev.visits.flatMap((v) =>
              v.targets.map((t) => {
                const done = t.status === "submitted";
                return (
                  <div key={t.key} className="evl">
                    <div
                      className="ri"
                      style={{ width: 40, height: 40, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, background: done ? "#e9f7ec" : "#fff6d6", color: done ? "#1b7a30" : "#8a6d00" }}
                    >
                      {evalBadge(t)}
                    </div>
                    <div>
                      <b>{evalTitle(t)}</b>
                      <small>
                        {v.visitLabel}
                        {done ? ` · Submitted ${ev.submittedOn(t)}` : " · Not yet answered"}
                      </small>
                    </div>
                    <div className="r">
                      {done ? <Pill tone="ok">Submitted</Pill> : <Pill tone="pend">Pending</Pill>}
                      <Btn variant={done ? "o" : "s"} sm onClick={() => ev.open(t.key)}>
                        {done ? "View" : "Answer"}
                      </Btn>
                    </div>
                  </div>
                );
              }),
            )}
            {!ev.visits.length && <Empty icon="📭">No evaluations yet. They open after each survey visit.</Empty>}
          </>
        ) : (
          <>
            <FilterPills
              value={f}
              onChange={(k) => {
                setF(k);
                setSel(null);
              }}
              items={[
                { key: "all", label: `All (${items.length})` },
                { key: "rev", label: `Needs revision (${c("rev")})` },
                { key: "resub", label: `Resubmitted (${c("resub")})` },
                { key: "ok", label: `Approved (${c("ok")})` },
              ]}
            />
            {list.length && cur ? (
              <div className="fbw">
                <div>
                  {list.map((i) => (
                    <div key={i.key} className={`fi${i.key === cur.key ? " sel" : ""}`} onClick={() => setSel(i.key)}>
                      <div className="top">
                        <div>
                          <b>{i.slot.name}</b>
                          <small>
                            {i.ctx} · {i.date}
                          </small>
                        </div>
                        <Pill tone={FK[i.kind][1]}>{FK[i.kind][0]}</Pill>
                      </div>
                      <p>{i.msg}</p>
                    </div>
                  ))}
                </div>
                <div className="box" style={{ padding: "20px 22px", alignSelf: "start" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                    <div>
                      <b style={{ fontSize: 15 }}>{cur.slot.name}</b>
                      <div className="sub">{cur.ctx}</div>
                    </div>
                    <span style={{ alignSelf: "flex-start" }}>
                      <Pill tone={FK[cur.kind][1]}>{FK[cur.kind][0]}</Pill>
                    </span>
                  </div>
                  <div className="upi" style={{ margin: "14px 0" }}>
                    <span className="pdfi">PDF</span>
                    <div className="t">
                      <b>{cur.slot.file}</b>
                      <small>
                        Version {cur.slot.version || 1} · {cur.slot.date}
                      </small>
                    </div>
                    <Btn variant="o" sm onClick={() => setView(cur)}>
                      View
                    </Btn>
                  </div>
                  <Thread items={cur.slot.history} />
                  {cur.kind === "rev" ? (
                    <>
                      <Btn onClick={() => setUpload({ item: cur, mode: "resubmit" })}>↺ Resubmit revised file</Btn>{" "}
                      <Link
                        className="lnk"
                        style={{ marginLeft: 8 }}
                        href={`/portal/submission?p=${cur.p.id}&l=${cur.l.levelId}${cur.slot.kind === "area" ? `&st=req&hl=${cur.slot.refId}` : `&g=${cur.l.review?.phases.find((g) => g.docs.some((d) => d.key === cur.slot.key))?.ordinal ?? 1}`}`}
                      >
                        Open in Accreditation ›
                      </Link>
                    </>
                  ) : cur.kind === "resub" ? (
                    <div className="smp" style={{ display: "block", fontSize: 12 }}>
                      ⏳ Waiting for the accreditor to review your resubmission.
                    </div>
                  ) : (
                    <div className="smp" style={{ display: "block", background: "var(--green-soft)", borderColor: "#9fd6a8", color: "#1b7a30", fontSize: 12 }}>
                      ✓ No action needed.
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <Empty icon="🎉">Nothing here.</Empty>
            )}
          </>
        )}
      </div>
      {upload && (
        <UploadFlow
          me={me}
          tpl={tpl}
          t={{
            submissionId: upload.item.l.submissionId,
            programId: upload.item.p.id,
            levelId: upload.item.l.levelId,
            programShort: programShort(upload.item.p.name),
            campus: upload.item.p.campus ?? "—",
            college: upload.item.p.college ?? "—",
            levelName: upload.item.l.name,
            groupName: upload.item.group,
            slot: upload.item.slot,
            mode: upload.mode,
            progress: { req: levelCounts(upload.item.l).req, up: levelCounts(upload.item.l).up },
          }}
          onClose={() => setUpload(null)}
          onView={() => setView(upload.item)}
        />
      )}
      {view && (
        <DocDetailModal
          slot={view.slot}
          sub={`${programMid(view.p.name)} · ${view.l.name} · ${view.group}`}
          onClose={() => setView(null)}
          onResubmit={() => {
            setView(null);
            setUpload({ item: view, mode: "resubmit" });
          }}
          onReplace={() => {
            setView(null);
            setUpload({ item: view, mode: "replace" });
          }}
        />
      )}
      {ev.modals}
    </>
  );
}
