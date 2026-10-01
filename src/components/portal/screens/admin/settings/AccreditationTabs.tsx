"use client";

import { useState } from "react";
import { RBar } from "../../../kit/Bar";
import Btn from "../../../kit/Btn";
import Card, { CardHead } from "../../../kit/Card";
import Empty from "../../../kit/Empty";
import Modal from "../../../kit/Modal";
import Pill from "../../../kit/Pill";
import SumRows from "../../../kit/SumRows";
import useAct from "../../../kit/useAct";
import type { CyclesData, SetupData } from "@/lib/settings";
import type { Rules } from "@/lib/settings-model";
import { addArea, addPhaseDoc, closeCycle, extendCycle, openCycle, removeArea, removePhaseDoc, saveSetting } from "@/lib/settings-actions";
import { areaLabel, shortDate } from "@/lib/program-names";

const days = (iso: string, today: string) => Math.round((new Date(iso).getTime() - new Date(today).getTime()) / 864e5);

export function CyclesTab({ data }: { data: CyclesData }) {
  const open = data.cycles.find((c) => c.status === "open");
  const [modal, setModal] = useState<null | "new" | "close" | "extend" | { archive: CyclesData["cycles"][number] }>(null);
  const { toast } = useAct();
  const pct = open ? Math.max(0, Math.min(100, Math.round(((new Date(data.today).getTime() - new Date(open.start).getTime()) / (new Date(open.end).getTime() - new Date(open.start).getTime())) * 100))) : 0;
  return (
    <Card>
      <CardHead
        title="Accreditation Cycles"
        sub="Only one cycle can be open. Closing a cycle freezes its submissions as read-only history."
        right={
          <Btn onClick={() => (open ? toast.say("Close the open cycle first", true) : setModal("new"))} title={open ? "Close the open cycle first" : undefined}>
            ＋ New cycle
          </Btn>
        }
      />
      {open ? (
        <div className="cyc">
          <div>
            <Pill tone="ok">● Open</Pill>
            <h3>{open.name}</h3>
            <p>
              {shortDate(open.start)} – {shortDate(open.end)} · {days(open.end, data.today)} days left
            </p>
            <div style={{ maxWidth: 360 }}>
              <RBar pct={pct} color="var(--maroon)" />
            </div>
          </div>
          <div className="cycs">
            <div>
              <b>{data.inproc}</b>
              <span>programs in process</span>
            </div>
            <div>
              <b>{data.docs}</b>
              <span>documents for review</span>
            </div>
            <div>
              <b>{data.reports}</b>
              <span>reports for review</span>
            </div>
          </div>
          <div className="cyca">
            <Btn variant="o" sm onClick={() => setModal("extend")}>
              Extend window
            </Btn>
            <Btn variant="d" sm onClick={() => setModal("close")}>
              Close cycle
            </Btn>
          </div>
        </div>
      ) : (
        <Empty>No open cycle. Program reps can’t upload until you start one.</Empty>
      )}
      <h3 className="h3s">History</h3>
      <table>
        <thead>
          <tr>
            <th>Cycle</th>
            <th>Window</th>
            <th>Status</th>
            <th>Closed</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {data.cycles
            .filter((c) => c.status !== "open")
            .map((c) => (
              <tr key={c.id}>
                <td>{c.name}</td>
                <td>
                  {shortDate(c.start)} – {shortDate(c.end)}
                </td>
                <td>
                  <Pill tone="miss">{c.status === "closed" ? "Closed · read-only" : "Draft"}</Pill>
                </td>
                <td>
                  {c.closedAt ? shortDate(c.closedAt) : "—"}
                  {c.closedBy && <small>{c.closedBy}</small>}
                </td>
                <td style={{ textAlign: "right" }}>
                  <Btn variant="gh" sm onClick={() => setModal({ archive: c })}>
                    View archive
                  </Btn>
                </td>
              </tr>
            ))}
          {!data.cycles.some((c) => c.status !== "open") && (
            <tr>
              <td colSpan={5}>
                <div className="empty">No past cycles yet.</div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
      {modal === "new" && <NewCycle onClose={() => setModal(null)} />}
      {modal === "close" && open && <CloseCycle id={open.id} name={open.name} inproc={data.inproc} onClose={() => setModal(null)} />}
      {modal === "extend" && open && <ExtendCycle id={open.id} name={open.name} end={open.end} onClose={() => setModal(null)} />}
      {modal && typeof modal === "object" && (
        <Modal title={modal.archive.name} sub="Read-only archive" onClose={() => setModal(null)} footer={<Btn onClick={() => setModal(null)}>Close</Btn>}>
          <SumRows
            rows={[
              ["Window", `${shortDate(modal.archive.start)} – ${shortDate(modal.archive.end)}`],
              ["Closed", modal.archive.closedAt ? shortDate(modal.archive.closedAt) : "—"],
              ["Closed by", modal.archive.closedBy ?? "—"],
            ]}
          />
          <p className="sub" style={{ marginTop: 10, fontSize: 12 }}>
            Submissions from this cycle stay visible in Accreditation and Reports as read-only history.
          </p>
        </Modal>
      )}
    </Card>
  );
}

function NewCycle({ onClose }: { onClose: () => void }) {
  const y = new Date().getFullYear();
  const [name, setName] = useState(`AY ${y}-${y + 1} Accreditation Cycle`);
  const [a, setA] = useState(`${y}-08-01`);
  const [b, setB] = useState(`${y + 1}-05-31`);
  const [carry, setCarry] = useState(true);
  const { busy, run } = useAct();
  return (
    <Modal
      title="New accreditation cycle"
      onClose={onClose}
      footer={
        <>
          <Btn variant="gh" onClick={onClose}>
            Cancel
          </Btn>
          <Btn loading={busy} onClick={() => run(() => openCycle({ name, start: a, end: b, carry }), "New cycle opened", onClose)}>
            Open cycle
          </Btn>
        </>
      }
    >
      <label className="fl">Name</label>
      <input className="inp" value={name} onChange={(e) => setName(e.target.value)} />
      <div className="fg2">
        <div>
          <label className="fl">Opens</label>
          <input className="inp" type="date" value={a} onChange={(e) => setA(e.target.value)} />
        </div>
        <div>
          <label className="fl">Closes</label>
          <input className="inp" type="date" value={b} onChange={(e) => setB(e.target.value)} />
        </div>
      </div>
      <label className="chk2" style={{ marginTop: 10 }}>
        <input type="checkbox" checked={carry} onChange={(e) => setCarry(e.target.checked)} /> Carry over programs that didn’t finish
      </label>
    </Modal>
  );
}

function CloseCycle({ id, name, inproc, onClose }: { id: string; name: string; inproc: number; onClose: () => void }) {
  const [bk, setBk] = useState(true);
  const [conf, setConf] = useState("");
  const { busy, run } = useAct();
  return (
    <Modal
      title={`Close ${name}?`}
      sub="This can’t be undone."
      onClose={onClose}
      locked={busy}
      footer={
        <>
          <Btn variant="gh" onClick={onClose}>
            Cancel
          </Btn>
          <Btn variant="d" disabled={conf !== "CLOSE" || busy} onClick={() => run(() => closeCycle(id, bk), "Cycle closed. Submissions are now read-only.", onClose)}>
            {busy ? "Closing…" : "Close cycle"}
          </Btn>
        </>
      }
    >
      <div className="lockb" style={{ background: "#fdecec" }}>
        ⛔{" "}
        <div>
          <b>{inproc} programs are still in process.</b> Their uploads, reviews and evaluations will be frozen as read-only. Unfinished work stays unfinished.
        </div>
      </div>
      <label className="chk2">
        <input type="checkbox" checked={bk} onChange={(e) => setBk(e.target.checked)} /> Create a backup first (recommended)
      </label>
      <label className="fl" style={{ marginTop: 12 }}>
        Type <b>CLOSE</b> to confirm
      </label>
      <input className="inp" value={conf} onChange={(e) => setConf(e.target.value)} placeholder="CLOSE" />
    </Modal>
  );
}

function ExtendCycle({ id, name, end, onClose }: { id: string; name: string; end: string; onClose: () => void }) {
  const [v, setV] = useState(end);
  const [notify, setNotify] = useState(true);
  const { busy, run } = useAct();
  return (
    <Modal
      title={`Extend ${name}`}
      sub={`Current end: ${shortDate(end)}`}
      onClose={onClose}
      footer={
        <>
          <Btn variant="gh" onClick={onClose}>
            Cancel
          </Btn>
          <Btn loading={busy} onClick={() => run(() => extendCycle(id, v, notify), "Cycle extended", onClose)}>
            Save
          </Btn>
        </>
      }
    >
      <label className="fl">New end date</label>
      <input className="inp" type="date" value={v} onChange={(e) => setV(e.target.value)} />
      <label className="chk2" style={{ marginTop: 10 }}>
        <input type="checkbox" checked={notify} onChange={(e) => setNotify(e.target.checked)} /> Notify all program reps and accreditors about the new date
      </label>
    </Modal>
  );
}

function Chips({ items, onRemove, onAdd }: { items: { id: string; name: string }[]; onRemove: (id: string, name: string) => void; onAdd: () => void }) {
  return (
    <div className="echips">
      {items.map((x) => (
        <span key={x.id}>
          {x.name}
          <button type="button" title="Remove" onClick={() => onRemove(x.id, x.name)}>
            ×
          </button>
        </span>
      ))}
      <Btn variant="gh" sm onClick={onAdd}>
        ＋ Add
      </Btn>
    </div>
  );
}

export function SetupTab({ data }: { data: SetupData }) {
  const [rules, setRules] = useState<Rules>(data.rules);
  const [modal, setModal] = useState<null | { add: "area" | string } | { rm: "area" | "doc"; id: string; name: string }>(null);
  const [name, setName] = useState("");
  const { busy, run } = useAct();
  const num = (k: keyof Rules) => (e: React.ChangeEvent<HTMLInputElement>) => setRules({ ...rules, [k]: Number(e.target.value) });
  return (
    <Card>
      <CardHead title="Accreditation Setup" sub="The requirements every program rep and accreditor sees. Changes apply to the next cycle." />
      <h3 className="h3s">Levels</h3>
      <div className="echips">
        {data.levels.map((l) => (
          <span key={l.id}>{l.name}</span>
        ))}
      </div>
      <h3 className="h3s">Areas · PSV, Level I–II</h3>
      <Chips
        items={data.areas.map((a) => ({ id: a.id, name: areaLabel(a.name) }))}
        onRemove={(id, n) => setModal({ rm: "area", id, name: n })}
        onAdd={() => {
          setName("");
          setModal({ add: "area" });
        }}
      />
      <h3 className="h3s">Pre-Accreditation Phases &amp; required documents</h3>
      {data.phases.map((p) => (
        <div key={p.id} className="phs">
          <b>{p.name}</b>
          <Chips
            items={p.docs}
            onRemove={(id, n) => setModal({ rm: "doc", id, name: n })}
            onAdd={() => {
              setName("");
              setModal({ add: p.id });
            }}
          />
        </div>
      ))}
      <h3 className="h3s">Rules</h3>
      <div className="kv">
        <div>
          <span>Minimum program readiness before accreditors can evaluate</span>
          <span>
            <input className="inp" type="number" value={rules.minReadiness} onChange={num("minReadiness")} style={{ width: 90 }} /> %
          </span>
        </div>
        <div>
          <span>Internal accreditors per program</span>
          <input className="inp" type="number" value={rules.perProgram} onChange={num("perProgram")} style={{ width: 90 }} />
        </div>
        <div>
          <span>Days an accreditor has to accept an assignment</span>
          <input className="inp" type="number" value={rules.acceptDays} onChange={num("acceptDays")} style={{ width: 90 }} />
        </div>
        <div>
          <span>Days accreditors have to evaluate a program (counted from the site visit)</span>
          <input className="inp" type="number" min={1} value={rules.evalDays} onChange={num("evalDays")} style={{ width: 90 }} />
        </div>
        <div>
          <span>Rating scale</span>
          <select className="inp" style={{ width: "auto" }} value={rules.scale} onChange={(e) => setRules({ ...rules, scale: e.target.value })}>
            <option>1–5 (Poor to Excellent)</option>
            <option>AACCUP 0–5</option>
          </select>
        </div>
        <div>
          <span>Official template form code checked on upload</span>
          <input className="inp" value={rules.formCode} onChange={(e) => setRules({ ...rules, formCode: e.target.value })} style={{ width: 160 }} />
        </div>
      </div>
      <div className="subbar">
        <span className="sub" style={{ margin: 0 }}>
          Saved changes are logged in Activity.
        </span>
        <Btn loading={busy} onClick={() => run(() => saveSetting("rules", rules), "Setup saved")}>
          Save changes
        </Btn>
      </div>
      {modal && "add" in modal && (
        <Modal
          title={modal.add === "area" ? "Add area" : `Add a required document · ${data.phases.find((p) => p.id === modal.add)?.name ?? ""}`}
          onClose={() => setModal(null)}
          footer={
            <>
              <Btn variant="gh" onClick={() => setModal(null)}>
                Cancel
              </Btn>
              <Btn
                disabled={busy}
                onClick={() =>
                  run(() => (modal.add === "area" ? addArea(data.psvLevelId ?? "", name) : addPhaseDoc(modal.add, name)), "Added", () => setModal(null))
                }
              >
                Add
              </Btn>
            </>
          }
        >
          <label className="fl">Name</label>
          <input className="inp" autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder={modal.add === "area" ? "e.g. Area XI – Quality Assurance" : "e.g. Attendance Sheet"} />
        </Modal>
      )}
      {modal && "rm" in modal && (
        <Modal
          title={`Remove “${modal.name}”?`}
          onClose={() => setModal(null)}
          footer={
            <>
              <Btn variant="gh" onClick={() => setModal(null)}>
                Cancel
              </Btn>
              <Btn variant="d" loading={busy} onClick={() => run(() => (modal.rm === "area" ? removeArea(modal.id) : removePhaseDoc(modal.id)), "Removed", () => setModal(null))}>
                Remove
              </Btn>
            </>
          }
        >
          <p className="sub" style={{ lineHeight: 1.6 }}>
            Program reps and accreditors will no longer see it. If a program already uploaded for it, it can’t be removed.
          </p>
        </Modal>
      )}
    </Card>
  );
}

