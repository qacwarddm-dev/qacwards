"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import BackLink from "../../kit/BackLink";
import Btn from "../../kit/Btn";
import Card from "../../kit/Card";
import Crumbs, { type Crumb } from "../../kit/Crumbs";
import DocRow from "../../kit/DocRow";
import { HistoryList } from "../../kit/History";
import LevelRings from "../../kit/LevelRings";
import PhaseList, { type TrackStep } from "../../kit/PhaseList";
import { ReviewChip } from "../../kit/Pill";
import Scope from "../../kit/Scope";
import StageSwitch from "../../kit/StageSwitch";
import { useToast } from "../../kit/ToastProvider";
import DocViewer from "../../kit/DocViewer";
import ProgramCard from "./ProgramCard";
import { Indicators, RatingGuide, ReviewFullScreen, useRatings } from "./IaReview";
import { ReviewDocModal, useReviewActions } from "../../kit/ReviewDoc";
import { allPhaseSlots, countSlots, includedAreas, ratedCount, type Counts, type PhaseGroup, type Slot } from "@/lib/review-model";
import { iaStats, type IaAssignment } from "@/lib/ia-model";
import { approveDocuments } from "@/lib/review-actions";

export type IaView = { lv?: string; st?: "pre" | "req"; ph?: number; ar?: string };
type Level = { code: string; name: string; short: string };

function href(a: string | null, v: IaView = {}) {
  if (!a) return "/portal/evaluation";
  const p = new URLSearchParams({ a });
  if (v.lv) p.set("lv", v.lv);
  if (v.st) p.set("st", v.st);
  if (v.ph !== undefined) p.set("ph", String(v.ph));
  if (v.ar) p.set("ar", v.ar);
  return `/portal/evaluation?${p}`;
}

export default function IaAccreditation({
  assignments,
  selected,
  view,
  levels,
  meId,
}: {
  assignments: IaAssignment[];
  selected: IaAssignment | null;
  view: IaView;
  levels: Level[];
  meId: string;
}) {
  if (!selected || !selected.review)
    return (
      <Scope name="ia">
        <Card>
          <div className="ch">
            <div>
              <h2>Programs</h2>
              <div className="sub">Your assigned programs · open one to review what the program representative submitted</div>
            </div>
          </div>
          {assignments.map((a) => (
            <ProgramCard key={a.id} a={a} />
          ))}
          {!assignments.length && <div className="ph">Accept an assignment first. Programs you accept show up here.</div>}
        </Card>
      </Scope>
    );
  return (
    <Scope name="ia">
      <ProgramView a={selected} view={view} levels={levels} meId={meId} />
    </Scope>
  );
}

const STN = { pre: "Pre-Accreditation Phases", req: "Accreditation Requirements" } as const;

function defaultStage(a: IaAssignment): "pre" | "req" {
  const phases = allPhaseSlots(a.review!);
  return phases.some((s) => s.state === "pending" || s.state === "missing") ? "pre" : "req";
}

function ProgramView({ a, view, levels, meId }: { a: IaAssignment; view: IaView; levels: Level[]; meId: string }) {
  const router = useRouter();
  const toast = useToast();
  const r = a.review!;
  const st = view.st ?? defaultStage(a);
  const open = view.lv !== "0";
  const phaseIdx = view.ph;
  const area = view.ar ? r.areas.find((x) => x.refId === view.ar) : undefined;
  const group = phaseIdx !== undefined ? r.phases.find((p) => p.ordinal === phaseIdx) : undefined;
  const signed = a.report?.status === "submitted" || a.report?.status === "acknowledged";
  const s = iaStats(a);

  const crumbs: Crumb[] = [{ label: "Programs", href: "/portal/evaluation" }];
  crumbs.push(open ? { label: a.short, href: href(a.id, { lv: "0" }) } : { label: a.short });
  if (open) {
    crumbs.push({ label: a.levelName, href: href(a.id, { st }) });
    const sub = group || area;
    crumbs.push(sub ? { label: STN[area ? "req" : "pre"], href: href(a.id, { st: area ? "req" : "pre" }) } : { label: STN[st] });
    if (group) crumbs.push({ label: group.name });
    if (area) crumbs.push({ label: area.name });
  }

  if (area) return <AreaView a={a} slot={area} crumbs={crumbs} signed={signed} meId={meId} />;
  if (group) return <PhaseView a={a} g={group} crumbs={crumbs} signed={signed} meId={meId} />;

  return (
    <>
      <Crumbs items={crumbs} />
      <Card>
        <div className="ch">
          <div>
            <h2>{a.mid}</h2>
            <div className="sub">
              📍 {a.campus} · {a.collegeName} · your assigned level is open
            </div>
          </div>
          <BackLink to="Programs" href="/portal/evaluation" />
        </div>
        <LevelRings
          items={levels.map((l) => {
            const asg = l.code === a.levelCode;
            const dn = a.awardedCodes.includes(l.code);
            const pc = asg ? s.evalPct : dn ? 100 : 0;
            return {
              key: l.code,
              short: l.short,
              pct: pc,
              color: pc === 100 ? "#22a33a" : "#800000",
              center: asg || dn ? `${pc}%` : "🔒",
              pill: asg ? (signed ? { tone: "pg", text: "Submitted" } : { tone: "pb", text: "Assigned to you" }) : dn ? { tone: "pg", text: "Visit done" } : { tone: "pm", text: "Not assigned" },
              sub: asg ? `Visit ${a.visitLabel}` : dn ? "Completed · view only" : "Not assigned to you",
              locked: !asg,
              selected: asg && open,
              onClick: () => (asg ? router.push(href(a.id, { st })) : toast.say(dn ? `${l.name} is already completed.` : `You are not assigned to ${l.name}.`)),
            };
          })}
        />
      </Card>
      {open && (st === "pre" ? <PreCard a={a} signed={signed} /> : <ReqCard a={a} signed={signed} meId={meId} />)}
    </>
  );
}

const LockNote = () => (
  <div className="lvnote">
    🔒 <div>You already signed and submitted this evaluation. Everything is view only.</div>
  </div>
);

function phaseTracker(c: Counts): TrackStep[] {
  const sub = c.miss === 0;
  const done = c.ap === c.req;
  const cur = done ? 3 : sub ? 2 : 1;
  const L: [string, string][] = [
    ["Assigned", "Phase assigned to the program"],
    ["Documents Submitted", sub ? "All documents uploaded" : `${c.up + c.re} of ${c.req} uploaded`],
    ["Reviewed", done ? "All approved by you" : `${c.ap} of ${c.req} approved${c.pe ? ` · ${c.pe} to review` : ""}${c.re ? ` · ${c.re} returned` : ""}`],
  ];
  return L.map(([label, sub2], i) => ({ label, sub: sub2, state: i < cur ? "done" : i === cur ? "cur" : "" }));
}

function PreCard({ a, signed }: { a: IaAssignment; signed: boolean }) {
  const router = useRouter();
  const r = a.review!;
  const sp = countSlots(allPhaseSlots(r));
  return (
    <div className="card pac">
      {signed && <LockNote />}
      <div className="pah">
        <h2>Pre-Accreditation Phases</h2>
        <BackLink to="Levels" href={href(a.id, { lv: "0" })} />
      </div>
      <PhaseList
        rows={r.phases.map((g) => {
          const c = countSlots(g.docs);
          const pct = c.req ? Math.round((c.ap / c.req) * 100) : 0;
          return {
            key: g.id,
            name: g.name.replace(" – ", " (") + ")",
            dim: c.up === 0 && !c.re,
            pct,
            barColor: c.ap === c.req ? "#4caf6a" : "var(--maroon)",
            badges: (
              <>
                {c.pe > 0 && <em style={{ color: "#8a6200" }}>{c.pe} to review</em>}
                {c.re > 0 && <em>{c.re} returned</em>}
              </>
            ),
            steps: phaseTracker(c),
            onOpen: () => router.push(href(a.id, { ph: g.ordinal })),
          };
        })}
      />
      <div className="paf">
        <span>
          {sp.ap === sp.req
            ? "✅ All phase documents approved."
            : sp.miss > 0
              ? `The program still has ${sp.miss} document${sp.miss === 1 ? "" : "s"} to upload.`
              : `${sp.pe} document${sp.pe === 1 ? "" : "s"} waiting for your review${sp.re ? ` · ${sp.re} returned` : ""}`}
        </span>
        <button type="button" className="pnext" onClick={() => router.push(href(a.id, { st: "req" }))}>
          Next
        </button>
      </div>
    </div>
  );
}

function ReqCard({ a, signed, meId }: { a: IaAssignment; signed: boolean; meId: string }) {
  const router = useRouter();
  const [guide, setGuide] = useState(false);
  const r = a.review!;
  const s = iaStats(a);
  const phases = allPhaseSlots(r);
  const areas = includedAreas(r);
  const all = countSlots([...phases, ...areas]);
  const sp = countSlots(phases);
  const sa = countSlots(areas);
  const left = s.areaTotal - s.evalN;
  const why = signed
    ? "✅ Signed and submitted to the QA Center."
    : s.ready
      ? "✅ Everything is reviewed and rated. You can submit your evaluation."
      : null;
  const areaTitle = r.levelCode === "III" ? "LEVEL III AREAS" : r.levelCode === "IV" ? "LEVEL IV AREAS" : "AREAS I–X";
  return (
    <div className="card">
      {signed && <LockNote />}
      <div className="ch lvh">
        <div>
          <h2>{a.levelName}</h2>
          <div className="sub">
            {all.ap} approved · <b style={{ color: "#8a6200" }}>{all.pe} for your review</b> · {all.re} returned · {all.miss} not uploaded yet
          </div>
        </div>
        <div className="ovp">
          <a className="lnk" role="button" onClick={() => setGuide(true)}>
            📄 Rating guide for this level
          </a>
          <div className="ovbar">
            <div className="bar">
              <i style={{ width: `${s.evalPct}%`, background: s.evalPct === 100 ? "var(--green)" : "var(--maroon)" }} />
            </div>
            <b>{s.evalPct}%</b>
          </div>
          <small>Your evaluation progress</small>
        </div>
      </div>
      <StageSwitch
        value="req"
        onChange={(k) => router.push(href(a.id, { st: k }))}
        stages={[
          {
            key: "pre",
            title: STN.pre,
            sub: `${sp.ap} of ${sp.req} approved${sp.pe ? ` · ${sp.pe} to review` : ""}`,
            pct: sp.req ? Math.round((sp.ap / sp.req) * 100) : 0,
            done: sp.ap === sp.req,
          },
          {
            key: "req",
            title: STN.req,
            sub: `${s.evalN} of ${s.areaTotal} areas evaluated${sa.pe ? ` · ${sa.pe} to review` : ""}`,
            pct: s.areaTotal ? Math.round((s.evalN / s.areaTotal) * 100) : 0,
          },
        ]}
      />
      <div className="sech">
        {areaTitle} <small>One compiled PDF per area · review the document, then rate the indicators</small>
      </div>
      <div className="box">
        {areas.map((x) => {
          const n = ratedCount(a.ratings[x.refId]);
          const evaluated = x.state === "approved" && n === 3;
          return (
            <DocRow
              key={x.refId}
              state={x.state}
              title={x.name}
              sub={
                x.state === "missing" ? (
                  "Not uploaded by the program yet"
                ) : (
                  <>
                    {x.file} · {x.size} · {x.date}
                    {x.version > 1 ? ` · v${x.version}` : ""} · <span style={{ color: n === 3 ? "#1d7a35" : "inherit" }}>Rated {n}/3</span>
                  </>
                )
              }
              status={<ReviewChip state={x.state} />}
              actions={
                x.state === "missing" ? (
                  <span className="wt">Waiting for upload</span>
                ) : evaluated || signed || x.state === "returned" ? (
                  <Btn variant="o" sm href={href(a.id, { st: "req", ar: x.refId })}>
                    {x.state === "returned" ? "View" : "Open"}
                  </Btn>
                ) : (
                  <Btn sm href={href(a.id, { st: "req", ar: x.refId })}>
                    {x.state === "pending" ? "Review & rate" : "Evaluate"} ›
                  </Btn>
                )
              }
              remark={x.state === "returned" && x.returnNote ? { who: x.returnedById === meId ? "You" : (x.returnedBy ?? "").split(",")[0], text: x.returnNote, mine: x.returnedById === meId } : null}
            />
          );
        })}
      </div>
      <div className="subbar">
        <span className="sub" style={{ margin: 0 }}>
          {why ?? (
            <>
              To submit:{" "}
              {[
                s.pending ? <b key="p" style={{ color: "var(--text)" }}>{s.pending} to review</b> : null,
                s.returned ? <b key="r" style={{ color: "var(--red)" }}>{s.returned} waiting for resubmission</b> : null,
                left ? <b key="l" style={{ color: "var(--text)" }}>{left} area{left === 1 ? "" : "s"} to evaluate</b> : null,
              ]
                .filter(Boolean)
                .flatMap((x, i) => (i ? [", ", x] : [x]))}
              .
            </>
          )}
        </span>
        <div style={{ display: "flex", gap: 8 }}>
          {signed ? (
            <Btn variant="o" href={`/portal/evaluation/submit?a=${a.id}&step=3`}>
              View signed report
            </Btn>
          ) : (
            <Btn disabled={!s.ready} title={s.ready ? undefined : "Review and rate everything first"} onClick={() => router.push(`/portal/evaluation/submit?a=${a.id}`)}>
              Submit evaluation ›
            </Btn>
          )}
        </div>
      </div>
      {guide && <RatingGuide levelName={a.levelName} onClose={() => setGuide(false)} />}
    </div>
  );
}

function PhaseView({ a, g, crumbs, signed, meId }: { a: IaAssignment; g: PhaseGroup; crumbs: Crumb[]; signed: boolean; meId: string }) {
  const router = useRouter();
  const toast = useToast();
  const r = a.review!;
  const c = countSlots(g.docs);
  const pct = c.req ? Math.round((c.ap / c.req) * 100) : 0;
  const idx = r.phases.findIndex((p) => p.id === g.id);
  const prev = r.phases[idx - 1];
  const next = r.phases[idx + 1];
  const [modal, setModal] = useState<{ slot: Slot; ret?: boolean } | null>(null);
  const [full, setFull] = useState<Slot | null>(null);
  const { ratings, set } = useRatings(a);
  const [busy, setBusy] = useState(false);
  const pendingIds = g.docs.filter((d) => d.state === "pending" && d.docId).map((d) => d.docId!);
  const live = (slot: Slot) => g.docs.find((d) => d.key === slot.key) ?? slot;
  return (
    <>
      <Crumbs items={crumbs} />
      <div className="card">
        <div className="ch">
          <div>
            <h2>{g.name}</h2>
            <div className="sub">
              {a.short} · {a.levelName} · Pre-Accreditation Phases · {c.ap} of {c.req} approved
              {c.pe > 0 && (
                <>
                  {" "}
                  · <b style={{ color: "#8a6200" }}>{c.pe} to review</b>
                </>
              )}
              {c.re > 0 && (
                <>
                  {" "}
                  · <b style={{ color: "var(--red)" }}>{c.re} returned</b>
                </>
              )}
            </div>
          </div>
          <BackLink to="Phases" href={href(a.id, { st: "pre" })} />
        </div>
        <div className="bar" style={{ marginBottom: 16 }}>
          <i style={{ width: `${pct}%`, background: pct === 100 ? "var(--green)" : "var(--maroon)" }} />
        </div>
        <div className="box">
          {g.docs.map((d) => (
            <DocRow
              key={d.key}
              state={d.state}
              title={d.name}
              sub={d.state === "missing" ? "Not uploaded by the program yet" : `${d.file} · ${d.size} · ${d.date} · by ${d.by ?? "the program"}`}
              status={<ReviewChip state={d.state} />}
              actions={
                d.state === "missing" ? (
                  <span className="wt">Waiting for upload</span>
                ) : d.state === "pending" && !signed ? (
                  <Btn sm onClick={() => setModal({ slot: d })}>
                    Review
                  </Btn>
                ) : (
                  <Btn variant="o" sm onClick={() => setModal({ slot: d })}>
                    View
                  </Btn>
                )
              }
              remark={d.state === "returned" && d.returnNote ? { who: d.returnedById === meId ? "You" : (d.returnedBy ?? "").split(",")[0], text: d.returnNote } : null}
            />
          ))}
        </div>
        <div className="subbar">
          <Btn variant="gh" disabled={!prev} onClick={() => prev && router.push(href(a.id, { ph: prev.ordinal }))}>
            ‹ {prev ? prev.name.split(" – ")[0] : "Previous"}
          </Btn>
          {pendingIds.length > 0 && !signed && (
            <Btn
              variant="gn"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                const res = await approveDocuments(pendingIds);
                setBusy(false);
                if (!res.ok) return toast.say(res.error, true);
                toast.say(`${g.name} approved`);
                router.refresh();
              }}
            >
              ✓ Approve all {pendingIds.length} for review
            </Btn>
          )}
          {next ? (
            <Btn variant="gh" onClick={() => router.push(href(a.id, { ph: next.ordinal }))}>
              {next.name.split(" – ")[0]} ›
            </Btn>
          ) : (
            <Btn onClick={() => router.push(href(a.id, { st: "req" }))}>
              Accreditation Requirements ›
            </Btn>
          )}
        </div>
      </div>
      {modal && (
        <ReviewDocModal
          slot={live(modal.slot)}
          sub={`${a.mid} · ${a.levelName} · ${g.name} · Pre-Accreditation Phases`}
          startReturn={modal.ret}
          locked={signed}
          meId={meId}
          onClose={() => setModal(null)}
          onFull={() => {
            setFull(modal.slot);
            setModal(null);
          }}
        />
      )}
      {full && <ReviewFullScreen a={a} slot={live(full)} kind="phase" groupLabel={g.name} locked={signed} ratings={ratings} set={set} onClose={() => setFull(null)} />}
    </>
  );
}

function AreaView({ a, slot, crumbs, signed, meId }: { a: IaAssignment; slot: Slot; crumbs: Crumb[]; signed: boolean; meId: string }) {
  const router = useRouter();
  const toast = useToast();
  const r = a.review!;
  const areas = includedAreas(r);
  const i = areas.findIndex((x) => x.refId === slot.refId);
  const next = areas[i + 1];
  const areaNo = slot.ordinal;
  const up = slot.state !== "missing" && slot.state !== "draft";
  const { ratings, set } = useRatings(a);
  const { decide, pending } = useReviewActions();
  const [retModal, setRetModal] = useState(false);
  const [full, setFull] = useState(false);
  return (
    <>
      <Crumbs items={crumbs} />
      <div className="card">
        <div className="ch">
          <div>
            <h2>{slot.name}</h2>
            <div className="sub">
              {a.short} · {a.levelName} · Accreditation Requirements · <ReviewChip state={slot.state} />
            </div>
          </div>
          <BackLink to="Requirements" href={href(a.id, { st: "req" })} />
        </div>
        <div className="ev">
          <div className="docs">
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--muted)", marginBottom: 8 }}>SUBMITTED DOCUMENT</div>
            {up ? (
              <div className="d sel">
                <div className="pdf">PDF</div>
                <div>
                  {slot.file}
                  <br />
                  <small style={{ color: "var(--muted)" }}>
                    {slot.date}
                    {slot.version > 1 ? ` · v${slot.version}` : ""} · {slot.size}
                  </small>
                </div>
              </div>
            ) : (
              <div className="ph" style={{ padding: 20 }}>
                Not uploaded yet.
              </div>
            )}
            <HistoryList
              items={slot.history.map((h) => ({
                ...h,
                who: h.byId === meId ? `${h.who} (you)` : h.who,
                tone: h.tone === "ok" ? "ok" : h.byId === meId ? "me" : "rev",
              }))}
            />
          </div>
          <div>
            <DocViewer docId={up ? slot.docId : null} onFullscreen={() => setFull(true)} />
            {!up ? (
              <div className="decb">
                <span>⏳ The program hasn’t uploaded this area yet. You can rate it once it’s uploaded.</span>
              </div>
            ) : slot.state === "approved" ? (
              <div className="decb ok">
                <span>
                  ✓ <b>Document approved.</b> Now rate the indicators below.
                </span>
                {!signed && (
                  <a className="lnk" role="button" onClick={() => decide(slot, "undone")}>
                    Undo
                  </a>
                )}
              </div>
            ) : slot.state === "returned" ? (
              <div className="decb ret">
                <span>
                  ↺ <b>Returned for revision.</b> Waiting for the program to resubmit. They see your remark on their Feedback page.
                </span>
              </div>
            ) : (
              <div className="decb">
                <span>
                  <b>Is this document complete?</b> Approve it, or return it with a remark.
                </span>
                {!signed && (
                  <span style={{ display: "flex", gap: 8 }}>
                    <Btn variant="d" sm onClick={() => setRetModal(true)}>
                      ↺ Return for revision
                    </Btn>
                    <Btn variant="g" sm disabled={pending} onClick={() => decide(slot, "approved")}>
                      ✓ Approve document
                    </Btn>
                  </span>
                )}
              </div>
            )}
            <div className="scl">Scale: 1 = Poor · 5 = Excellent</div>
            <Indicators areaNo={areaNo} areaId={slot.refId} ratings={ratings} set={set} disabled={!up || signed} readOnly={signed || !up} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 6, gap: 10, flexWrap: "wrap" }}>
              <span />
              <span style={{ display: "flex", gap: 8 }}>
                {next && (
                  <Btn variant="o" href={href(a.id, { st: "req", ar: next.refId })}>
                    Next area ›
                  </Btn>
                )}
                <Btn
                  onClick={() => {
                    toast.say("Area saved");
                    router.push(href(a.id, { st: "req" }));
                  }}
                >
                  Save &amp; back
                </Btn>
              </span>
            </div>
          </div>
        </div>
      </div>
      {retModal && (
        <ReviewDocModal
          slot={slot}
          sub={`${a.mid} · ${a.levelName} · Accreditation Requirements`}
          startReturn
          locked={signed}
          meId={meId}
          onClose={() => setRetModal(false)}
          onFull={() => setFull(true)}
        />
      )}
      {full && <ReviewFullScreen a={a} slot={slot} kind="area" groupLabel="Accreditation Requirements" areaNo={areaNo} locked={signed} ratings={ratings} set={set} onClose={() => setFull(false)} />}
    </>
  );
}
