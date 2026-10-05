"use client";

import { useState } from "react";
import useNav from "../../kit/nav";
import BackLink from "../../kit/BackLink";
import ActLink from "../../kit/ActLink";
import Btn from "../../kit/Btn";
import Card from "../../kit/Card";
import Crumbs, { type Crumb } from "../../kit/Crumbs";
import DocRow from "../../kit/DocRow";
import { HistoryList } from "../../kit/History";
import LevelRings from "../../kit/LevelRings";
import { ReviewChip } from "../../kit/Pill";
import Scope from "../../kit/Scope";
import { useToast } from "../../kit/ToastProvider";
import DocViewer from "../../kit/DocViewer";
import ProgramCard from "./ProgramCard";
import { Indicators, RatingGuide, ReviewFullScreen, useRatings } from "./IaReview";
import { ReviewDocModal, useReviewActions } from "../../kit/ReviewDoc";
import { countSlots, includedAreas, ratedCount, type Slot } from "@/lib/review-model";
import { iaStats, type IaAssignment } from "@/lib/ia-model";

export type IaView = { lv?: string; st?: "req"; ar?: string };
type Level = { code: string; name: string; short: string };

function href(a: string | null, v: IaView = {}) {
  if (!a) return "/portal/evaluation";
  const p = new URLSearchParams({ a });
  if (v.lv) p.set("lv", v.lv);
  if (v.st) p.set("st", v.st);
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

function ProgramView({ a, view, levels, meId }: { a: IaAssignment; view: IaView; levels: Level[]; meId: string }) {
  const router = useNav();
  const toast = useToast();
  const r = a.review!;
  const open = view.lv !== "0";
  const area = view.ar ? r.areas.find((x) => x.refId === view.ar) : undefined;
  const signed = a.report?.status === "submitted" || a.report?.status === "acknowledged";
  const s = iaStats(a);

  const crumbs: Crumb[] = [{ label: "Programs", href: "/portal/evaluation" }];
  crumbs.push(open ? { label: a.short, href: href(a.id, { lv: "0" }) } : { label: a.short });
  if (open) {
    crumbs.push({ label: a.levelName, href: href(a.id, { st: "req" }) });
    crumbs.push(area ? { label: "Accreditation Requirements", href: href(a.id, { st: "req" }) } : { label: "Accreditation Requirements" });
    if (area) crumbs.push({ label: area.name });
  }

  if (area) return <AreaView a={a} slot={area} crumbs={crumbs} signed={signed} meId={meId} />;

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
              onClick: () => (asg ? router.push(href(a.id, { st: "req" })) : toast.say(dn ? `${l.name} is already completed.` : `You are not assigned to ${l.name}.`)),
            };
          })}
        />
      </Card>
      {open && <ReqCard a={a} signed={signed} meId={meId} />}
    </>
  );
}

const LockNote = () => (
  <div className="lvnote">
    🔒 <div>You already signed and submitted this evaluation. Everything is view only.</div>
  </div>
);

function ReqCard({ a, signed, meId }: { a: IaAssignment; signed: boolean; meId: string }) {
  const router = useNav();
  const [guide, setGuide] = useState(false);
  const r = a.review!;
  const s = iaStats(a);
  const areas = includedAreas(r);
  const all = countSlots(areas);
  const sa = all;
  const left = s.areaTotal - s.evalN;
  const why = signed
    ? "✅ Signed and submitted to the QA Center."
    : s.ready
      ? "✅ All areas are reviewed and rated. You can submit your evaluation."
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
                sa.pe ? <b key="p" style={{ color: "var(--text)" }}>{sa.pe} to review</b> : null,
                sa.re ? <b key="r" style={{ color: "var(--red)" }}>{sa.re} waiting for resubmission</b> : null,
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
            <Btn disabled={!s.ready} title={s.ready ? undefined : "Review and rate every area first"} onClick={() => router.push(`/portal/evaluation/submit?a=${a.id}`)}>
              Submit evaluation ›
            </Btn>
          )}
        </div>
      </div>
      {guide && <RatingGuide levelName={a.levelName} onClose={() => setGuide(false)} />}
    </div>
  );
}

function AreaView({ a, slot, crumbs, signed, meId }: { a: IaAssignment; slot: Slot; crumbs: Crumb[]; signed: boolean; meId: string }) {
  const router = useNav();
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
                  <ActLink onClick={() => decide(slot, "undone")}>Undo</ActLink>
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
