"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import BackLink from "../../kit/BackLink";
import Bar from "../../kit/Bar";
import Btn from "../../kit/Btn";
import Card from "../../kit/Card";
import Crumbs, { type Crumb } from "../../kit/Crumbs";
import DocDetailModal from "../../kit/DocDetailModal";
import DocRow from "../../kit/DocRow";
import LevelRings from "../../kit/LevelRings";
import Modal from "../../kit/Modal";
import PhaseList, { type TrackStep } from "../../kit/PhaseList";
import Pill, { DocPill } from "../../kit/Pill";
import StageSwitch from "../../kit/StageSwitch";
import SumRows from "../../kit/SumRows";
import { useToast } from "../../kit/ToastProvider";
import UploadFlow, { TemplatePreview, type TemplateFile, type UploadMode } from "../../kit/UploadFlow";
import { allPhaseSlots, countSlots, includedAreas, missingChoices, type Counts, type PhaseGroup, type Slot } from "@/lib/review-model";
import { isLocked, levelCounts, levelStatus, currentLevel, type RepLevel, type RepProgram } from "@/lib/rep-model";
import { programMid, programShort } from "@/lib/program-names";
import { setLevelChoices, submitForEvaluation } from "@/lib/submission-actions";

export type RepView = { p?: string; l?: string; st?: "pre" | "req"; g?: number; hl?: string };

const STN = { pre: "Pre-Accreditation Phases", req: "Accreditation Requirements" } as const;

function href(v: RepView) {
  const q = new URLSearchParams();
  if (v.p) q.set("p", v.p);
  if (v.l) q.set("l", v.l);
  if (v.st) q.set("st", v.st);
  if (v.g !== undefined) q.set("g", String(v.g));
  if (v.hl) q.set("hl", v.hl);
  const s = q.toString();
  return `/portal/submission${s ? `?${s}` : ""}`;
}

type Ctx = {
  program: RepProgram;
  level: RepLevel;
  me: string;
  tpl: TemplateFile;
  locked: boolean;
  open: (slot: Slot, mode: UploadMode, group: string) => void;
  view: (slot: Slot, group: string) => void;
};

export default function RepAccreditation({
  programs,
  view,
  me,
  tpl,
  visits,
}: {
  programs: RepProgram[];
  view: RepView;
  me: string;
  tpl: TemplateFile;
  visits: Record<string, string>;
}) {
  const program = programs.find((p) => p.id === view.p) ?? null;
  const [upload, setUpload] = useState<{ slot: Slot; mode: UploadMode; group: string } | null>(null);
  const [doc, setDoc] = useState<{ slot: Slot; group: string } | null>(null);
  const [tplOpen, setTplOpen] = useState(false);
  const router = useRouter();

  if (!program) {
    const first = programs[0];
    return (
      <Card>
        <div className="ch">
          <div>
            <h2>Programs</h2>
            <div className="sub">{first ? `${first.college ?? "—"} · ${first.campus ?? "—"}` : "No programs are assigned to you yet."}</div>
          </div>
        </div>
        <div className="plist">
          {programs.map((p) => {
            const cl = currentLevel(p);
            const s = levelCounts(cl);
            const ls = levelStatus(p, cl, visits[cl.levelId]);
            return (
              <Link key={p.id} className="pr" href={href({ p: p.id })}>
                <div>
                  <b>{p.name}</b>
                  <small>
                    Current: {cl.name} · <Pill tone={ls.tone}>{ls.t}</Pill> · {ls.sub}
                  </small>
                </div>
                <Bar pct={s.pct} color="var(--gold)" />
                <b style={{ textAlign: "right" }}>{s.pct}%</b>
                <span style={{ color: "#aaa", fontSize: 18 }}>›</span>
              </Link>
            );
          })}
        </div>
      </Card>
    );
  }

  const level = program.levels.find((l) => l.levelId === view.l) ?? (view.l === "none" ? null : currentLevel(program));
  const locked = level ? isLocked(program, level) || level.closed : true;
  const stage = view.st ?? (level && levelCounts(level, "pre").miss === 0 ? "req" : "pre");
  const group = level?.review && view.g !== undefined ? level.review.phases.find((g) => g.ordinal === view.g) : undefined;

  const ctx: Ctx | null = level
    ? {
        program,
        level,
        me,
        tpl,
        locked,
        open: (slot, mode, g) => setUpload({ slot, mode, group: g }),
        view: (slot, g) => setDoc({ slot, group: g }),
      }
    : null;

  const crumbs: Crumb[] = [{ label: "Programs", href: "/portal/submission" }];
  crumbs.push(level ? { label: programShort(program.name), href: href({ p: program.id, l: "none" }) } : { label: programShort(program.name) });
  if (level) {
    crumbs.push({ label: level.name, href: href({ p: program.id, l: level.levelId }) });
    crumbs.push(group ? { label: STN.pre, href: href({ p: program.id, l: level.levelId, st: "pre" }) } : { label: STN[stage] });
    if (group) crumbs.push({ label: group.name });
  }

  const liveSlot = (s: Slot) => [...(level?.review ? allPhaseSlots(level.review) : []), ...(level?.review?.areas ?? [])].find((x) => x.key === s.key) ?? s;
  const counts = level ? levelCounts(level) : null;

  return (
    <>
      <Crumbs items={crumbs} />
      {group && ctx ? (
        <PhaseView ctx={ctx} g={group} onTemplate={() => setTplOpen(true)} />
      ) : (
        <>
          <Card>
            <div className="ch">
              <div>
                <h2>{program.name}</h2>
                <div className="sub">Readiness by accreditation level · click a level to open it</div>
              </div>
              <BackLink to="Programs" href="/portal/submission" />
            </div>
            <LevelRings
              items={program.levels.map((l) => {
                const s = levelCounts(l);
                const ls = levelStatus(program, l, visits[l.levelId]);
                const lk = isLocked(program, l);
                return {
                  key: l.levelId,
                  short: l.short,
                  pct: s.pct,
                  center: lk ? "🔒" : `${s.pct}%`,
                  pill: { tone: ls.tone, text: ls.t },
                  sub: ls.sub,
                  locked: lk,
                  selected: level?.levelId === l.levelId,
                  title: lk ? `${ls.sub} · click to preview` : undefined,
                  onClick: () => router.push(href({ p: program.id, l: l.levelId })),
                };
              })}
            />
          </Card>
          {ctx && (stage === "pre" ? <PreCard ctx={ctx} /> : <LevelCard ctx={ctx} visitDone={visits[ctx.level.levelId]} />)}
        </>
      )}
      {upload && ctx && (
        <UploadFlow
          me={me}
          tpl={tpl}
          t={{
            submissionId: level!.submissionId,
            programId: program.id,
            levelId: level!.levelId,
            programShort: programShort(program.name),
            campus: program.campus ?? "—",
            college: program.college ?? "—",
            levelName: level!.name,
            groupName: upload.group,
            slot: liveSlot(upload.slot),
            mode: upload.mode,
            progress: { req: counts!.req, up: counts!.up },
          }}
          onClose={() => setUpload(null)}
          onView={() => setDoc({ slot: upload.slot, group: upload.group })}
        />
      )}
      {doc && (
        <DocDetailModal
          slot={liveSlot(doc.slot)}
          sub={`${programMid(program.name)} · ${level?.name} · ${doc.group}`}
          onClose={() => setDoc(null)}
          onResubmit={() => {
            setDoc(null);
            setUpload({ slot: doc.slot, mode: "resubmit", group: doc.group });
          }}
          onReplace={() => {
            setDoc(null);
            setUpload({ slot: doc.slot, mode: "replace", group: doc.group });
          }}
        />
      )}
      {tplOpen && <TemplatePreview tpl={tpl} viewer={me} onClose={() => setTplOpen(false)} />}
    </>
  );
}

function LockNote({ level, sub, preview, closed }: { level: string; sub: string; preview?: boolean; closed?: boolean }) {
  if (closed)
    return (
      <div className="lockb">
        🔒{" "}
        <div>
          <b>This accreditation cycle is closed.</b> Your {level} documents are kept as read-only history; uploads, replacements and resubmissions are turned off.
        </div>
      </div>
    );
  return (
    <div className="lockb">
      🔒{" "}
      <div>
        <b>{level} is locked.</b> {sub}. {preview ? "You can preview what’s required." : "You can preview what’s required, but uploading opens later."}
      </div>
    </div>
  );
}

function docActions(ctx: Ctx, s: Slot, group: string, chosen?: { remove: () => void }) {
  const dis = ctx.locked;
  if (s.state === "missing")
    return (
      <>
        {chosen && (
          <Btn variant="gh" sm disabled={dis} onClick={chosen.remove}>
            Remove
          </Btn>
        )}
        <Btn sm disabled={dis} onClick={() => ctx.open(s, "new", group)}>
          ⬆ Upload
        </Btn>
      </>
    );
  if (s.state === "draft")
    return (
      <Btn sm disabled={dis} onClick={() => ctx.open(s, "draft", group)}>
        Continue draft
      </Btn>
    );
  if (s.state === "returned")
    return (
      <>
        <Btn variant="o" sm onClick={() => ctx.view(s, group)}>
          View
        </Btn>
        <Btn sm disabled={ctx.locked} onClick={() => ctx.open(s, "resubmit", group)}>
          ↺ Resubmit
        </Btn>
      </>
    );
  if (s.state === "pending")
    return (
      <>
        <Btn variant="o" sm onClick={() => ctx.view(s, group)}>
          View
        </Btn>
        <Btn variant="gh" sm disabled={ctx.locked} onClick={() => ctx.open(s, "replace", group)}>
          Replace
        </Btn>
      </>
    );
  return (
    <Btn variant="o" sm onClick={() => ctx.view(s, group)}>
      View
    </Btn>
  );
}

function RepDocRow({ ctx, s, group, single, chosen, flash }: { ctx: Ctx; s: Slot; group: string; single?: boolean; chosen?: { remove: () => void }; flash?: boolean }) {
  const last = [...s.history].reverse().find((h) => h.tone === "rev");
  return (
    <DocRow
      id={single ? `rq${s.refId}` : undefined}
      flash={flash}
      state={s.state}
      title={s.name}
      titleExtra={
        chosen ? (
          <>
            {" "}
            <Pill tone="blue">Chosen</Pill>
          </>
        ) : null
      }
      sub={
        s.state === "missing"
          ? single
            ? "One compiled PDF for this area"
            : "Not uploaded yet"
          : s.state === "draft"
            ? "Draft saved · not yet submitted"
            : `${s.file} · ${s.size} · ${s.date}${s.version > 1 ? ` · v${s.version}` : ""}`
      }
      status={<DocPill state={s.state} />}
      actions={docActions(ctx, s, group, chosen)}
      remark={s.state === "returned" && last ? { who: last.who.split(",")[0], text: last.msg } : null}
    />
  );
}

function tracker(c: Counts): TrackStep[] {
  const sub = c.ap + c.pe === c.req && !c.re;
  const done = c.ap === c.req;
  const cur = done ? 3 : sub ? 2 : 1;
  const L: [string, string][] = [
    ["Assigned", "Phase assigned"],
    ["Documents Submitted", sub ? "All documents uploaded" : `${c.ap + c.pe} of ${c.req} uploaded${c.re ? ` · ${c.re} to revise` : ""}`],
    ["Completed", done ? "Approved by accreditor" : `${c.ap} of ${c.req} approved`],
  ];
  return L.map(([label, s], i) => ({ label, sub: s, state: i < cur ? "done" : i === cur ? "cur" : "" }));
}

function PreCard({ ctx }: { ctx: Ctx }) {
  const router = useRouter();
  const r = ctx.level.review;
  const ls = levelStatus(ctx.program, ctx.level);
  const phases = r?.phases ?? [];
  const sp = r ? countSlots(allPhaseSlots(r)) : null;
  const p = ctx.program.id;
  const l = ctx.level.levelId;
  return (
    <div className="card pac">
      {ctx.locked && <LockNote level={ctx.level.name} sub={ls.sub} preview closed={ctx.level.closed} />}
      <div className="pah">
        <h2>Pre-Accreditation Phases</h2>
        <BackLink to="Levels" href={href({ p, l: "none" })} />
      </div>
      {r ? (
        <PhaseList
          rows={phases.map((g) => {
            const c = countSlots(g.docs);
            return {
              key: g.id,
              name: g.name.replace(" – ", " (") + ")",
              dim: c.pct === 0 && !c.re,
              pct: c.pct,
              barColor: c.ap === c.req ? "#4caf6a" : "var(--gold)",
              badges: c.re ? <em>{c.re} to revise</em> : null,
              steps: tracker(c),
              onOpen: () => router.push(href({ p, l, g: g.ordinal })),
            };
          })}
        />
      ) : (
        <div className="empty">Nothing uploaded for this level yet. Open a phase to upload its first document.</div>
      )}
      <div className="paf">
        {sp && sp.miss > 0 && (
          <span>
            {sp.miss} document{sp.miss === 1 ? "" : "s"} still to upload
          </span>
        )}
        <button type="button" className="pnext" onClick={() => router.push(href({ p, l, st: "req" }))}>
          Next
        </button>
      </div>
    </div>
  );
}

function LevelCard({ ctx, visitDone }: { ctx: Ctx; visitDone?: string }) {
  const router = useRouter();
  const toast = useToast();
  const [confirm, setConfirm] = useState(false);
  const [pending, start] = useTransition();
  const { level, program } = ctx;
  const r = level.review;
  const s = levelCounts(level);
  const sp = levelCounts(level, "pre");
  const sr = levelCounts(level, "req");
  const ls = levelStatus(program, level, visitDone);
  const rOpen = Boolean(r);
  const p = program.id;
  const l = level.levelId;
  const submitted = level.status === "submitted" || level.status === "under_evaluation" || level.status === "evaluated";
  const awarded = program.awarded.includes(level.code);
  const next = program.levels[program.levels.findIndex((x) => x.levelId === l) + 1];
  const areas = r?.areas ?? [];
  const chosen = r?.chosen ?? [];
  const need = r?.requiredChoices ?? 0;

  function pick(ids: string[]) {
    if (!r) return;
    start(async () => {
      const res = await setLevelChoices(r.submissionId, l, ids);
      if (!res.ok && ids.length === need) return toast.say(res.error, true);
      router.refresh();
    });
  }

  useEffect(() => {
    const hl = new URLSearchParams(window.location.search).get("hl");
    if (!hl) return;
    const el = document.getElementById(`rq${hl}`);
    if (el) {
      el.scrollIntoView({ block: "center", behavior: "smooth" });
      el.classList.add("flash");
    }
  }, []);

  const title = level.code === "III" ? "Level III" : level.code === "IV" ? "Level IV" : "PSV, Level I – Level II · Areas I–X";

  return (
    <div className="card">
      <div className="ch lvh">
        <div>
          <h2>{level.name}</h2>
          <div className="sub">
            <Pill tone={ls.tone}>{ls.t}</Pill> {s.ap} approved · {s.pe} for review · {s.re} to revise · {s.miss} not uploaded
          </div>
        </div>
        <div className="ovp">
          <Link className="lnk" href="/portal/documents?tab=templates">
            📄 Templates for this level
          </Link>
          <div className="ovbar">
            <Bar pct={s.pct} color={s.pct === 100 ? "var(--green)" : "var(--gold)"} height={10} />
            <b>{s.pct}%</b>
          </div>
          <small>Overall progress</small>
        </div>
      </div>
      {ctx.locked && <LockNote level={level.name} sub={ls.sub} closed={level.closed} />}
      <StageSwitch
        arrows
        value="req"
        onChange={(k) => router.push(href({ p, l, st: k }))}
        stages={[
          { key: "pre", title: STN.pre, sub: `${sp.ap + sp.pe} of ${sp.req} uploaded${sp.re ? ` · ${sp.re} to revise` : ""}`, pct: sp.pct, done: sp.miss === 0 && sp.req > 0 },
          {
            key: "req",
            title: STN.req,
            sub: rOpen ? `${sr.ap + sr.pe} of ${sr.req} uploaded${sr.re ? ` · ${sr.re} to revise` : ""}` : "Nothing uploaded yet",
            pct: sr.pct,
            disabled: !rOpen,
          },
        ]}
      />
      {!rOpen ? (
        <div className="empty">
          <b style={{ color: "var(--text)" }}>Nothing to show here yet</b>
          <br />
          Start with the Pre-Accreditation Phases.
          <br />
          <Btn className="mt12" onClick={() => router.push(href({ p, l, st: "pre" }))}>
            Go to phases
          </Btn>
        </div>
      ) : need > 0 ? (
        <>
          <div className="sech">
            MANDATORY <small>Required for every program</small>
          </div>
          <div className="box">
            {areas
              .filter((a) => !a.optional)
              .map((a) => (
                <RepDocRow key={a.key} ctx={ctx} s={a} group={a.name} single />
              ))}
          </div>
          <div className="sech" style={{ marginTop: 18 }}>
            CHOOSE TWO (2){" "}
            <small>
              {chosen.length}/{need} selected{chosen.length < need ? " · pick the areas your program will submit" : ""}
            </small>
          </div>
          <div className="box">
            {areas
              .filter((a) => a.optional)
              .map((a) =>
                chosen.includes(a.refId) ? (
                  <RepDocRow key={a.key} ctx={ctx} s={a} group={a.name} single chosen={{ remove: () => pick(chosen.filter((x) => x !== a.refId)) }} />
                ) : (
                  <div key={a.key} className="req chrow">
                    <div className="ri" style={{ background: "#f6f6f6", color: "#aaa" }}>
                      ○
                    </div>
                    <div>
                      <b style={{ color: chosen.length >= need ? "#aaa" : "inherit" }}>{a.name}</b>
                      <small>{chosen.length >= need ? "Not selected" : "Optional area"}</small>
                    </div>
                    <div />
                    <div className="acts">
                      <Btn
                        variant="o"
                        sm
                        disabled={chosen.length >= need || ctx.locked || pending}
                        onClick={() => {
                          pick([...chosen, a.refId]);
                          toast.say(`${a.name} chosen (${chosen.length + 1}/${need})`);
                        }}
                      >
                        ＋ Choose
                      </Btn>
                    </div>
                  </div>
                ),
              )}
          </div>
        </>
      ) : (
        <>
          <div className="sech">
            {title.toUpperCase()} <small>One compiled PDF per area</small>
          </div>
          <div className="box">
            {includedAreas(r!).map((a) => (
              <RepDocRow key={a.key} ctx={ctx} s={a} group={a.name} single />
            ))}
          </div>
        </>
      )}
      {rOpen && (
        <div className="subbar">
          <span className="sub" style={{ margin: 0 }}>
            {awarded ? (
              "✅ Everything is approved and the visit is done."
            ) : submitted ? (
              "📨 Submitted. The internal accreditors are evaluating it, then the QA Center reviews their evaluation."
            ) : s.miss || s.re ? (
              <>
                To submit {level.name}:{" "}
                <b style={{ color: "var(--text)" }}>
                  {s.miss} to upload{s.re ? `, ${s.re} to revise` : ""}
                </b>
                .
              </>
            ) : (
              `✅ All documents uploaded. You can submit ${level.name}.`
            )}
          </span>
          <div style={{ display: "flex", gap: 8 }}>
            {awarded && next ? (
              <Btn href={href({ p, l: next.levelId })}>Continue to {next.name} ›</Btn>
            ) : submitted ? (
              <Btn disabled>Submitted ✓</Btn>
            ) : (
              <Btn disabled={Boolean(s.miss || s.re || ctx.locked || !r || missingChoices(r))} title={s.miss || s.re ? "Upload and fix all documents first" : undefined} onClick={() => setConfirm(true)}>
                Submit {level.name} for evaluation
              </Btn>
            )}
          </div>
        </div>
      )}
      {confirm && r && (
        <Modal
          title={`Submit ${level.name} for evaluation?`}
          sub={program.name}
          onClose={() => setConfirm(false)}
          footer={
            <>
              <Btn variant="gh" onClick={() => setConfirm(false)}>
                Cancel
              </Btn>
              <Btn
                disabled={pending}
                onClick={() =>
                  start(async () => {
                    const res = await submitForEvaluation(r.submissionId);
                    if (!res.ok) return toast.say(res.error, true);
                    setConfirm(false);
                    toast.say(`${level.name} submitted for evaluation`);
                    router.refresh();
                  })
                }
              >
                Submit
              </Btn>
            </>
          }
        >
          <SumRows
            rows={[
              ["Phase documents", `${sp.req} uploaded`],
              ["Area documents", `${sr.req} uploaded`],
              ["Approved so far", String(s.ap)],
              ["Waiting for accreditor review", String(s.pe)],
            ]}
          />
          <p className="sub" style={{ marginTop: 12, lineHeight: 1.6 }}>
            After submitting, the assigned internal accreditors evaluate your documents and send their signed evaluation to the QA Center for review. You can still replace documents that are returned for revision.
          </p>
        </Modal>
      )}
    </div>
  );
}

function PhaseView({ ctx, g, onTemplate }: { ctx: Ctx; g: PhaseGroup; onTemplate: () => void }) {
  const router = useRouter();
  const r = ctx.level.review!;
  const c = countSlots(g.docs);
  const idx = r.phases.findIndex((x) => x.id === g.id);
  const prev = r.phases[idx - 1];
  const next = r.phases[idx + 1];
  const p = ctx.program.id;
  const l = ctx.level.levelId;
  return (
    <div className="card">
      <div className="ch">
        <div>
          <h2>{g.name}</h2>
          <div className="sub">
            {programMid(ctx.program.name)} · {ctx.level.name} · Pre-Accreditation Phases · {c.ap + c.pe} of {c.req} uploaded
            {c.re > 0 && (
              <>
                {" "}
                · <b style={{ color: "var(--red)" }}>{c.re} to revise</b>
              </>
            )}
          </div>
        </div>
        <BackLink to="Phases" href={href({ p, l, st: "pre" })} />
      </div>
      <Bar pct={c.pct} color={c.pct === 100 ? "var(--green)" : "var(--gold)"} className="mb16" />
      <div className="box">
        {g.docs.map((d) => (
          <RepDocRow key={d.key} ctx={ctx} s={d} group={g.name} />
        ))}
      </div>
      <div className="subbar">
        <Btn variant="gh" disabled={!prev} onClick={() => prev && router.push(href({ p, l, g: prev.ordinal }))}>
          ‹ {prev ? prev.name.split(" – ")[0] : "Previous"}
        </Btn>
        <a className="lnk" role="button" onClick={onTemplate}>
          👁 View PUP template
        </a>
        {next ? (
          <Btn variant="gh" onClick={() => router.push(href({ p, l, g: next.ordinal }))}>
            {next.name.split(" – ")[0]} ›
          </Btn>
        ) : (
          <Btn onClick={() => router.push(href({ p, l, st: "req" }))}>
            Accreditation Requirements ›
          </Btn>
        )}
      </div>
    </div>
  );
}
