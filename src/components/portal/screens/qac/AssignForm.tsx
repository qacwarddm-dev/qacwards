"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import BackLink from "../../kit/BackLink";
import Btn from "../../kit/Btn";
import Empty from "../../kit/Empty";
import Modal from "../../kit/Modal";
import Pill from "../../kit/Pill";
import Result from "../../kit/Result";
import { useToast } from "../../kit/ToastProvider";
import type { AssignForm as Data } from "@/lib/qac-portal";
import type { QacProgram } from "@/lib/qac-model";
import { relevantExpertise } from "@/lib/expertise-disciplines";
import { saveAssignment } from "@/lib/qac-actions";

const REASONS = [
  "No available internal accreditor with matching expertise",
  "Assigned accreditor declined",
  "Assigned accreditor is on leave",
  "Schedule conflict of the assigned accreditor",
  "Other",
];

export default function AssignForm({ data, edit, from, preset }: { data: Data; edit: QacProgram | null; from: QacProgram | null; preset: QacProgram | null }) {
  const router = useRouter();
  const toast = useToast();
  const base = edit ?? from ?? preset;
  const lock = Boolean(edit);
  const [camp, setCamp] = useState(base?.campus ?? data.campuses[0] ?? "");
  const [col, setCol] = useState(base?.college ?? data.colleges[0]?.code ?? "NA");
  const [prog, setProg] = useState(base?.id ?? "");
  const [lv, setLv] = useState(() => data.levels.find((l) => l.code === (base?.levelCode || "PSV"))?.id ?? data.levels[0]?.id ?? "");
  const [vd, setVd] = useState(edit?.visit ?? "");
  const [dl, setDl] = useState(edit?.due ?? "");
  const [sel, setSel] = useState<string[]>(edit ? edit.team.filter((m) => m.response !== "rejected").map((m) => m.id) : []);
  const [acting, setActing] = useState<Record<string, string>>(() => Object.fromEntries((edit?.team ?? []).filter((m) => m.acting).map((m) => [m.id, m.acting!])));
  const [qopen, setQopen] = useState(false);
  const [actFor, setActFor] = useState<string | null>(null);
  const [reason, setReason] = useState(REASONS[0]);
  const [coi, setCoi] = useState(false);
  const [done, setDone] = useState<{ id: string; programId: string } | null>(null);
  const [pending, start] = useTransition();

  const cats = data.programs.filter((p) => (col === "NA" ? p.campus === camp && p.college === "NA" : p.college === col && p.campus === camp));
  const program = data.programs.find((p) => p.id === prog) ?? (lock ? null : cats[0] ?? null);
  const allAreas = useMemo(() => [...new Set(data.people.flatMap((p) => p.expertise))], [data.people]);
  const relevant = program ? relevantExpertise(program.name, allAreas) : new Set<string>();
  const busy = (id: string) => (vd ? data.busy.find((b) => b.id === id && b.assignmentId !== edit?.assignmentId && Math.abs(new Date(b.date).getTime() - new Date(vd).getTime()) < 3 * 864e5) : undefined);
  const rows = data.people
    .filter((p) => !p.qac)
    .map((p) => ({ ...p, match: p.expertise.filter((e) => relevant.has(e)), coi: program ? program.college !== "NA" && p.college === program.college : false, b: busy(p.id), load: data.load[p.id] ?? 0 }));
  const elig = rows.filter((r) => r.match.length && !r.coi).sort((a, b) => Number(Boolean(a.b)) - Number(Boolean(b.b)) || a.load - b.load || a.name.localeCompare(b.name));
  const excl = rows.filter((r) => r.match.length && r.coi);
  const sug = elig.filter((r) => !r.b).slice(0, 2).map((r) => r.id);
  const avail = elig.filter((r) => !r.b).length;
  const qac = data.people.filter((p) => p.qac);
  const qShown = qopen || avail < 2 || qac.some((q) => sel.includes(q.id));
  const discipline = [...relevant].slice(0, 1)[0];
  const miss = [!program && "a program", !vd && "the site visit date", sel.length !== 2 && `${2 - sel.length > 0 ? `${2 - sel.length} more` : "only 2"} accreditor${Math.abs(2 - sel.length) === 1 ? "" : "s"}`].filter(Boolean);

  function tog(id: string) {
    if (sel.includes(id)) setSel(sel.filter((x) => x !== id));
    else if (sel.length >= 2) toast.say("Select exactly 2. Remove one first.", true);
    else setSel([...sel, id]);
  }

  function submit() {
    if (!program) return;
    start(async () => {
      const r = await saveAssignment({ assignmentId: edit?.assignmentId ?? null, programId: program.id, levelId: lv, accreditorIds: sel, acting, siteVisitDate: vd, dueDate: dl || null });
      if (!r.ok) return toast.say(r.error, true);
      setDone({ id: r.assignmentId, programId: program.id });
      router.refresh();
    });
  }

  const name = (id: string) => data.people.find((p) => p.id === id)?.name ?? id;
  const levelName = data.levels.find((l) => l.id === lv)?.name ?? "";

  return (
    <div className="card">
      <div className="ch">
        <h2>{lock ? "Edit assignment" : "Accreditation Assignment"}</h2>
        <BackLink to={lock ? (edit?.short ?? "Program") : "Programs"} href={lock ? `/portal/assignment?id=${edit?.id}` : "/portal/assignment"} />
      </div>
      <div className="box fbx">
        <div className="fg2">
          <div>
            <label className="fl">Campus</label>
            <select className="inp" disabled={lock} value={camp} onChange={(e) => (setCamp(e.target.value), setProg(""), setSel([]))}>
              {data.campuses.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="fl">Department</label>
            <select className="inp" disabled={lock} value={col} onChange={(e) => (setCol(e.target.value), setProg(""), setSel([]))}>
              {data.colleges.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name}
                </option>
              ))}
              <option value="NA">Not Applicable</option>
            </select>
          </div>
        </div>
        <div className="fg4">
          <div>
            <label className="fl">Program</label>
            <select className="inp" disabled={lock} value={program?.id ?? ""} onChange={(e) => (setProg(e.target.value), setSel([]))}>
              {lock && edit ? (
                <option value={edit.id}>{edit.name}</option>
              ) : cats.length ? (
                cats.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))
              ) : (
                <option value="">No programs on file for this college</option>
              )}
            </select>
          </div>
          <div>
            <label className="fl">Level</label>
            <select className="inp" disabled={lock} value={lv} onChange={(e) => setLv(e.target.value)}>
              {data.levels.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="fl">Site visit date *</label>
            <input className="inp" type="date" value={vd} min={new Date().toISOString().slice(0, 10)} onChange={(e) => setVd(e.target.value)} />
          </div>
          <div>
            <label className="fl">
              Deadline <span style={{ fontWeight: 400, color: "var(--muted)" }}>(optional)</span>
            </label>
            <input className="inp" type="date" value={dl} onChange={(e) => setDl(e.target.value)} />
          </div>
        </div>
      </div>
      <div className="box fbx">
        <div className="ch" style={{ marginBottom: 8 }}>
          <div>
            <h3 style={{ fontSize: 15 }}>Eligible Accreditors</h3>
            <div className="sub">
              {program ? `Auto-matched from expertise: ${elig.length} eligible${discipline ? ` for ${discipline}` : ""} · select exactly 2 (${sel.length}/2 selected)` : "Select a program to see eligible accreditors"}
            </div>
          </div>
          {sug.length === 2 && sel.length < 2 && (
            <Btn
              variant="o"
              sm
              onClick={() => {
                setSel(sug);
                toast.say("Suggested pair selected. You can still change it.");
              }}
            >
              ✨ Use suggested pair
            </Btn>
          )}
        </div>
        {!program ? (
          <Empty>Pick a program first. Eligible accreditors are listed automatically from their expertise.</Empty>
        ) : elig.length ? (
          <div className="tscroll">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Matching expertise</th>
                  <th>Home college</th>
                  <th>Active</th>
                  <th>On visit date</th>
                  <th style={{ textAlign: "center" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {elig.map((r) => {
                  const on = sel.includes(r.id);
                  const blk = Boolean(r.b) && !on;
                  return (
                    <tr key={r.id} className={blk ? "dim" : ""}>
                      <td>
                        <b style={{ fontWeight: 600 }}>{r.name}</b>
                        {sug.includes(r.id) && <small style={{ color: "#1d7a35", fontWeight: 700 }}>✨ Suggested · lowest load</small>}
                      </td>
                      <td>
                        {r.expertise.map((x, i) => (
                          <span key={x}>
                            {i ? ", " : ""}
                            {r.match.includes(x) ? <b className="mx">{x}</b> : x}
                          </span>
                        ))}
                      </td>
                      <td>{r.college}</td>
                      <td>
                        {r.load} program{r.load === 1 ? "" : "s"}
                      </td>
                      <td>{!vd ? <small className="sub">Pick a date</small> : r.b ? <small style={{ color: "var(--red)" }}>Busy · {r.b.short} visit</small> : <small style={{ color: "#1d7a35" }}>✓ Available</small>}</td>
                      <td style={{ textAlign: "center" }}>
                        {blk ? (
                          <Btn variant="gh" sm disabled>
                            Unavailable
                          </Btn>
                        ) : (
                          <Btn variant={on ? "s" : "o"} sm onClick={() => tog(r.id)}>
                            {on ? "✓ Selected" : "Assign"}
                          </Btn>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty>
            No accreditor lists matching expertise yet.
            <br />
            Ask the QAC Admin to add it in <b>Settings › Users</b>.
          </Empty>
        )}
        {excl.length > 0 && (
          <div className="sub" style={{ fontSize: 11.5, marginTop: 8 }}>
            ⛔ Not listed because of conflict of interest (same college): {excl.map((r) => r.name).join(", ")}
          </div>
        )}
        <div className={`qacbox${avail < 2 ? " warn" : ""}`}>
          <div className="qh" onClick={() => setQopen(!qopen)} role="button">
            <span>
              {avail < 2 ? `⚠ Not enough available internal accreditors (${avail} of 2). ` : "Need a replacement? "}
              <b>Assign QAC Personnel as acting IA</b>
            </span>
            <span className="chev">{qShown ? "▾" : "▸"}</span>
          </div>
          {qShown && (
            <>
              <table>
                <thead>
                  <tr>
                    <th>QAC Personnel</th>
                    <th>Expertise</th>
                    <th>Active</th>
                    <th>On visit date</th>
                    <th style={{ textAlign: "center" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {qac.map((q) => {
                    const on = sel.includes(q.id);
                    const b = busy(q.id);
                    return (
                      <tr key={q.id}>
                        <td>
                          <b style={{ fontWeight: 600 }}>{q.name}</b>
                          {q.id === data.me && <span className="sub"> (you)</span>}
                          <small>{q.position} · Quality Assurance Center</small>
                          {on && (
                            <small>
                              <Pill tone="blue">Acting IA</Pill> {acting[q.id]}
                            </small>
                          )}
                        </td>
                        <td>{q.expertise.join(", ") || "—"}</td>
                        <td>
                          {data.load[q.id] ?? 0} program{(data.load[q.id] ?? 0) === 1 ? "" : "s"}
                        </td>
                        <td>{!vd ? <small className="sub">Pick a date</small> : b ? <small style={{ color: "var(--red)" }}>Busy</small> : <small style={{ color: "#1d7a35" }}>✓ Available</small>}</td>
                        <td style={{ textAlign: "center" }}>
                          {on ? (
                            <Btn sm onClick={() => tog(q.id)}>
                              ✓ Acting IA
                            </Btn>
                          ) : (
                            <Btn
                              variant="o"
                              sm
                              disabled={Boolean(b)}
                              onClick={() => {
                                if (sel.length >= 2) return toast.say("Select exactly 2. Remove one first.", true);
                                setReason(REASONS[0]);
                                setCoi(false);
                                setActFor(q.id);
                              }}
                            >
                              Assign as acting IA
                            </Btn>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div className="sub" style={{ fontSize: 11.5, marginTop: 6 }}>
                An acting IA evaluates and signs like a regular internal accreditor. The reason is saved in Activity and shown to the QAC Admin.
              </div>
            </>
          )}
        </div>
      </div>
      <div className="subbar" style={{ border: 0 }}>
        <span className="sub" style={{ margin: 0 }}>
          {miss.length ? (
            <>
              Still needed: <b style={{ color: "var(--text)" }}>{miss.join(", ")}</b>
            </>
          ) : (
            "✅ Ready. Both accreditors get an email and must accept within 3 days."
          )}
        </span>
        <Btn disabled={Boolean(miss.length) || pending} onClick={submit}>
          {lock ? "Save changes" : "Create Assignment"}
        </Btn>
      </div>
      {actFor && (
        <Modal
          title={`Assign ${name(actFor)} as acting IA?`}
          sub="QAC Personnel will replace an internal accreditor for this program"
          onClose={() => setActFor(null)}
          footer={
            <>
              <Btn variant="gh" onClick={() => setActFor(null)}>
                Cancel
              </Btn>
              <Btn
                onClick={() => {
                  if (!coi) return toast.say("Confirm the conflict-of-interest check", true);
                  setActing({ ...acting, [actFor]: reason });
                  setSel([...sel, actFor]);
                  toast.say(`${name(actFor)} added as acting IA`);
                  setActFor(null);
                }}
              >
                Assign as acting IA
              </Btn>
            </>
          }
        >
          <label className="fl">Reason *</label>
          <select className="inp" value={reason} onChange={(e) => setReason(e.target.value)}>
            {REASONS.map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
          <label className="chk2" style={{ marginTop: 10 }}>
            <input type="checkbox" checked={coi} onChange={(e) => setCoi(e.target.checked)} /> I confirm this person has no conflict of interest with this program
          </label>
        </Modal>
      )}
      {done && program && (
        <Modal
          onClose={() => router.push("/portal/assignment")}
          footer={
            <>
              <Btn variant="gh" href="/portal/assignment">
                Back to programs
              </Btn>
              <Btn href={`/portal/assignment?id=${done.programId}`}>Open program ›</Btn>
            </>
          }
        >
          <Result tone="ok" title={lock ? "Assignment saved" : "Assignment created"}>
            <p>
              <b>{program.name}</b>
              <br />
              {levelName} · visit {vd}
              <br />
              {sel.map(name).join(" and ")} were emailed and must accept within 3 days. The visit was added to Events.
            </p>
          </Result>
        </Modal>
      )}
    </div>
  );
}
