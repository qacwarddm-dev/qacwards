"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import useBusy from "../../kit/useBusy";
import Btn from "../../kit/Btn";
import Card from "../../kit/Card";
import Modal from "../../kit/Modal";
import Pill from "../../kit/Pill";
import Scope from "../../kit/Scope";
import { useToast } from "../../kit/ToastProvider";
import { statusLabel, type IaAssignment } from "@/lib/ia-model";
import { respondToAssignment } from "@/lib/assignment-actions";

const TONE = { blue: "pb", miss: "px", pend: "py", ok: "pg" } as const;

export default function IaAssignments({ assignments }: { assignments: IaAssignment[] }) {
  const [accept, setAccept] = useState<IaAssignment | null>(null);
  const [decline, setDecline] = useState<IaAssignment | null>(null);
  const [agree, setAgree] = useState(false);
  const [reason, setReason] = useState("Conflict of interest");
  const [pending, start] = useBusy();
  const toast = useToast();
  const router = useRouter();

  function respond(a: IaAssignment, response: "accepted" | "rejected") {
    return start(async () => {
      const r = await respondToAssignment(a.id, response, response === "rejected" ? reason : undefined);
      if (!r.ok) return toast.say(r.error, true);
      setAccept(null);
      setDecline(null);
      toast.say(response === "accepted" ? "Assignment accepted" : "Assignment declined. QAC was notified.");
      router.refresh();
    });
  }

  return (
    <Scope name="ia">
      <Card>
        <h2>Accreditation Assignments</h2>
        <table>
          <thead>
            <tr>
              <th>Program</th>
              <th>Campus</th>
              <th>Level</th>
              <th>Date Visit</th>
              <th>Assigned Accreditor</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody className="asgt">
            {assignments.map((a) => {
              const st = statusLabel(a);
              return (
                <tr key={a.id}>
                  <td>
                    <b style={{ fontWeight: 600 }}>{a.mid}</b>
                  </td>
                  <td>
                    {a.campus}
                    <small>{a.college}</small>
                  </td>
                  <td>{a.levelName}</td>
                  <td>{a.visitLabel}</td>
                  <td>
                    {a.team
                      .filter((m) => m.response !== "rejected" || m.me)
                      .map((m) => (
                        <span key={m.id} className="chip">
                          <i>{m.initials}</i>
                          {m.name}
                          {m.me ? " (you)" : ""}
                        </span>
                      ))}
                  </td>
                  <td>
                    <Pill tone={TONE[st.tone]}>{st.t}</Pill>
                  </td>
                  <td>
                    {a.myResponse === "pending" ? (
                      <>
                        <Btn
                          onClick={() => {
                            setAgree(false);
                            setAccept(a);
                          }}
                        >
                          Accept
                        </Btn>{" "}
                        <Btn
                          variant="d"
                          onClick={() => {
                            setReason("Conflict of interest");
                            setDecline(a);
                          }}
                        >
                          Decline
                        </Btn>
                      </>
                    ) : a.myResponse === "accepted" ? (
                      <span style={{ fontSize: 12, color: "var(--muted)" }}>Accepted</span>
                    ) : null}
                  </td>
                </tr>
              );
            })}
            {!assignments.length && (
              <tr>
                <td colSpan={7}>
                  <div className="ph">No assignments yet. QAC will notify you when one is made.</div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>

      {accept && (
        <Modal
          onClose={() => setAccept(null)}
          title="Accept assignment"
          sub={`${accept.mid} · ${accept.levelName} · Visit ${accept.visitLabel}`}
          footer={
            <>
              <Btn variant="o" onClick={() => setAccept(null)}>
                Cancel
              </Btn>
              <Btn disabled={!agree || pending} onClick={() => respond(accept, "accepted")}>
                Accept
              </Btn>
            </>
          }
        >
          <div style={{ fontSize: 13, lineHeight: 1.6 }}>Before accepting, please confirm you have no conflict of interest with this program.</div>
          <label className="chk">
            <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} />I am not a faculty member, staff, or relative of anyone in this
            program, and I have no other interest that could affect my evaluation.
          </label>
        </Modal>
      )}

      {decline && (
        <Modal
          onClose={() => setDecline(null)}
          title="Decline assignment"
          sub={decline.mid}
          footer={
            <>
              <Btn variant="o" onClick={() => setDecline(null)}>
                Cancel
              </Btn>
              <Btn variant="d" disabled={pending} onClick={() => respond(decline, "rejected")}>
                Decline
              </Btn>
            </>
          }
        >
          <label className="fl">Reason (so QAC can reassign)</label>
          <select className="sel" style={{ margin: 0 }} value={reason} onChange={(e) => setReason(e.target.value)}>
            {["Conflict of interest", "Schedule conflict", "Outside my expertise", "Other"].map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
        </Modal>
      )}
    </Scope>
  );
}
