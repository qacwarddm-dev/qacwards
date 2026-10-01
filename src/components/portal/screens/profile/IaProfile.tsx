"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Btn from "../../kit/Btn";
import Scope from "../../kit/Scope";
import SignatureTabs from "../../kit/SignaturePad";
import { useToast } from "../../kit/ToastProvider";
import { Avatar, PasswordForm, usePhoto } from "../../kit/ProfilePhoto";
import type { ProfileView } from "@/lib/profile";
import { setAccreditorExpertise } from "@/lib/accreditor-actions";

export default function IaProfile({
  p,
  initials,
  avatarUrl,
  areas,
  mine,
  hasSignature,
}: {
  p: ProfileView;
  initials: string;
  avatarUrl: string | null;
  areas: { id: string; name: string }[];
  mine: string[];
  hasSignature: boolean;
}) {
  const photo = usePhoto(p.id);
  const [exp, setExp] = useState<string[]>(mine);
  const [saved, setSaved] = useState<string[]>(mine);
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  const router = useRouter();
  const changed = JSON.stringify([...exp].sort()) !== JSON.stringify([...saved].sort());
  const name = (id: string) => areas.find((a) => a.id === id)?.name ?? id;

  return (
    <Scope name="ia">
      <div className="pgrid">
        <div className="card" style={{ textAlign: "center" }}>
          <div className="sh">PROFILE</div>
          <Avatar initials={initials} url={avatarUrl} />
          <Btn className="wfull mb8" disabled={photo.busy} onClick={photo.open}>
            ⬆ Upload New Photo
          </Btn>
          <Btn variant="d" className="wfull" disabled={!avatarUrl || photo.busy} onClick={photo.askRemove}>
            🗑 Remove Photo
          </Btn>
          <div style={{ fontSize: 11.5, color: "var(--muted)", fontStyle: "italic", marginTop: 6 }}>Accepted format: JPG, PNG</div>
          {photo.picker}
        </div>
        <div className="card">
          <div className="sh">PERSONAL DETAILS</div>
          <div className="inner">
            <div className="fg">
              <div className="f">
                <label>
                  Last Name <span>(cannot be changed)</span>
                </label>
                <input readOnly value={p.surname} />
              </div>
              <div className="f">
                <label>First Name</label>
                <input readOnly value={p.given} />
              </div>
              <div className="f">
                <label>
                  Middle Name <span>(optional)</span>
                </label>
                <input readOnly value={p.middle} placeholder="—" />
              </div>
              <div className="f">
                <label>
                  System Role <span>(cannot be changed)</span>
                </label>
                <input readOnly value="Internal Accreditor" />
              </div>
              <div className="f">
                <label>
                  Campus <span>(cannot be changed)</span>
                </label>
                <input readOnly value={p.campus} />
              </div>
              <div className="f">
                <label>
                  Position <span>(cannot be changed)</span>
                </label>
                <input readOnly value={p.position} />
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="pgrid">
        <div>
          <div className="card">
            <div className="sh">ACCOUNT ACCESS</div>
            <div className="acc">
              <small>Registered Webmail</small>
              {p.webmail}
            </div>
          </div>
          <div style={{ fontSize: 12, color: "var(--muted)", fontStyle: "italic", margin: "0 4px 6px" }}>Account created on {p.since}</div>
          <Link className="lnk" href="/portal/my-activity">
            ⟲ View my activity ›
          </Link>
        </div>
        <div className="card">
          <div className="sh">CHANGE PASSWORD</div>
          <div className="inner">
            <PasswordForm webmail={p.webmail} rules="ia" minLength={p.pwMin} />
          </div>
        </div>
      </div>
      <div className="g2">
        <div className="card">
          <div className="sh">DISCIPLINE EXPERTISE</div>
          <div style={{ fontSize: 12.5, color: "var(--muted)", marginBottom: 12, lineHeight: 1.5 }}>
            What you can evaluate. QAC Personnel use this to match you with the right programs.
          </div>
          <div className="inner">
            <label className="fl">Areas you hold</label>
            <div>
              {exp.length ? (
                exp.map((id) => (
                  <span key={id} className="xchip">
                    {name(id)}
                    <button type="button" aria-label={`Remove ${name(id)}`} onClick={() => setExp(exp.filter((x) => x !== id))}>
                      ×
                    </button>
                  </span>
                ))
              ) : (
                <span style={{ fontSize: 12, color: "var(--muted)" }}>None yet</span>
              )}
            </div>
            <select className="sel" value="" onChange={(e) => e.target.value && setExp([...exp, e.target.value])}>
              <option value="">+ Add a discipline…</option>
              {areas
                .filter((a) => !exp.includes(a.id))
                .map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
            </select>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12 }}>
            <span style={{ fontSize: 12, color: "var(--muted)" }}>{changed ? "Unsaved changes" : "No changes"}</span>
            <Btn
              disabled={!changed || busy}
              onClick={async () => {
                setBusy(true);
                const r = await setAccreditorExpertise(p.id, exp);
                setBusy(false);
                if (!r.ok) return toast.say(r.error, true);
                setSaved(exp);
                toast.say("Expertise saved");
                router.refresh();
              }}
            >
              Save expertise
            </Btn>
          </div>
        </div>
        <div className="card">
          <div className="sh">E-SIGNATURE</div>
          <div style={{ fontSize: 12.5, color: "var(--muted)", marginBottom: 12, lineHeight: 1.5 }}>Placed on your evaluation reports when you sign and submit.</div>
          <SignatureTabs hasSaved={hasSignature} />
        </div>
      </div>
      {photo.confirmModal}
    </Scope>
  );
}
