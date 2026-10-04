"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import useBusy from "../../../kit/useBusy";
import ActLink from "../../../kit/ActLink";
import Btn from "../../../kit/Btn";
import Card, { CardHead } from "../../../kit/Card";
import Modal from "../../../kit/Modal";
import Pill from "../../../kit/Pill";
import Toggle from "../../../kit/Toggle";
import useAct from "../../../kit/useAct";
import type { BackupData, EmailData, PublicData, SecurityData } from "@/lib/settings";
import { NOTIFY_ROWS, type BackupPrefs, type PublicInfo, type Security } from "@/lib/settings-model";
import { sendQueuedEmailsNow } from "@/lib/admin";
import {
  backupUrl,
  createBackup,
  deleteAnnouncement,
  endSessions,
  exportData,
  retryFailedEmails,
  saveAnnouncement,
  saveSetting,
  updateAnnouncement,
} from "@/lib/settings-actions";
import { shortDate } from "@/lib/program-names";

function Kv({ label, sub, children }: { label: React.ReactNode; sub?: string; children: React.ReactNode }) {
  return (
    <div>
      <span>
        {label}
        {sub && <small>{sub}</small>}
      </span>
      {children}
    </div>
  );
}

export function PublicTab({ data }: { data: PublicData }) {
  const [p, setP] = useState<PublicInfo>(data.info);
  const [modal, setModal] = useState<null | "ann" | "preview">(null);
  const { busy, run } = useAct();
  const set = (patch: Partial<PublicInfo>) => setP({ ...p, ...patch });
  const live = data.accredited.filter((a) => !p.hidden.includes(a.id) && (!a.to || a.to >= data.today));
  return (
    <Card>
      <CardHead
        title="Public Information"
        sub="What visitors see on the public QAC-WARDS page (no login needed)"
        right={
          <Btn variant="o" onClick={() => setModal("preview")}>
            👁 Preview public page
          </Btn>
        }
      />
      <div className="kv">
        <Kv label={<b>Public page is live</b>} sub="Turn off to show a “temporarily unavailable” page">
          <Toggle
            checked={p.live}
            onChange={(v) => {
              set({ live: v });
              return run(() => saveSetting("public", { ...p, live: v }), v ? "Public page published" : "Public page hidden");
            }}
          />
        </Kv>
      </div>
      <h3 className="h3s">
        Announcements{" "}
        <span style={{ marginLeft: "auto" }}>
          <Btn sm onClick={() => setModal("ann")}>
            ＋ New announcement
          </Btn>
        </span>
      </h3>
      <table>
        <thead>
          <tr>
            <th>Title</th>
            <th>Date</th>
            <th>Status</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {data.announcements.map((a) => (
            <tr key={a.id}>
              <td>
                {a.pinned ? "📌 " : ""}
                {a.title}
              </td>
              <td>{a.date}</td>
              <td>
                {a.published && a.publishOn <= data.today ? (
                  <Pill tone="ok">Published</Pill>
                ) : a.published ? (
                  <Pill tone="blue">Scheduled · {shortDate(a.publishOn)}</Pill>
                ) : (
                  <Pill tone="miss">Draft</Pill>
                )}
              </td>
              <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                <Btn variant="gh" sm disabled={busy} onClick={() => run(() => updateAnnouncement(a.id, { is_pinned: !a.pinned }), a.pinned ? "Unpinned" : "Pinned")}>
                  {a.pinned ? "Unpin" : "Pin"}
                </Btn>{" "}
                <Btn
                  variant="gh"
                  sm
                  disabled={busy}
                  onClick={() =>
                    run(() => updateAnnouncement(a.id, a.published ? { is_published: false } : { is_published: true, publish_on: data.today }), a.published ? "Unpublished" : "Published")
                  }
                >
                  {a.published ? "Unpublish" : "Publish"}
                </Btn>{" "}
                <Btn variant="gh" sm disabled={busy} onClick={() => run(() => deleteAnnouncement(a.id), "Announcement deleted")}>
                  🗑
                </Btn>
              </td>
            </tr>
          ))}
          {!data.announcements.length && (
            <tr>
              <td colSpan={4}>
                <div className="empty">No announcements yet.</div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
      <h3 className="h3s">Accredited programs directory</h3>
      <div className="kv">
        <Kv label={<b>Show the directory</b>} sub={`Auto-filled from accreditation records (${data.accredited.length} programs)`}>
          <Toggle checked={p.dir} onChange={(v) => set({ dir: v })} />
        </Kv>
        <Kv label="Show level">
          <Toggle checked={p.lv} onChange={(v) => set({ lv: v })} />
        </Kv>
        <Kv label="Show valid-until date">
          <Toggle checked={p.val} onChange={(v) => set({ val: v })} />
        </Kv>
        <Kv label="Show campus">
          <Toggle checked={p.camp} onChange={(v) => set({ camp: v })} />
        </Kv>
        <Kv label={<b>Hide specific programs</b>} sub="e.g. expired or under appeal">
          <div className="echips">
            {p.hidden.map((h) => {
              const a = data.accredited.find((x) => x.id === h);
              return (
                <span key={h}>
                  {a ? `${a.short} · ${a.campus.split(",")[0]}` : "Program"}
                  <button type="button" onClick={() => set({ hidden: p.hidden.filter((x) => x !== h) })}>
                    ×
                  </button>
                </span>
              );
            })}
            <select className="inp" style={{ width: "auto" }} value="" onChange={(e) => e.target.value && set({ hidden: [...p.hidden, e.target.value] })}>
              <option value="">＋ Hide a program</option>
              {data.accredited
                .filter((a) => !p.hidden.includes(a.id))
                .map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.short} · {a.campus}
                  </option>
                ))}
            </select>
          </div>
        </Kv>
      </div>
      <h3 className="h3s">Contact &amp; office</h3>
      <div className="fg2">
        {(
          [
            ["email", "Email"],
            ["phone", "Phone"],
            ["room", "Office"],
            ["hrs", "Office hours"],
          ] as const
        ).map(([k, l]) => (
          <div key={k}>
            <label className="fl">{l}</label>
            <input className="inp" value={p[k]} onChange={(e) => set({ [k]: e.target.value })} />
          </div>
        ))}
      </div>
      <label className="fl" style={{ marginTop: 12 }}>
        About the QA Center
      </label>
      <textarea className="inp" rows={3} value={p.about} onChange={(e) => set({ about: e.target.value })} />
      <h3 className="h3s">Public downloads</h3>
      <div className="kv">
        <Kv label="Non-Disclosure Agreement (blank)" sub="from Documents › NDA Form">
          <Toggle checked={p.forms.nda} onChange={(v) => set({ forms: { ...p.forms, nda: v } })} />
        </Kv>
        <Kv label="PUP Document Template" sub="the General template from Documents › Templates">
          <Toggle checked={p.forms.tpl} onChange={(v) => set({ forms: { ...p.forms, tpl: v } })} />
        </Kv>
        <Kv label="Accreditation guide (PDF)">
          <Toggle checked={p.forms.guide} onChange={(v) => set({ forms: { ...p.forms, guide: v } })} />
        </Kv>
      </div>
      <div className="subbar">
        <span className="sub" style={{ margin: 0 }}>
          {p.publishedAt ? `Last published ${shortDate(p.publishedAt)}${p.publishedBy ? ` by ${p.publishedBy}` : ""}` : "Not published from here yet"}
        </span>
        <Btn disabled={busy} onClick={() => run(() => saveSetting("public", { ...p, publishedAt: new Date().toISOString() }), "Public information saved and published")}>
          Save &amp; publish
        </Btn>
      </div>
      {modal === "ann" && <NewAnnouncement today={data.today} onClose={() => setModal(null)} />}
      {modal === "preview" && (
        <Modal size="wide" title="Public page preview" sub="qacwards.vercel.app" onClose={() => setModal(null)} bodyStyle={{ background: "#f3f3f3" }} footer={<Btn onClick={() => setModal(null)}>Close</Btn>}>
          <div className="pubp">
            <div className="pubh">
              <img src="/assets/portal/mockup/seal.png" alt="" />
              <div>
                <small>POLYTECHNIC UNIVERSITY OF THE PHILIPPINES</small>
                <b>Quality Assurance Center</b>
              </div>
              <span className="btn bs sm" style={{ marginLeft: "auto" }}>
                Sign in
              </span>
            </div>
            <div className="pubb">
              <p>{p.about}</p>
              <h4>Announcements</h4>
              {data.announcements
                .filter((a) => a.published && a.publishOn <= data.today)
                .map((a) => (
                  <div key={a.id} className="puba">
                    {a.pinned ? "📌 " : ""}
                    <b>{a.title}</b>
                    <small>{a.date}</small>
                  </div>
                ))}
              {p.dir && (
                <>
                  <h4>Accredited programs</h4>
                  <table>
                    <tbody>
                      <tr>
                        <th>Program</th>
                        {p.camp && <th>Campus</th>}
                        {p.lv && <th>Level</th>}
                        {p.val && <th>Valid until</th>}
                      </tr>
                      {live.map((a) => (
                        <tr key={a.id}>
                          <td>{a.name}</td>
                          {p.camp && <td>{a.campus}</td>}
                          {p.lv && <td>{a.level}</td>}
                          {p.val && <td>{a.to ? shortDate(a.to) : "—"}</td>}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              )}
              <h4>Contact</h4>
              <p>
                ✉ {p.email} · ☎ {p.phone}
                <br />📍 {p.room}
                <br />🕘 {p.hrs}
              </p>
            </div>
          </div>
        </Modal>
      )}
    </Card>
  );
}

function NewAnnouncement({ today, onClose }: { today: string; onClose: () => void }) {
  const [v, setV] = useState({ title: "", body: "", publishOn: today, audience: "Public + all users", pinned: false });
  const { busy, run } = useAct();
  return (
    <Modal
      title="New announcement"
      onClose={onClose}
      footer={
        <>
          <Btn variant="gh" onClick={onClose}>
            Cancel
          </Btn>
          <Btn disabled={busy} onClick={() => run(() => saveAnnouncement(v), "Announcement saved", onClose)}>
            Save
          </Btn>
        </>
      }
    >
      <label className="fl">Title *</label>
      <input className="inp" value={v.title} onChange={(e) => setV({ ...v, title: e.target.value })} />
      <label className="fl" style={{ marginTop: 10 }}>
        Message
      </label>
      <textarea className="inp" rows={4} value={v.body} onChange={(e) => setV({ ...v, body: e.target.value })} />
      <div className="fg2">
        <div>
          <label className="fl">Publish on</label>
          <input className="inp" type="date" value={v.publishOn} onChange={(e) => setV({ ...v, publishOn: e.target.value })} />
        </div>
        <div>
          <label className="fl">Audience</label>
          <select className="inp" value={v.audience} onChange={(e) => setV({ ...v, audience: e.target.value })}>
            {["Public + all users", "Logged-in users only", "Program reps only", "Accreditors only"].map((a) => (
              <option key={a}>{a}</option>
            ))}
          </select>
        </div>
      </div>
      <label className="chk2" style={{ marginTop: 10 }}>
        <input type="checkbox" checked={v.pinned} onChange={(e) => setV({ ...v, pinned: e.target.checked })} /> Pin to top
      </label>
    </Modal>
  );
}

export function EmailTab({ data }: { data: EmailData }) {
  const router = useRouter();
  const [notify, setNotify] = useState(data.notify);
  const [modal, setModal] = useState<null | "send" | EmailData["groups"][number]>(null);
  const { busy, run, toast } = useAct();
  const [sending, start] = useBusy();
  const sendNow = () =>
    start(async () => {
      const r = await sendQueuedEmailsNow();
      if (!r.ok) return toast.say(r.error, true);
      setModal(null);
      toast.say(`${r.sent} emails sent${r.failed ? ` · ${r.failed} failed` : ""}`, r.failed > 0);
      router.refresh();
    });
  return (
    <Card>
      <CardHead title="Email & Notifications" sub="Emails are queued and sent automatically" />
      <div className="sysg s3">
        <div>
          <span>Queued</span>
          <b>{data.queued}</b>
          <small>{data.queued ? "sent by the scheduled job" : "nothing waiting"}</small>
        </div>
        <div>
          <span>Sent today</span>
          <b>{data.sentToday}</b>
          <small>since midnight</small>
        </div>
        <div>
          <span>Failed</span>
          <b style={{ color: data.failed ? "var(--red)" : undefined }}>{data.failed}</b>
          <small>
            {data.failed ? (
              <ActLink onClick={() => run(() => retryFailedEmails(), `${data.failed} emails re-queued`)}>Retry</ActLink>
            ) : (
              "none"
            )}
          </small>
        </div>
      </div>
      <h3 className="h3s">Queue</h3>
      <table>
        <thead>
          <tr>
            <th>Type</th>
            <th>Emails</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {data.groups.map((g) => (
            <tr key={g.subject}>
              <td>{g.subject}</td>
              <td>{g.n}</td>
              <td style={{ textAlign: "right" }}>
                <Btn variant="gh" sm onClick={() => setModal(g)}>
                  Preview
                </Btn>
              </td>
            </tr>
          ))}
          {!data.groups.length && (
            <tr>
              <td colSpan={3}>
                <div className="empty">Queue is empty.</div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
      <div className="subbar">
        <span className="sub" style={{ margin: 0 }}>
          The scheduled job sends the queue automatically. Use this only when something is urgent.
        </span>
        <Btn disabled={!data.queued} onClick={() => setModal("send")}>
          Send {data.queued} emails now
        </Btn>
      </div>
      <h3 className="h3s">Who gets notified</h3>
      <div className="kv">
        {NOTIFY_ROWS.map(([k, a, b]) => (
          <Kv key={k} label={<b>{a}</b>} sub={b}>
            <Toggle
              checked={notify[k] !== false}
              onChange={(v) => {
                const next = { ...notify, [k]: v };
                setNotify(next);
                return run(() => saveSetting("notify", next), "Saved");
              }}
            />
          </Kv>
        ))}
      </div>
      {modal === "send" && (
        <Modal
          title={`Send ${data.queued} emails now?`}
          onClose={() => setModal(null)}
          footer={
            <>
              <Btn variant="gh" onClick={() => setModal(null)}>
                Cancel
              </Btn>
              <Btn disabled={sending || busy} onClick={sendNow}>
                {sending ? "Sending…" : "Send now"}
              </Btn>
            </>
          }
        >
          <p className="sub" style={{ lineHeight: 1.6 }}>
            {data.groups.map((g) => (
              <span key={g.subject}>
                {g.n} × {g.subject}
                <br />
              </span>
            ))}
          </p>
        </Modal>
      )}
      {modal && typeof modal === "object" && (
        <Modal title={modal.subject} sub={`${modal.n} recipient${modal.n > 1 ? "s" : ""} · first one shown`} onClose={() => setModal(null)} footer={<Btn onClick={() => setModal(null)}>Close</Btn>}>
          <div className="mailp">
            <div>
              <b>To:</b> {modal.sample.to}
            </div>
            <div>
              <b>Subject:</b> {modal.sample.subject}
            </div>
            <hr />
            <p style={{ whiteSpace: "pre-line" }}>{modal.sample.body}</p>
          </div>
        </Modal>
      )}
    </Card>
  );
}

export function BackupTab({ data }: { data: BackupData }) {
  const [prefs, setPrefs] = useState<BackupPrefs>(data.prefs);
  const [restore, setRestore] = useState<BackupData["rows"][number] | null>(null);
  const [log, setLog] = useState<BackupData["rows"][number] | null>(null);
  const { busy, run, toast } = useAct();
  const [dl, startDl] = useBusy();
  const last = data.rows[0];
  const save = (patch: Partial<BackupPrefs>) => {
    const next = { ...prefs, ...patch };
    setPrefs(next);
    return run(() => saveSetting("backup", next), "Saved");
  };
  const download = (id: string) =>
    startDl(async () => {
      const r = await backupUrl(id);
      if (!r.ok) return toast.say(r.error, true);
      window.location.href = r.data;
    });
  const exp = (kind: Parameters<typeof exportData>[0], label: string) =>
    startDl(async () => {
      const r = await exportData(kind);
      if (!r.ok) return toast.say(r.error, true);
      const a = document.createElement("a");
      a.href = `data:text/csv;charset=utf-8,${encodeURIComponent(r.data)}`;
      a.download = `QAC-WARDS-${label.replace(/\s+/g, "-")}.csv`;
      a.click();
      toast.say(`Exported ${label} (.csv)`);
    });
  return (
    <Card>
      <CardHead
        title="Backup & Restore"
        sub="Database export (JSON), kept in the backups bucket"
        right={
          <Btn disabled={busy} loadingLabel="Backing up…" onClick={() => run(() => createBackup(), "Backup finished")}>
            💾 Back up now
          </Btn>
        }
      />
      <div className="sysg s3">
        <div>
          <span>Last backup</span>
          <b>{last?.date ?? "None yet"}</b>
          <small>{last ? `${last.time} · ${last.size} · ${last.ok ? "✓ successful" : "failed"}` : "Back up now to create one"}</small>
        </div>
        <div>
          <span>Next automatic</span>
          <b>{prefs.auto ? "Daily" : "Off"}</b>
          <small>{prefs.auto ? prefs.time : "turn on below"}</small>
        </div>
        <div>
          <span>Storage used</span>
          <b>{data.used}</b>
          <div className="bar" style={{ marginTop: 6 }}>
            <i style={{ width: `${data.usedPct}%` }} />
          </div>
        </div>
      </div>
      {busy && (
        <div className="lockb" style={{ background: "#e8eefb" }}>
          💾{" "}
          <div style={{ flex: 1 }}>
            <b>Backing up…</b>
          </div>
        </div>
      )}
      <h3 className="h3s">Schedule</h3>
      <div className="kv">
        <Kv label={<b>Automatic daily backup</b>}>
          <Toggle checked={prefs.auto} onChange={(v) => save({ auto: v })} />
        </Kv>
        <Kv label="Time">
          <input className="inp" type="time" value={prefs.time} onChange={(e) => save({ time: e.target.value })} style={{ width: 130 }} />
        </Kv>
        <Kv label="Keep backups for">
          <select className="inp" style={{ width: "auto" }} value={prefs.keep} onChange={(e) => save({ keep: Number(e.target.value) })}>
            {[30, 60, 90].map((d) => (
              <option key={d} value={d}>
                {d} days
              </option>
            ))}
          </select>
        </Kv>
        <Kv label={<b>Include uploaded files</b>} sub="PDFs in storage, not just the database">
          <Toggle checked={prefs.files} onChange={(v) => save({ files: v })} />
        </Kv>
        <Kv label={<b>Off-site copy</b>} sub="Also copy each backup to the QAC Google Drive">
          <Toggle checked={prefs.offsite} onChange={(v) => save({ offsite: v })} />
        </Kv>
        <Kv label="Email the Director if a backup fails">
          <Toggle checked={prefs.mailFail} onChange={(v) => save({ mailFail: v })} />
        </Kv>
      </div>
      <h3 className="h3s">Backups</h3>
      <div className="tscroll">
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Type</th>
              <th>Size</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {data.rows.map((b) => (
              <tr key={b.id}>
                <td>
                  {b.date} · {b.time}
                </td>
                <td>
                  {b.note && b.note !== "Manual" ? b.note : b.kind}
                  {b.by && <small>{b.by}</small>}
                </td>
                <td>{b.size}</td>
                <td>{b.ok ? <Pill tone="ok">Successful</Pill> : <Pill tone="ret">Failed</Pill>}</td>
                <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                  {b.ok ? (
                    <>
                      <Btn variant="gh" sm disabled={dl || !b.hasFile} onClick={() => download(b.id)}>
                        ⬇ Download
                      </Btn>{" "}
                      <Btn variant="o" sm onClick={() => setRestore(b)}>
                        Restore
                      </Btn>
                    </>
                  ) : (
                    <Btn variant="gh" sm onClick={() => setLog(b)}>
                      View log
                    </Btn>
                  )}
                </td>
              </tr>
            ))}
            {!data.rows.length && (
              <tr>
                <td colSpan={5}>
                  <div className="empty">No backups yet.</div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <h3 className="h3s">Export data</h3>
      <div className="echips">
        {(
          [
            ["programs", "Programs"],
            ["users", "Users"],
            ["records", "Accreditation records"],
            ["evaluations", "Evaluations"],
            ["activity", "Activity log"],
          ] as const
        ).map(([k, l]) => (
          <span key={k} className="tpl" role="button" onClick={() => exp(k, l)}>
            ⬇ {l}
          </span>
        ))}
      </div>
      {restore && <RestoreModal b={restore} onClose={() => setRestore(null)} />}
      {log && (
        <Modal title="Backup log" sub={`${log.date} · ${log.time}`} onClose={() => setLog(null)} footer={<Btn onClick={() => setLog(null)}>Close</Btn>}>
          <pre style={{ whiteSpace: "pre-wrap", fontSize: 12 }}>{log.log ?? "No log was recorded."}</pre>
        </Modal>
      )}
    </Card>
  );
}

function RestoreModal({ b, onClose }: { b: BackupData["rows"][number]; onClose: () => void }) {
  const [conf, setConf] = useState("");
  const { toast } = useAct();
  return (
    <Modal
      title={`Restore backup from ${b.date} · ${b.time}?`}
      sub="Everything after this point will be replaced."
      onClose={onClose}
      footer={
        <>
          <Btn variant="gh" onClick={onClose}>
            Cancel
          </Btn>
          <Btn
            variant="d"
            disabled={conf !== "RESTORE"}
            onClick={() => {
              onClose();
              toast.say("Restores run from the Supabase dashboard (point-in-time recovery). Download this backup and send it to the database administrator.", true);
            }}
          >
            Restore
          </Btn>
        </>
      }
    >
      <div className="lockb" style={{ background: "#fdecec" }}>
        ⛔{" "}
        <div>
          Uploads, reviews and account changes made after <b>{b.date}</b> will be lost. Everyone is signed out and the site goes into maintenance until it finishes.
        </div>
      </div>
      <label className="fl" style={{ marginTop: 12 }}>
        Type <b>RESTORE</b> to confirm
      </label>
      <input className="inp" value={conf} onChange={(e) => setConf(e.target.value)} placeholder="RESTORE" />
    </Modal>
  );
}

export function SecurityTab({ data }: { data: SecurityData }) {
  const [s, setS] = useState<Security>(data.sec);
  const { busy, run } = useAct();
  const set = (patch: Partial<Security>) => setS({ ...s, ...patch });
  const num = (k: keyof Security) => (e: React.ChangeEvent<HTMLInputElement>) => set({ [k]: Number(e.target.value) });
  return (
    <Card>
      <CardHead title="Security" sub="Sign-in and account rules for everyone" />
      <div className="kv">
        <Kv label={<b>Maintenance mode</b>} sub="Only QAC Admins can sign in">
          <Toggle
            checked={s.maint}
            onChange={(v) => {
              set({ maint: v });
              return run(() => saveSetting("security", { ...s, maint: v }), v ? "Maintenance mode on" : "Maintenance mode off");
            }}
          />
        </Kv>
        <Kv label="Maintenance message">
          <input className="inp" value={s.mmsg} onChange={(e) => set({ mmsg: e.target.value })} style={{ maxWidth: 420 }} />
        </Kv>
        <Kv label="Allowed sign-in domain">
          <input className="inp" value={s.dom} disabled title="Enforced by the database on sign-up" style={{ width: 160 }} />
        </Kv>
        <Kv label={<b>Require 2-step verification</b>} sub="for QAC Admin and QAC Personnel">
          <Toggle checked={s.tfa} onChange={(v) => set({ tfa: v })} />
        </Kv>
        <Kv label="Minimum password length">
          <input className="inp" type="number" min={8} value={s.pw} onChange={num("pw")} style={{ width: 90 }} />
        </Kv>
        <Kv label="Sign out after inactivity">
          <select className="inp" style={{ width: "auto" }} value={s.sess} onChange={(e) => set({ sess: Number(e.target.value) })}>
            {[15, 30, 60].map((m) => (
              <option key={m} value={m}>
                {m} minutes
              </option>
            ))}
          </select>
        </Kv>
        <Kv label="Lock account after failed sign-ins">
          <span>
            <input className="inp" type="number" value={s.att} onChange={num("att")} style={{ width: 70 }} /> tries for{" "}
            <input className="inp" type="number" value={s.lock} onChange={num("lock")} style={{ width: 70 }} /> min
          </span>
        </Kv>
        <Kv label={<b>Watermark view-only files</b>} sub="Adds the viewer’s name and date on QAC files">
          <Toggle checked={s.watermark} onChange={(v) => set({ watermark: v })} />
        </Kv>
      </div>
      <h3 className="h3s">Active sessions</h3>
      <table>
        <thead>
          <tr>
            <th>User</th>
            <th>Device</th>
            <th>Last seen</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {data.sessions.map((x) => (
            <tr key={x.id}>
              <td>{x.who}</td>
              <td>{x.device}</td>
              <td>{x.seen}</td>
              <td style={{ textAlign: "right" }}>
                {!x.me && (
                  <Btn variant="gh" sm disabled={busy} onClick={() => run(() => endSessions({ user: x.userId }), "Session ended")}>
                    Sign out
                  </Btn>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="subbar">
        <span className="sub" style={{ margin: 0 }}>
          Changes apply on each user’s next sign-in.
        </span>
        <Btn disabled={busy} onClick={() => run(() => saveSetting("security", s), "Security settings saved")}>
          Save changes
        </Btn>
      </div>
    </Card>
  );
}

