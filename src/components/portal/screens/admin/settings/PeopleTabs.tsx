"use client";

import { useState } from "react";
import useNav from "../../../kit/nav";
import ActLink from "../../../kit/ActLink";
import Btn from "../../../kit/Btn";
import Card, { CardHead } from "../../../kit/Card";
import FilterPills from "../../../kit/FilterPills";
import Modal from "../../../kit/Modal";
import Pill from "../../../kit/Pill";
import RoleChip, { roleLabel } from "../../../kit/RoleChip";
import SearchBox from "../../../kit/SearchBox";
import SegTabs from "../../../kit/SegTabs";
import SumRows from "../../../kit/SumRows";
import useAct from "../../../kit/useAct";
import type { PositionOption, ProgsData, RepsData, UserRow, UsersData } from "@/lib/settings";
import type { UserRole } from "@/lib/database.types";
import { attachRepToProgram, detachRepFromProgram, reassignProgramCollege, setUserActive, setUserRole } from "@/lib/admin";
import { addProgram, deleteInvitation, deleteProgram, deleteUser, editUser, endSessions, inviteUser, resendInvite, sendPasswordReset } from "@/lib/settings-actions";
import { initialsOf } from "@/lib/program-names";

const ROLES: UserRole[] = ["qac_admin", "qac_personnel", "internal_accreditor", "program_representative"];
type UF = "all" | UserRole | "inactive";

export function UsersTab({ users, positions }: UsersData) {
  const [f, setF] = useState<UF>("all");
  const [q, setQ] = useState("");
  const [modal, setModal] = useState<null | { k: "invite" } | { k: "role"; u: UserRow; to: UserRole } | { k: "deact" | "edit" | "del"; u: UserRow }>(null);
  const { busy, run } = useAct();
  const cnt = (k: UF) => users.filter((u) => (k === "all" ? !u.sys : k === "inactive" ? u.status !== "active" : u.role === k && !u.sys)).length;
  const ql = q.toLowerCase();
  const L = users
    .filter((u) => (f === "all" || (f === "inactive" ? u.status !== "active" : u.role === f && !u.sys)) && (!ql || `${u.name}${u.email}`.toLowerCase().includes(ql)))
    .sort((a, b) => Number(a.sys) - Number(b.sys) || a.name.localeCompare(b.name));
  return (
    <Card>
      <CardHead title="Users" sub="Deactivating an account signs the person out on their next request." right={<Btn onClick={() => setModal({ k: "invite" })}>＋ Invite user</Btn>} />
      <FilterPills
        value={f}
        onChange={setF}
        items={(
          [
            ["all", "All"],
            ["qac_admin", "QAC Admin"],
            ["qac_personnel", "QAC Personnel"],
            ["internal_accreditor", "Internal Accreditors"],
            ["program_representative", "Academic Program"],
            ["inactive", "Invited / deactivated"],
          ] as [UF, string][]
        ).map(([k, l]) => ({ key: k, label: `${l} ${cnt(k)}` }))}
      />
      <SearchBox value={q} onChange={setQ} placeholder="Search by name or webmail" style={{ maxWidth: 360, marginBottom: 12 }} />
      <div className="tscroll">
        <table className="utab">
          <thead>
            <tr>
              <th>Name</th>
              <th>Role</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {L.map((u) => (
              <tr key={u.id} className={u.status !== "active" ? "dim" : undefined}>
                <td>
                  <div className="uc">
                    <span className="av2">{u.sys ? "⚙" : initialsOf(u.name)}</span>
                    <div>
                      <b>{u.name}</b>
                      {u.me && <span className="sub"> (you)</span>}
                      <small>{u.email}</small>
                    </div>
                  </div>
                </td>
                <td>
                  {u.me || u.sys || u.status === "invited" ? (
                    <RoleChip role={u.sys ? "system" : u.role} />
                  ) : (
                    <select className="inp rs" value={u.role} onChange={(e) => setModal({ k: "role", u, to: e.target.value as UserRole })}>
                      {ROLES.map((r) => (
                        <option key={r} value={r}>
                          {roleLabel(r)}
                        </option>
                      ))}
                    </select>
                  )}
                  {u.position && <small style={{ display: "block", marginTop: 4 }}>{u.position}</small>}
                  {u.ia && u.role !== "internal_accreditor" && (
                    <small style={{ display: "block", marginTop: 4 }}>
                      ＋ second role: <RoleChip role="internal_accreditor" />
                    </small>
                  )}
                </td>
                <td>
                  {u.status === "active" ? <Pill tone="ok">Active</Pill> : u.status === "invited" ? <Pill tone="pend">Invited</Pill> : <Pill tone="miss">Deactivated</Pill>}
                  <small>{u.status === "invited" ? u.last : `Last active: ${u.last}`}</small>
                </td>
                <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                  {u.sys ? (
                    <span className="sub">🔒 Locked</span>
                  ) : u.status === "invited" ? (
                    <>
                      <Btn variant="o" sm disabled={busy} onClick={() => run(() => resendInvite(u.id), `Invitation re-sent to ${u.email}`)}>
                        Resend
                      </Btn>{" "}
                      <Btn variant="gh" sm title="Cancel invitation" onClick={() => setModal({ k: "del", u })}>
                        🗑
                      </Btn>
                    </>
                  ) : (
                    <>
                      <Btn variant="gh" sm onClick={() => setModal({ k: "edit", u })}>
                        Edit
                      </Btn>{" "}
                      {!u.me &&
                        (u.status === "active" ? (
                          <Btn variant="d" sm onClick={() => setModal({ k: "deact", u })}>
                            Deactivate
                          </Btn>
                        ) : (
                          <Btn variant="o" sm disabled={busy} onClick={() => run(() => setUserActive(u.id, true), "Account reactivated")}>
                            Reactivate
                          </Btn>
                        ))}
                      {!u.me && (
                        <>
                          {" "}
                          <Btn variant="gh" sm title="Delete user" onClick={() => setModal({ k: "del", u })}>
                            🗑
                          </Btn>
                        </>
                      )}
                    </>
                  )}
                </td>
              </tr>
            ))}
            {!L.length && (
              <tr>
                <td colSpan={4}>
                  <div className="empty">No users match.</div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="sub" style={{ fontSize: 11.5, marginTop: 10 }}>
        ℹ The <b>System account</b> (mailer@) sends emails. It’s a locked service account.
      </div>
      {modal?.k === "invite" && <Invite onClose={() => setModal(null)} />}
      {modal?.k === "edit" && <EditUser u={modal.u} positions={positions} onClose={() => setModal(null)} />}
      {modal?.k === "role" && (
        <Modal
          title={`Change role of ${modal.u.name}?`}
          sub={
            <>
              {roleLabel(modal.u.role)} → <b>{roleLabel(modal.to)}</b>
            </>
          }
          onClose={() => setModal(null)}
          footer={
            <>
              <Btn variant="gh" onClick={() => setModal(null)}>
                Cancel
              </Btn>
              <Btn disabled={busy} onClick={() => run(() => setUserRole(modal.u.id, modal.to), "Role changed", () => setModal(null))}>
                Change role
              </Btn>
            </>
          }
        >
          <div className="lockb">
            {modal.to === "qac_admin" ? (
              <>
                ⚠{" "}
                <div>
                  <b>QAC Admin</b> can change settings, users, cycles and restore backups.
                </div>
              </>
            ) : (
              <>
                ℹ{" "}
                <div>
                  They’ll{" "}
                  {modal.u.role === "internal_accreditor"
                    ? "lose access to their assigned evaluations"
                    : modal.u.role === "program_representative"
                      ? "lose access to their program submissions"
                      : "lose their current menu"}{" "}
                  and see the <b>{roleLabel(modal.to)}</b> screens on their next request.
                </div>
              </>
            )}
          </div>
        </Modal>
      )}
      {modal?.k === "deact" && <Deactivate u={modal.u} onClose={() => setModal(null)} />}
      {modal?.k === "del" && <DeleteUser u={modal.u} onClose={() => setModal(null)} />}
    </Card>
  );
}

function DeleteUser({ u, onClose }: { u: UserRow; onClose: () => void }) {
  const { busy, run } = useAct();
  const invite = u.status === "invited";
  const blocked = u.assigned.length > 0;
  return (
    <Modal
      title={invite ? `Cancel the invitation for ${u.name}?` : `Delete ${u.name}?`}
      sub={`${u.email} · ${roleLabel(u.role)}`}
      onClose={onClose}
      footer={
        <>
          <Btn variant="gh" onClick={onClose}>
            Cancel
          </Btn>
          <Btn
            variant="danger"
            disabled={busy || blocked}
            onClick={() => run(() => (invite ? deleteInvitation(u.id) : deleteUser(u.id)), invite ? "Invitation cancelled" : "User moved to Recently Deleted", onClose)}
          >
            {invite ? "Cancel invitation" : "Delete user"}
          </Btn>
        </>
      }
    >
      {blocked && (
        <div className="lockb" style={{ background: "#fff6d6" }}>
          ⚠{" "}
          <div>
            Assigned to <b>{u.assigned.join(", ")}</b>. Reassign these programs before deleting.
          </div>
        </div>
      )}
      <p className="sub" style={{ lineHeight: 1.6 }}>
        {invite
          ? "The invitation link stops working. You can invite them again later."
          : "They’re signed out of every device and removed from the Users list. Their past uploads and records are kept. You can bring them back from Recently Deleted."}
      </p>
    </Modal>
  );
}

function Deactivate({ u, onClose }: { u: UserRow; onClose: () => void }) {
  const { busy, run } = useAct();
  return (
    <Modal
      title={`Deactivate ${u.name}?`}
      sub={`${u.email} · ${roleLabel(u.role)}`}
      onClose={onClose}
      footer={
        <>
          <Btn variant="gh" onClick={onClose}>
            Cancel
          </Btn>
          <Btn
            variant="d"
            disabled={busy}
            onClick={() =>
              run(
                async () => {
                  const r = await setUserActive(u.id, false);
                  if (r.ok) await endSessions({ user: u.id });
                  return r;
                },
                "Account deactivated",
                onClose,
              )
            }
          >
            Deactivate
          </Btn>
        </>
      }
    >
      {u.assigned.length > 0 && (
        <div className="lockb" style={{ background: "#fff6d6" }}>
          ⚠{" "}
          <div>
            Assigned to <b>{u.assigned.join(", ")}</b>. Reassign these programs so evaluations don’t stall.
          </div>
        </div>
      )}
      <p className="sub" style={{ lineHeight: 1.6 }}>
        They’re signed out of every device and can’t sign in until you reactivate the account. The change is kept in Activity.
      </p>
    </Modal>
  );
}

function Invite({ onClose }: { onClose: () => void }) {
  const [v, setV] = useState({ surname: "", given: "", email: "", role: "qac_personnel" as UserRole, ia: false });
  const { busy, run } = useAct();
  return (
    <Modal
      title="Invite user"
      sub="They get an email to create their account"
      onClose={onClose}
      footer={
        <>
          <Btn variant="gh" onClick={onClose}>
            Cancel
          </Btn>
          <Btn disabled={busy} onClick={() => run(() => inviteUser(v), `Invitation sent to ${v.email}`, onClose)}>
            Send invitation
          </Btn>
        </>
      }
    >
      <div className="fg2" style={{ marginTop: 0 }}>
        <div>
          <label className="fl">Last name</label>
          <input className="inp" value={v.surname} onChange={(e) => setV({ ...v, surname: e.target.value })} />
        </div>
        <div>
          <label className="fl">First name</label>
          <input className="inp" value={v.given} onChange={(e) => setV({ ...v, given: e.target.value })} />
        </div>
      </div>
      <label className="fl" style={{ marginTop: 10 }}>
        PUP webmail *
      </label>
      <input className="inp" value={v.email} onChange={(e) => setV({ ...v, email: e.target.value })} placeholder="name@pup.edu.ph" />
      <div className="fg2">
        <div>
          <label className="fl">Role *</label>
          <select className="inp" value={v.role} onChange={(e) => setV({ ...v, role: e.target.value as UserRole })}>
            {["qac_personnel", "internal_accreditor", "program_representative", "qac_admin"].map((r) => (
              <option key={r} value={r}>
                {roleLabel(r)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="fl">Second role (optional)</label>
          <select className="inp" value={v.ia ? "ia" : ""} onChange={(e) => setV({ ...v, ia: e.target.value === "ia" })} disabled={v.role === "internal_accreditor"}>
            <option value="">None</option>
            <option value="ia">Internal Accreditor</option>
          </select>
        </div>
      </div>
      <div className="sub" style={{ fontSize: 11.5, marginTop: 8 }}>
        A person with two roles is never assigned to evaluate their own program.
      </div>
    </Modal>
  );
}

const SCOPES: Record<string, PositionOption["scope"][]> = {
  qac_admin: ["qac"],
  qac_personnel: ["qac"],
  program_representative: ["program"],
  internal_accreditor: ["program", "qac"],
};

function EditUser({ u, positions, onClose }: { u: UserRow; positions: PositionOption[]; onClose: () => void }) {
  const [surname, setSurname] = useState(u.surname);
  const [given, setGiven] = useState(u.given);
  const [ia, setIa] = useState(u.ia);
  const [pos, setPos] = useState(u.positionId ?? "");
  const scopes = SCOPES[u.role] ?? ["program", "qac"];
  const groups = [
    { label: "Academic Program", scope: "program" as const },
    { label: "QAC", scope: "qac" as const },
  ].map((g) => ({ ...g, items: positions.filter((p) => p.scope === g.scope && (scopes.includes(g.scope) || p.id === u.positionId)) }));
  const { busy, run } = useAct();
  return (
    <Modal
      title={`Edit ${u.name}`}
      onClose={onClose}
      footer={
        <>
          <Btn variant="gh" onClick={onClose}>
            Cancel
          </Btn>
          <Btn disabled={busy} onClick={() => run(() => editUser(u.id, { surname, given, ia, positionId: pos || null }), "User updated", onClose)}>
            Save
          </Btn>
        </>
      }
    >
      <div className="fg2" style={{ marginTop: 0 }}>
        <div>
          <label className="fl">Last name</label>
          <input className="inp" value={surname} onChange={(e) => setSurname(e.target.value)} />
        </div>
        <div>
          <label className="fl">First name</label>
          <input className="inp" value={given} onChange={(e) => setGiven(e.target.value)} />
        </div>
      </div>
      <label className="fl" style={{ marginTop: 10 }}>
        PUP webmail
      </label>
      <input className="inp" value={u.email} disabled />
      <label className="fl" style={{ marginTop: 10 }}>
        Position
      </label>
      <select className="inp" value={pos} onChange={(e) => setPos(e.target.value)}>
        <option value="">No position set</option>
        {groups.map(
          (g) =>
            g.items.length > 0 && (
              <optgroup key={g.scope} label={g.label}>
                {g.items.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </optgroup>
            ),
        )}
      </select>
      {u.role !== "internal_accreditor" && (
        <>
          <label className="fl" style={{ marginTop: 10 }}>
            Second role
          </label>
          <select className="inp" value={ia ? "ia" : ""} onChange={(e) => setIa(e.target.value === "ia")}>
            <option value="">None</option>
            <option value="ia">Internal Accreditor</option>
          </select>
        </>
      )}
      <div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
        <Btn variant="gh" sm disabled={busy} onClick={() => run(() => sendPasswordReset(u.email), `Password reset link sent to ${u.email}`)}>
          Send password reset
        </Btn>
        {!u.me && (
          <Btn variant="gh" sm disabled={busy} onClick={() => run(() => endSessions({ user: u.id }), `${u.name} was signed out of all devices`)}>
            Sign out of all devices
          </Btn>
        )}
      </div>
    </Modal>
  );
}

export function RepsTab({ data, sel }: { data: RepsData; sel: string | null }) {
  const router = useNav();
  const cur = data.reps.find((r) => r.id === sel) ?? data.reps[0];
  const [q, setQ] = useState("");
  const [rm, setRm] = useState<{ id: string; name: string; campus: string } | null>(null);
  const { busy, run } = useAct();
  const own = cur ? (data.map[cur.id] ?? []) : [];
  const none = data.programs.filter((p) => !p.rep).length;
  const ql = q.toLowerCase().trim();
  const sug = ql ? data.programs.filter((p) => `${p.name} ${p.campus} ${p.college}`.toLowerCase().includes(ql) && !own.some((o) => o.id === p.id)).slice(0, 6) : [];
  return (
    <Card>
      <CardHead title="Program Representatives" sub="Which programs each representative can upload for" />
      {none > 0 && (
        <div className="lockb" style={{ background: "#fff6d6" }}>
          ⚠{" "}
          <div>
            <b>{none} programs have no representative</b>, so nobody can upload for them.{" "}
            <a className="lnk" role="button" onClick={() => router.push("/portal/settings?tab=progs&pc=none")}>
              See them ›
            </a>
          </div>
        </div>
      )}
      {cur ? (
        <div className="repw">
          <div className="rlist">
            {data.reps.map((u) => {
              const n = (data.map[u.id] ?? []).length;
              return (
                <a key={u.id} className={cur.id === u.id ? "on" : undefined} role="button" onClick={() => router.push(`/portal/settings?tab=reps&rep=${u.id}`, { scroll: false })}>
                  <span className="av2">{initialsOf(u.name)}</span>
                  <div>
                    <b>{u.name}</b>
                    <small>
                      {n} program{n === 1 ? "" : "s"}
                    </small>
                  </div>
                </a>
              );
            })}
          </div>
          <div>
            <h3 style={{ fontSize: 15, marginBottom: 10 }}>{cur.name}</h3>
            <div className="addp">
              <SearchBox value={q} onChange={setQ} placeholder="Add a program: search by program or campus" />
              {ql && (
                <div className="sug">
                  {sug.length ? (
                    sug.map((p) => (
                      <ActLink
                        key={p.id}
                        plain
                        onClick={() => run(() => attachRepToProgram(cur.id, p.id), `${p.name} added to ${cur.name}`, () => setQ(""))}
                      >
                        <b>{p.name}</b>
                        <small>
                          {p.college} · {p.campus}
                          {p.rep ? ` · currently ${p.rep}` : ""}
                        </small>
                      </ActLink>
                    ))
                  ) : (
                    <div className="sub" style={{ padding: 10 }}>
                      No match.
                    </div>
                  )}
                </div>
              )}
            </div>
            {own.length ? (
              <table>
                <thead>
                  <tr>
                    <th>Program</th>
                    <th>Campus</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {own.map((x) => (
                    <tr key={x.id}>
                      <td>{x.name}</td>
                      <td>{x.campus}</td>
                      <td style={{ textAlign: "right" }}>
                        <Btn variant="d" sm onClick={() => setRm(x)}>
                          Remove
                        </Btn>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="empty">No programs yet. Search above to add one.</div>
            )}
          </div>
        </div>
      ) : (
        <div className="empty">No program representatives yet. Invite one from Users.</div>
      )}
      {rm && cur && (
        <Modal
          title="Remove this program?"
          sub={`${rm.name} · ${rm.campus}`}
          onClose={() => setRm(null)}
          footer={
            <>
              <Btn variant="gh" onClick={() => setRm(null)}>
                Cancel
              </Btn>
              <Btn variant="d" disabled={busy} onClick={() => run(() => detachRepFromProgram(cur.id, rm.id), "Program removed", () => setRm(null))}>
                Remove
              </Btn>
            </>
          }
        >
          <p className="sub" style={{ lineHeight: 1.6 }}>
            {cur.name} will no longer upload for this program. Files already uploaded stay with the program.
          </p>
        </Modal>
      )}
    </Card>
  );
}

export function ProgsTab({ data, initialFilter }: { data: ProgsData; initialFilter: string }) {
  const [q, setQ] = useState("");
  const [pc, setPc] = useState(initialFilter);
  const [pv, setPv] = useState<"board" | "list">("board");
  const [exp, setExp] = useState<Set<string>>(new Set());
  const [over, setOver] = useState<string | null>(null);
  const [move, setMove] = useState<{ p: ProgsData["programs"][number]; to: string } | null>(null);
  const [add, setAdd] = useState(false);
  const [del, setDel] = useState<ProgsData["programs"][number] | null>(null);
  const { busy, run } = useAct();
  const ql = q.toLowerCase();
  const F = (p: ProgsData["programs"][number]) => (!ql || p.name.toLowerCase().includes(ql)) && (pc === "all" || (pc === "none" ? !p.hasRep : p.collegeId === pc));
  const col = (id: string) => data.colleges.find((c) => c.id === id);
  const ask = (pid: string, to: string) => {
    const p = data.programs.find((x) => x.id === pid);
    if (p && p.collegeId !== to) setMove({ p, to });
  };
  return (
    <Card>
      <CardHead title="Program Management" sub="Move a program to another college, or add and delete programs. Its accreditation documents and records move with it." right={<Btn onClick={() => setAdd(true)}>＋ Add program</Btn>} />
      <div className="ftools" style={{ marginBottom: 14 }}>
        <SearchBox value={q} onChange={setQ} placeholder="Search programs" />
        <label className="fl">College</label>
        <select className="inp" value={pc} onChange={(e) => setPc(e.target.value)}>
          <option value="all">All</option>
          <option value="none">No representative</option>
          {data.colleges.map((c) => (
            <option key={c.id} value={c.id}>
              {c.code}
            </option>
          ))}
        </select>
        <SegTabs
          flush
          value={pv}
          onChange={setPv}
          tabs={[
            { key: "board", label: "Board" },
            { key: "list", label: "List" },
          ]}
        />
      </div>
      {pv === "list" ? (
        (() => {
          const L = data.programs.filter(F);
          return (
            <>
              <div className="tscroll">
                <table>
                  <thead>
                    <tr>
                      <th>Program</th>
                      <th>Campus</th>
                      <th>Representative</th>
                      <th>College</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {L.map((p) => (
                      <tr key={p.id}>
                        <td>{p.name}</td>
                        <td>
                          {p.campus}
                          {p.alsoAt.length > 0 && <small>Also at {p.alsoAt.join(", ")}</small>}
                        </td>
                        <td>{p.hasRep ? "Assigned" : <Pill tone="ret">None</Pill>}</td>
                        <td>
                          <select className="inp" style={{ width: "auto" }} value={p.collegeId ?? ""} onChange={(e) => ask(p.id, e.target.value)}>
                            {!p.collegeId && <option value="">—</option>}
                            {data.colleges.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.code}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <Btn variant="gh" sm title="Delete program" onClick={() => setDel(p)}>
                            🗑
                          </Btn>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="sub" style={{ fontSize: 11.5, marginTop: 8 }}>
                {L.length} programs
              </div>
            </>
          );
        })()
      ) : (
        <>
          <div className="pboard">
            {data.colleges.map((c) => {
              const L = data.programs.filter((p) => p.collegeId === c.id && F(p));
              if ((q || pc !== "all") && !L.length) return null;
              const open = exp.has(c.id) || Boolean(q);
              return (
                <div
                  key={c.id}
                  className={`pcol${over === c.id ? " ov" : ""}`}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setOver(c.id);
                  }}
                  onDragLeave={() => setOver(null)}
                  onDrop={(e) => {
                    setOver(null);
                    ask(e.dataTransfer.getData("text"), c.id);
                  }}
                >
                  <div className="pch">
                    <b>{c.code}</b>
                    <span>{data.programs.filter((p) => p.collegeId === c.id).length}</span>
                  </div>
                  {(open ? L : L.slice(0, 8)).map((p) => (
                    <div key={p.id} className="pcard" draggable onDragStart={(e) => e.dataTransfer.setData("text", p.id)} title="Drag to another college">
                      <span className="gr">⠿</span>
                      <div>
                        <b>{p.name}</b>
                        <small>
                          {p.campus}
                          {p.alsoAt.length > 0 && <> · also at {p.alsoAt.join(", ")}</>}
                          {!p.hasRep && (
                            <>
                              {" "}
                              · <span style={{ color: "var(--red)" }}>no rep</span>
                            </>
                          )}
                        </small>
                      </div>
                      <Btn variant="gh" sm title="Delete program" className="pdel" onClick={() => setDel(p)}>
                        🗑
                      </Btn>
                    </div>
                  ))}
                  {!L.length && (
                    <div className="sub" style={{ fontSize: 11.5, padding: 6 }}>
                      Drop a program here
                    </div>
                  )}
                  {!q && L.length > 8 && (
                    <a
                      className="lnk"
                      role="button"
                      style={{ display: "block", textAlign: "center", padding: 4 }}
                      onClick={() => {
                        const n = new Set(exp);
                        if (n.has(c.id)) n.delete(c.id);
                        else n.add(c.id);
                        setExp(n);
                      }}
                    >
                      {exp.has(c.id) ? "Show less" : `Show all ${L.length}`}
                    </a>
                  )}
                </div>
              );
            })}
          </div>
          <div className="sub" style={{ fontSize: 11.5, marginTop: 10 }}>
            Tip: on a phone or without a mouse, use the <b>List</b> view and pick the new college.
          </div>
        </>
      )}
      {move && (
        <Modal
          title="Move this program?"
          sub={`${move.p.name} · ${move.p.campus}`}
          onClose={() => setMove(null)}
          footer={
            <>
              <Btn variant="gh" onClick={() => setMove(null)}>
                Cancel
              </Btn>
              <Btn disabled={busy} onClick={() => run(() => reassignProgramCollege(move.p.id, move.to), `Program moved to ${col(move.to)?.code}`, () => setMove(null))}>
                Move program
              </Btn>
            </>
          }
        >
          <SumRows
            flush
            rows={[
              ["From", move.p.collegeId ? (col(move.p.collegeId)?.name ?? move.p.college) : "No college"],
              ["To", col(move.to)?.name ?? ""],
              ["Moves with it", "Accreditation records, uploaded files, AACCUP & COPC folders"],
            ]}
          />
          <p className="sub" style={{ marginTop: 10, fontSize: 12 }}>
            Nothing needs to be re-uploaded. The move is logged in Activity and can be moved back.
          </p>
        </Modal>
      )}
      {add && <AddProgram data={data} onClose={() => setAdd(false)} />}
      {del && (
        <Modal
          title="Delete this program?"
          sub={`${del.name} · ${del.campus}`}
          onClose={() => setDel(null)}
          footer={
            <>
              <Btn variant="gh" onClick={() => setDel(null)}>
                Cancel
              </Btn>
              <Btn variant="danger" disabled={busy} onClick={() => run(() => deleteProgram(del.id), "Program moved to Recently Deleted", () => setDel(null))}>
                Delete
              </Btn>
            </>
          }
        >
          <p className="sub">
            It disappears from lists, reports and uploads. Its records are kept, and you can bring it back from <b>Recently Deleted</b>.
          </p>
        </Modal>
      )}
    </Card>
  );
}

function AddProgram({ data, onClose }: { data: ProgsData; onClose: () => void }) {
  const [n, setN] = useState("");
  const [c, setC] = useState(data.colleges[0]?.id ?? "");
  const [m, setM] = useState<string[]>(data.campuses.filter((x) => x.main).map((x) => x.id));
  const { busy, run } = useAct();
  return (
    <Modal
      title="Add program"
      onClose={onClose}
      footer={
        <>
          <Btn variant="gh" onClick={onClose}>
            Cancel
          </Btn>
          <Btn disabled={busy} onClick={() => run(() => addProgram(n, c, m), m.length > 1 ? `Program added to ${m.length} campuses` : "Program added", onClose)}>
            Add
          </Btn>
        </>
      }
    >
      <label className="fl">Program name *</label>
      <input className="inp" value={n} onChange={(e) => setN(e.target.value)} placeholder="e.g. Bachelor of Science in Data Science" />
      <div className="fg2">
        <div>
          <label className="fl">College</label>
          <select className="inp" value={c} onChange={(e) => setC(e.target.value)}>
            <option value="">No college (other campuses)</option>
            {data.colleges.map((x) => (
              <option key={x.id} value={x.id}>
                {x.code}
              </option>
            ))}
          </select>
        </div>
      </div>
      <label className="fl" style={{ marginTop: 10 }}>
        Offered at *
      </label>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(170px,1fr))", gap: "6px 12px", maxHeight: 190, overflowY: "auto" }}>
        {data.campuses.map((x) => (
          <label key={x.id} style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 13, cursor: "pointer" }}>
            <input type="checkbox" checked={m.includes(x.id)} onChange={(e) => setM(e.target.checked ? [...m, x.id] : m.filter((id) => id !== x.id))} />
            {x.name}
          </label>
        ))}
      </div>
      <div className="sub" style={{ fontSize: 11.5, marginTop: 8 }}>
        The college applies to the main campus. Each other campus gets its own copy of the program.
      </div>
    </Modal>
  );
}
