"use client";

import { useState } from "react";
import useNav from "../../kit/nav";
import useBusy from "../../kit/useBusy";
import BackLink from "../../kit/BackLink";
import ActLink from "../../kit/ActLink";
import Btn from "../../kit/Btn";
import Card from "../../kit/Card";
import Crumbs, { type Crumb } from "../../kit/Crumbs";
import DocRow from "../../kit/DocRow";
import { HistoryList } from "../../kit/History";
import LevelRings from "../../kit/LevelRings";
import Modal from "../../kit/Modal";
import Pill, { ReviewChip } from "../../kit/Pill";
import Scope from "../../kit/Scope";
import { useToast } from "../../kit/ToastProvider";
import DocViewer from "../../kit/DocViewer";
import ProgramCard from "./ProgramCard";
import { Indicators, RatingGuide, ReviewFullScreen, useRatings } from "./IaReview";
import { ReviewDocModal, useReviewActions } from "../../kit/ReviewDoc";
import { areaComplete, countSlots, includedAreas, ratedCount, type Slot } from "@/lib/review-model";
import { iaStats, type IaAssignment } from "@/lib/ia-model";
import { areaTag, shortDate } from "@/lib/program-names";
import { sendAreasToLeader } from "@/lib/review-actions";

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

const roleName = (a: IaAssignment) => (a.role === "leader" ? "Team Leader" : "Assistant Accreditor");
const mateRole = (a: IaAssignment) => (a.role === "leader" ? "Assistant" : "Team Leader");
const sentLocked = (a: IaAssignment) => a.role === "assistant" && Boolean(a.mySentAt);

function ReqCard({ a, signed, meId }: { a: IaAssignment; signed: boolean; meId: string }) {
  const router = useNav();
  const toast = useToast();
  const [pending, start] = useBusy();
  const [guide, setGuide] = useState(false);
  const [send, setSend] = useState(false);
  const r = a.review!;
  const s = iaStats(a);
  const areas = includedAreas(r);
  const all = countSlots(areas);
  const mineSlots = areas.filter((x) => a.mine.includes(x.refId));
  const othSlots = areas.filter((x) => !a.mine.includes(x.refId));
  const tags = (L: Slot[]) => L.map((x) => areaTag(r.levelCode, x.ordinal, x.name)).join(", ");
  const leader = a.role === "leader";
  const mate = a.mate?.short ?? mateRole(a);
  const locked = sentLocked(a);
  const left = s.areaTotal - s.evalN;
  const date = (iso: string | null) => (iso ? shortDate(iso) : "—");
  const signedOn = a.report?.signedAt ? shortDate(a.report.signedAt) : "—";
  const areaTitle = r.levelCode === "III" ? "LEVEL III AREAS" : r.levelCode === "IV" ? "LEVEL IV AREAS" : "AREAS I–X";
  const mateStatus = leader ? (
    a.mateSentAt ? <Pill tone="pg">✓ Sent to you {date(a.mateSentAt)}</Pill> : <Pill tone="py">Still rating</Pill>
  ) : signed ? (
    <Pill tone="pg">✓ Overall report submitted</Pill>
  ) : (
    <Pill tone="py">Preparing the overall report</Pill>
  );

  let why: React.ReactNode;
  let bar: React.ReactNode;
  if (leader) {
    const needs = [
      left ? <b key="l" style={{ color: "var(--text)" }}>{left} of your areas to evaluate</b> : null,
      a.mate && !a.mateSentAt ? <b key="m" style={{ color: "var(--text)" }}>wait for {mate} to send their areas</b> : null,
      !a.mate ? <b key="n" style={{ color: "var(--text)" }}>an Assistant Accreditor on the team</b> : null,
      a.mate && a.mateSentAt && s.mateN < s.mateTotal ? <b key="t" style={{ color: "var(--text)" }}>{s.mateTotal - s.mateN} of {mate}’s areas to evaluate</b> : null,
      !left && othSlots.some((x) => x.state === "returned") ? <b key="r" style={{ color: "var(--red)" }}>areas waiting for resubmission</b> : null,
    ].filter(Boolean);
    why = signed ? (
      `✅ Overall report signed and submitted to the QAC Coordinator.${a.mate ? ` ${a.mate.short} can view it.` : ""}`
    ) : s.ready ? (
      "✅ Both of you are done. Generate the overall evaluation report."
    ) : (
      <>
        To generate the report: {needs.flatMap((x, i) => (i ? [", ", x] : [x]))}.
      </>
    );
    bar = signed ? (
      <Btn variant="o" href={`/portal/evaluation/submit?a=${a.id}&step=3`}>
        View overall report
      </Btn>
    ) : (
      <>
        <Btn disabled={!s.ready} title={s.ready ? undefined : "Both accreditors must finish first"} onClick={() => router.push(`/portal/evaluation/submit?a=${a.id}`)}>
          Generate overall report ›
        </Btn>
      </>
    );
  } else {
    why = signed
      ? `✅ ${mate} signed and submitted the overall report on ${signedOn}. You can view it.`
      : a.mySentAt
        ? `✓ You sent your areas to ${mate} on ${date(a.mySentAt)}. Waiting for the Team Leader to generate the overall report.`
        : s.mineDone
          ? "✅ Your areas are done. Send them to the Team Leader."
          : (
              <>
                To send: <b style={{ color: "var(--text)" }}>{left} of your areas to evaluate</b>.
              </>
            );
    bar = signed ? (
      <Btn variant="o" href={`/portal/evaluation/submit?a=${a.id}&step=3`}>
        👁 View overall report
      </Btn>
    ) : a.mySentAt ? (
      <Btn disabled>Generate overall report</Btn>
    ) : (
      <Btn disabled={!s.canSend} onClick={() => setSend(true)}>
        Send my areas to Team Leader ›
      </Btn>
    );
  }

  return (
    <div className="card">
      {signed && leader && <LockNote />}
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
      <div className="teamc">
        <div className="tm me">
          <Pill tone="pb">You · {roleName(a)}</Pill>
          <b>{tags(mineSlots) || "—"}</b>
          <small>
            {s.evalN} of {mineSlots.length} of your areas evaluated{locked ? ` · ✓ sent to ${mate} ${date(a.mySentAt)}` : ""}
          </small>
        </div>
        <div className="tm">
          {a.mate ? (
            <>
              <Pill tone="pm">
                {a.mate.name} · {mateRole(a)}
              </Pill>
              <b>{tags(othSlots) || "—"}</b>
              <small>
                {s.mateN} of {othSlots.length} evaluated · view only for you
              </small>
              {mateStatus}
            </>
          ) : (
            <>
              <Pill tone="pm">No {mateRole(a)} yet</Pill>
              <b>{tags(othSlots) || "—"}</b>
              <small>QAC will assign the {mateRole(a)}</small>
            </>
          )}
        </div>
        <div className="tmn">
          {leader ? (
            <>
              You generate, sign and submit the <b>overall evaluation report</b> once both of you are done. Your Assistant can only view it.
            </>
          ) : (
            <>
              You rate your own areas, then send them to the Team Leader. Only the Team Leader generates and submits the overall report; you can view it.
            </>
          )}
        </div>
      </div>
      <div className="sech">
        {areaTitle} <small>One compiled PDF per area · review the document, rate the indicators, then add one overall comment</small>
      </div>
      <div className="box">
        {areas.map((x) => {
          const own = a.mine.includes(x.refId);
          const n = ratedCount(a.ratings[x.refId]);
          const evaluated = x.state === "approved" && areaComplete(a.ratings[x.refId], a.comments[x.refId]);
          const tag = own ? <span className="own me">Yours</span> : <span className="own">{mate} · {mateRole(a)}</span>;
          return (
            <DocRow
              key={x.refId}
              state={x.state}
              title={x.name}
              titleExtra={tag}
              sub={
                x.state === "missing" ? (
                  "Not uploaded by the program yet"
                ) : (
                  <>
                    {x.file} · {x.size} · {x.date}
                    {x.version > 1 ? ` · v${x.version}` : ""} · <span style={{ color: evaluated ? "#1d7a35" : "inherit" }}>{evaluated ? "Evaluated" : n === 3 ? "Rated 3/3 · comment needed" : `Rated ${n}/3`}</span>
                  </>
                )
              }
              status={own ? <ReviewChip state={x.state} /> : x.state === "pending" ? <span className="dst d-rev">With {mate}</span> : <ReviewChip state={x.state} />}
              actions={
                x.state === "missing" ? (
                  <span className="wt">Waiting for upload</span>
                ) : !own || locked ? (
                  <Btn variant="gh" sm href={href(a.id, { st: "req", ar: x.refId })}>
                    👁 View
                  </Btn>
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
          {why}
        </span>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>{bar}</div>
      </div>
      {guide && <RatingGuide levelName={a.levelName} onClose={() => setGuide(false)} />}
      {send && (
        <Modal
          onClose={() => setSend(false)}
          title="Send your areas to the Team Leader?"
          sub={`${a.mid} · ${tags(mineSlots)}`}
          locked={pending}
          footer={
            <>
              <Btn variant="o" onClick={() => setSend(false)}>
                Cancel
              </Btn>
              <Btn
                disabled={pending}
                onClick={() =>
                  start(async () => {
                    const res = await sendAreasToLeader(a.id);
                    if (!res.ok) return toast.say(res.error, true);
                    setSend(false);
                    toast.say(`Your areas were sent to ${mate}`);
                    router.refresh();
                  })
                }
              >
                Send to Team Leader
              </Btn>
            </>
          }
        >
          <div style={{ fontSize: 13, lineHeight: 1.6 }}>
            {a.mate?.name} (Team Leader) will include your ratings and comments in the overall evaluation report. Your areas become <b>view only</b> unless the Team Leader returns them to you.
          </div>
        </Modal>
      )}
    </div>
  );
}

const INCOMPLETE_MSG = "Rate all three indicators and add a remark to each before leaving this area";

function AreaView({ a, slot, crumbs, signed: reportSigned, meId }: { a: IaAssignment; slot: Slot; crumbs: Crumb[]; signed: boolean; meId: string }) {
  const router = useNav();
  const toast = useToast();
  const r = a.review!;
  const areas = includedAreas(r);
  const i = areas.findIndex((x) => x.refId === slot.refId);
  const next = areas[i + 1];
  const areaNo = slot.ordinal;
  const up = slot.state !== "missing" && slot.state !== "draft";
  const { ratings, comments, set, setComment } = useRatings(a);
  const { decide, pending } = useReviewActions();
  const [retModal, setRetModal] = useState(false);
  const [full, setFull] = useState(false);
  const own = a.mine.includes(slot.refId);
  const sent = sentLocked(a);
  const signed = reportSigned || !own || sent;
  const incomplete = !signed && slot.state === "approved" && !areaComplete(ratings[slot.refId], comments[slot.refId]);
  const mate = a.mate?.short ?? mateRole(a);
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
        {own && !signed && (
          <div className="lvnote own-n">
            ✍{" "}
            <div>
              <b>Your area.</b> You approve or return the document and rate the indicators. {mate} ({mateRole(a)}) can view your ratings.
            </div>
          </div>
        )}
        {!reportSigned && !own && (
          <div className="lvnote">
            👁{" "}
            <div>
              <b>View only.</b> This area is rated by <b>{a.mate?.name ?? mate}</b> ({mateRole(a)}). You can see the document, their decision, ratings and comment.
            </div>
          </div>
        )}
        {!reportSigned && own && sent && (
          <div className="lvnote">
            🔒 <div>You already sent your areas to {a.mate?.name} (Team Leader). View only.</div>
          </div>
        )}
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
            ) : !own ? (
              <div className="decb">
                <span>Waiting for {mate} to review this document.</span>
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
            <Indicators areaNo={areaNo} areaId={slot.refId} ratings={ratings} comment={comments[slot.refId] ?? ""} set={set} setComment={setComment} disabled={!up || signed} readOnly={signed || !up} placeholder={own ? undefined : "No comment"} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 6, gap: 10, flexWrap: "wrap" }}>
              <span />
              <span style={{ display: "flex", gap: 8 }}>
                {next && (
                  <Btn variant="o" onClick={() => (incomplete ? toast.say(INCOMPLETE_MSG, true) : router.push(href(a.id, { st: "req", ar: next.refId })))}>
                    Next area ›
                  </Btn>
                )}
                <Btn
                  onClick={() => {
                    if (incomplete) return toast.say(INCOMPLETE_MSG, true);
                    if (!signed) toast.say("Area saved");
                    router.push(href(a.id, { st: "req" }));
                  }}
                >
                  {signed ? "Back" : "Save & back"}
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
      {full && <ReviewFullScreen a={a} slot={slot} kind="area" groupLabel="Accreditation Requirements" areaNo={areaNo} locked={signed} ratings={ratings} comments={comments} set={set} setComment={setComment} onClose={() => setFull(false)} />}
    </>
  );
}
