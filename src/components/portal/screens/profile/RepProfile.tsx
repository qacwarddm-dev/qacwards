"use client";

import Link from "next/link";
import Btn from "../../kit/Btn";
import { Avatar, PasswordForm, usePhoto } from "../../kit/ProfilePhoto";
import type { ProfileView } from "@/lib/profile";

export default function RepProfile({ p, initials, avatarUrl }: { p: ProfileView; initials: string; avatarUrl: string | null }) {
  const photo = usePhoto(p.id);
  return (
    <>
      <div className="pgrid">
        <div className="card" style={{ textAlign: "center" }}>
          <div className="shd" style={{ justifyContent: "center" }}>
            👤 PROFILE
          </div>
          <Avatar initials={initials} url={avatarUrl} />
          <Btn className="wfull mb8" loading={photo.busy} loadingLabel="Uploading…" onClick={photo.open}>
            ⬆ Upload new photo
          </Btn>
          <Btn variant="d" className="wfull" disabled={!avatarUrl || photo.busy} onClick={photo.askRemove}>
            🗑 Remove photo
          </Btn>
          <div className="sub" style={{ fontStyle: "italic", fontSize: 11.5 }}>
            JPG or PNG · max 2 MB
          </div>
          {photo.picker}
        </div>
        <div className="card">
          <div className="shd">🪪 PERSONAL DETAILS</div>
          <div className="inner">
            <div className="fg3">
              <div className="f">
                <label>
                  Last name <span>(cannot be changed)</span>
                </label>
                <input className="inp" readOnly value={p.surname} />
              </div>
              <div className="f">
                <label>
                  First name <span>(cannot be changed)</span>
                </label>
                <input className="inp" readOnly value={p.given} />
              </div>
              <div className="f">
                <label>
                  Middle name <span>(optional)</span>
                </label>
                <input className="inp" readOnly value={p.middle} placeholder="—" />
              </div>
              <div className="f">
                <label>System role</label>
                <input className="inp" readOnly value={p.roleLabel} />
              </div>
              <div className="f">
                <label>Campus</label>
                <input className="inp" readOnly value={p.campus} />
              </div>
              <div className="f">
                <label>Position</label>
                <input className="inp" readOnly value={p.position} />
              </div>
              <div className="f" style={{ gridColumn: "span 2" }}>
                <label>Department</label>
                <input className="inp" readOnly value={p.college} />
              </div>
            </div>
            <div className="sub" style={{ fontSize: 11.5, marginTop: 10 }}>
              🔒 These details come from your QAC account. Ask the QA Center to correct them.
            </div>
          </div>
        </div>
      </div>
      <div className="pgrid">
        <div>
          <div className="card">
            <div className="shd">✉ ACCOUNT ACCESS</div>
            <div className="inner" style={{ padding: "10px 12px" }}>
              <div className="sub" style={{ margin: 0, fontSize: 11.5 }}>
                Registered webmail
              </div>
              <b>{p.webmail}</b>
            </div>
          </div>
          <div className="sub" style={{ fontStyle: "italic", margin: "-8px 4px 6px" }}>
            Account created on {p.since}
          </div>
          <Link className="lnk" style={{ marginLeft: 4 }} href="/portal/my-activity">
            ⟲ View my activity ›
          </Link>
        </div>
        <div className="card">
          <div className="shd">🔑 CHANGE PASSWORD</div>
          <div className="inner">
            <PasswordForm webmail={p.webmail} rules="rep" minLength={p.pwMin} />
          </div>
        </div>
      </div>
      {photo.confirmModal}
    </>
  );
}
