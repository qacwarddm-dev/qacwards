"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import Btn from "../../kit/Btn";
import useClientValue from "../../kit/useClientValue";
import Modal from "../../kit/Modal";
import Pill from "../../kit/Pill";
import SegTabs from "../../kit/SegTabs";
import Toggle from "../../kit/Toggle";
import { useToast } from "../../kit/ToastProvider";
import { Avatar, PasswordForm, usePhoto } from "../../kit/ProfilePhoto";
import { useSaveSignature, useSignaturePad } from "../../kit/SignaturePad";
import type { ProfileView } from "@/lib/profile";
import { saveContactDetails, saveNotificationPrefs } from "@/lib/profile-actions";
import { createClient } from "@/lib/supabase/browser";

type Tab = "info" | "sig" | "sec" | "notif";

const NOTIF: [string, string][] = [
  ["up", "New upload waiting for my review"],
  ["ret", "Program resubmitted a returned document"],
  ["rep", "Accreditor signed an evaluation report"],
  ["asg", "Accreditor accepted or declined an assignment"],
  ["nda", "NDA uploaded for verification"],
  ["exp", "Accreditation expires within 6 months"],
  ["dig", "Daily summary at 7:00 AM"],
];
const NOTIF_DEFAULT: Record<string, [number, number]> = { up: [1, 1], ret: [1, 0], rep: [1, 1], asg: [1, 1], nda: [1, 0], exp: [1, 1], dig: [1, 0] };

function deviceName() {
  const ua = navigator.userAgent;
  const browser = /Edg\//.test(ua) ? "Edge" : /Chrome\//.test(ua) ? "Chrome" : /Firefox\//.test(ua) ? "Firefox" : /Safari\//.test(ua) ? "Safari" : "Browser";
  const os = /Windows/.test(ua) ? "Windows" : /Android/.test(ua) ? "Android" : /iPhone|iPad/.test(ua) ? "iOS" : /Mac OS/.test(ua) ? "macOS" : /Linux/.test(ua) ? "Linux" : "";
  return `${browser}${os ? ` on ${os}` : ""} (this device)`;
}

export default function QacProfile({
  p,
  initials,
  avatarUrl,
  signatureUrl,
  signatureSaved,
  stats,
}: {
  p: ProfileView;
  initials: string;
  avatarUrl: string | null;
  signatureUrl: string | null;
  signatureSaved: string | null;
  stats: { primary: number; week: number };
}) {
  const [tab, setTab] = useState<Tab>("info");
  const admin = p.role === "qac_admin";
  const name = `${p.surname}, ${p.given}`;
  return (
    <>
      <div className="card phead">
        <Avatar initials={initials} url={avatarUrl} size="sm2" />
        <div className="pinfo">
          <h2>{name}</h2>
          <div className="sub">{p.position} · Quality Assurance Center</div>
          <div style={{ marginTop: 8, display: "flex", gap: 6, flexWrap: "wrap" }}>
            <Pill tone="blue">{p.roleLabel}</Pill>
            <Pill tone="ok">● Active</Pill>
            <Pill tone="miss">Member since {p.since}</Pill>
          </div>
        </div>
        <div className="pstat">
          <div>
            <b>{stats.primary}</b>
            <span>{admin ? "settings changes this week" : "reviews this week"}</span>
          </div>
          <div>
            <b>{stats.week}</b>
            <span>actions this week</span>
          </div>
          <Btn variant="o" sm href="/portal/my-activity">
            ⟲ My activity ›
          </Btn>
        </div>
      </div>
      <div className="card">
        <SegTabs
          value={tab}
          onChange={setTab}
          tabs={[
            { key: "info", label: "Personal info" },
            { key: "sig", label: "E-signature" },
            { key: "sec", label: "Password & security" },
            { key: "notif", label: "Notifications" },
          ]}
        />
        {tab === "info" && <Info p={p} initials={initials} avatarUrl={avatarUrl} admin={admin} />}
        {tab === "sig" && <Sig name={name} position={p.position} url={signatureUrl} saved={signatureSaved} />}
        {tab === "sec" && <Sec p={p} />}
        {tab === "notif" && <Notif prefs={{ ...NOTIF_DEFAULT, ...p.notifPrefs }} />}
      </div>
    </>
  );
}

function Info({ p, initials, avatarUrl, admin }: { p: ProfileView; initials: string; avatarUrl: string | null; admin: boolean }) {
  const photo = usePhoto(p.id);
  const [mobile, setMobile] = useState(p.mobile);
  const [local, setLocal] = useState(p.localNo);
  const toast = useToast();
  return (
    <div className="pgrid">
      <div style={{ textAlign: "center" }}>
        <Avatar initials={initials} url={avatarUrl} />
        <Btn className="wfull mb8" disabled={photo.busy} onClick={photo.open}>
          ⬆ Upload new photo
        </Btn>
        <Btn variant="d" className="wfull" disabled={!avatarUrl || photo.busy} onClick={photo.askRemove}>
          🗑 Remove photo
        </Btn>
        <div className="sub" style={{ fontSize: 11, fontStyle: "italic" }}>
          JPG or PNG · max 2 MB
        </div>
        {photo.picker}
        {photo.confirmModal}
      </div>
      <div>
        <div className="shd">🪪 PERSONAL DETAILS</div>
        <div className="inner">
          <div className="fg3">
            {(
              [
                ["Last name", "(from HR)", p.surname],
                ["First name", "(from HR)", p.given],
                ["Middle name", "(optional)", p.middle],
                ["System role", "", p.roleLabel],
                ["Position", "", p.position],
                ["Office", "", "Quality Assurance Center"],
                ["PUP webmail", "", p.webmail],
              ] as const
            ).map(([l, s, v]) => (
              <div key={l} className="f">
                <label>
                  {l} {s && <span>{s}</span>}
                </label>
                <input className="inp" readOnly value={v} placeholder="—" />
              </div>
            ))}
            <div className="f">
              <label>
                Mobile number <span>(editable)</span>
              </label>
              <input className="inp" value={mobile} onChange={(e) => setMobile(e.target.value)} placeholder="0917 555 0142" />
            </div>
            <div className="f">
              <label>
                Local / extension <span>(editable)</span>
              </label>
              <input className="inp" value={local} onChange={(e) => setLocal(e.target.value)} />
            </div>
          </div>
          <div className="sub" style={{ fontSize: 11.5, marginTop: 10 }}>
            🔒 Name, role and position come from HR and the QAC Admin. {admin ? "Another QAC Admin can change them in Settings › Users." : "Ask the Director to change them."}
          </div>
          <div style={{ textAlign: "right", marginTop: 12 }}>
            <Btn
              onClick={async () => {
                const r = await saveContactDetails(mobile, local);
                if (!r.ok) return toast.say(r.error, true);
                toast.say("Contact details saved");
              }}
            >
              Save contact details
            </Btn>
          </div>
        </div>
      </div>
    </div>
  );
}

function Sig({ name, position, url, saved }: { name: string; position: string; url: string | null; saved: string | null }) {
  const { canvas: padCanvas, width: padWidth, height: padHeight, ...pad } = useSignaturePad(520, 170);
  const { save, busy } = useSaveSignature();
  const toast = useToast();
  const file = useRef<HTMLInputElement>(null);
  return (
    <div className="sigw">
      <div>
        <div className="shd">✍ E-SIGNATURE</div>
        <p className="sub" style={{ lineHeight: 1.6, marginBottom: 12 }}>
          Placed on reports you generate and on evaluation reports you <b>acknowledge</b>. Draw inside the box or upload a PNG with a transparent background.
        </p>
        <canvas ref={padCanvas} className="sigpad q" width={padWidth} height={padHeight} />
        <div className="sigb">
          <Btn variant="gh" sm onClick={pad.clear}>
            Clear
          </Btn>
          <Btn variant="gh" sm onClick={() => file.current?.click()}>
            ⬆ Upload PNG
          </Btn>
          <input
            ref={file}
            type="file"
            accept="image/png"
            hidden
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (f && (await save(f, "Uploaded"))) pad.clear();
            }}
          />
          <Btn
            sm
            disabled={busy}
            onClick={async () => {
              if (!pad.drawn) return toast.say("Draw your signature first", true);
              if (await save(await pad.blob())) pad.clear();
            }}
          >
            Save signature
          </Btn>
        </div>
      </div>
      <div>
        <div className="shd">CURRENT</div>
        <div className="sigc">
          {url ? <img src={url} alt="signature" /> : <span className="sub">No signature saved yet</span>}
          <div className="ln">{name.toUpperCase()}</div>
          <small>{position}</small>
        </div>
        <div className="sub" style={{ fontSize: 11.5, marginTop: 8 }}>
          {saved ? `Saved ${saved}` : "Not saved yet"} · every use is recorded in Activity
        </div>
      </div>
    </div>
  );
}

type Factor = { id: string; status: string; created_at: string };

function Sec({ p }: { p: ProfileView }) {
  const [factors, setFactors] = useState<Factor[] | null>(null);
  const [enroll, setEnroll] = useState<{ id: string; qr: string; secret: string } | null>(null);
  const [code, setCode] = useState("");
  const toast = useToast();
  const router = useRouter();
  const device = useClientValue(deviceName, "This device");

  async function load() {
    const { data } = await createClient().auth.mfa.listFactors();
    setFactors((data?.totp ?? []) as Factor[]);
  }
  useEffect(() => {
    let live = true;
    createClient()
      .auth.mfa.listFactors()
      .then(({ data }) => live && setFactors((data?.totp ?? []) as Factor[]));
    return () => {
      live = false;
    };
  }, []);
  const verified = factors?.find((f) => f.status === "verified");

  return (
    <>
      <div className="shd">🔑 CHANGE PASSWORD</div>
      <div className="inner">
        <PasswordForm webmail={p.webmail} rules="qac" minLength={p.pwMin} />
      </div>
      <div className="shd" style={{ marginTop: 22 }}>
        🛡 2-STEP VERIFICATION
      </div>
      <div className="kv">
        <div>
          <span>
            <b>Authenticator app</b>
            <small>
              {verified ? `Required for QAC accounts · set up ${new Date(verified.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}` : "Required for QAC accounts · not set up yet"}
            </small>
          </span>
          {verified ? (
            <Pill tone="ok">On</Pill>
          ) : (
            <Btn
              variant="gh"
              sm
              onClick={async () => {
                const { data, error } = await createClient().auth.mfa.enroll({ factorType: "totp" });
                if (error) return toast.say(error.message, true);
                setEnroll({ id: data.id, qr: data.totp.qr_code, secret: data.totp.secret });
              }}
            >
              Set up
            </Btn>
          )}
        </div>
        <div>
          <span>
            <b>Backup codes</b>
            <small>Lost your phone? The Director can reset your 2-step verification.</small>
          </span>
          <span className="sub" style={{ margin: 0 }}>
            Not issued
          </span>
        </div>
      </div>
      <div className="shd" style={{ marginTop: 22 }}>
        💻 WHERE YOU’RE SIGNED IN
      </div>
      <div className="tscroll">
        <table>
          <thead>
            <tr>
              <th>Device</th>
              <th>Location</th>
              <th>Last active</th>
              <th />
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>{device}</td>
              <td>—</td>
              <td>Now</td>
              <td style={{ textAlign: "right" }}>
                <Btn
                  variant="gh"
                  sm
                  onClick={async () => {
                    const { error } = await createClient().auth.signOut({ scope: "others" });
                    if (error) return toast.say(error.message, true);
                    toast.say("Signed out of your other devices");
                  }}
                >
                  Sign out other devices
                </Btn>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      {enroll && (
        <Modal
          title="Set up 2-step verification"
          sub="Scan with Google Authenticator, Microsoft Authenticator or similar"
          onClose={() => setEnroll(null)}
          footer={
            <>
              <Btn variant="gh" onClick={() => setEnroll(null)}>
                Cancel
              </Btn>
              <Btn
                onClick={async () => {
                  const sb = createClient();
                  const { data: ch, error: e1 } = await sb.auth.mfa.challenge({ factorId: enroll.id });
                  if (e1) return toast.say(e1.message, true);
                  const { error: e2 } = await sb.auth.mfa.verify({ factorId: enroll.id, challengeId: ch.id, code });
                  if (e2) return toast.say("That code is not correct.", true);
                  setEnroll(null);
                  toast.say("2-step verification is on");
                  load();
                  router.refresh();
                }}
              >
                Verify
              </Btn>
            </>
          }
        >
          <div style={{ textAlign: "center" }}>
            <img src={enroll.qr} alt="QR code" style={{ width: 180, height: 180 }} />
            <div className="sub" style={{ fontSize: 11.5 }}>
              Or enter this key: <b style={{ color: "var(--text)" }}>{enroll.secret}</b>
            </div>
          </div>
          <label className="fl">6-digit code</label>
          <input className="inp" inputMode="numeric" value={code} onChange={(e) => setCode(e.target.value)} />
        </Modal>
      )}
    </>
  );
}

function Notif({ prefs: initial }: { prefs: Record<string, [number, number]> }) {
  const [prefs, setPrefs] = useState(initial);
  const [quiet, setQuiet] = useState<[string, string]>(["20:00", "07:00"]);
  const toast = useToast();
  return (
    <>
      <div className="shd">🔔 NOTIFY ME ABOUT</div>
      <div className="tscroll">
        <table className="ntab">
          <thead>
            <tr>
              <th>Event</th>
              <th style={{ textAlign: "center" }}>In-app</th>
              <th style={{ textAlign: "center" }}>Email</th>
            </tr>
          </thead>
          <tbody>
            {NOTIF.map(([k, l]) => (
              <tr key={k}>
                <td>{l}</td>
                {[0, 1].map((j) => (
                  <td key={j} style={{ textAlign: "center" }}>
                    <Toggle
                      checked={Boolean(prefs[k]?.[j])}
                      onChange={(v) => setPrefs({ ...prefs, [k]: (j === 0 ? [v ? 1 : 0, prefs[k]?.[1] ?? 0] : [prefs[k]?.[0] ?? 0, v ? 1 : 0]) as [number, number] })}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="kv" style={{ marginTop: 14 }}>
        <div>
          <span>
            <b>Quiet hours</b>
            <small>No emails between these times</small>
          </span>
          <span>
            <input className="inp" type="time" value={quiet[0]} onChange={(e) => setQuiet([e.target.value, quiet[1]])} style={{ width: 120 }} /> –{" "}
            <input className="inp" type="time" value={quiet[1]} onChange={(e) => setQuiet([quiet[0], e.target.value])} style={{ width: 120 }} />
          </span>
        </div>
      </div>
      <div style={{ textAlign: "right", marginTop: 12 }}>
        <Btn
          onClick={async () => {
            const r = await saveNotificationPrefs({ ...prefs, quiet: quiet as unknown as [number, number] });
            if (!r.ok) return toast.say(r.error, true);
            toast.say("Notification preferences saved");
          }}
        >
          Save preferences
        </Btn>
      </div>
    </>
  );
}
