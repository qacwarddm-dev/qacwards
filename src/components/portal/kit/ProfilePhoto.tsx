"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import Btn from "./Btn";
import Modal from "./Modal";
import Result from "./Result";
import { useToast } from "./ToastProvider";
import { createClient } from "@/lib/supabase/browser";
import { BUCKETS, avatarPath, removeFile, uploadFile } from "@/lib/storage";
import { logSelfActivity } from "@/lib/profile-actions";

const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];

export function Avatar({ initials, url, size }: { initials: string; url: string | null; size?: "sm2" }) {
  return (
    <div
      className={size ? `bigav ${size}` : "bigav"}
      style={url ? { backgroundImage: `url("${url}")`, backgroundSize: "cover", backgroundPosition: "center", color: "transparent" } : undefined}
    >
      {initials}
    </div>
  );
}

export function usePhoto(profileId: string) {
  const router = useRouter();
  const toast = useToast();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState(false);

  async function upload(file: File | undefined) {
    if (!file) return;
    if (!ACCEPTED.includes(file.type)) return toast.say("Accepted formats: JPG, PNG", true);
    if (file.size > 2 * 1024 * 1024) return toast.say("That photo is larger than 2 MB.", true);
    setBusy(true);
    const supabase = createClient();
    const path = avatarPath(profileId, file.name);
    const up = await uploadFile(supabase, BUCKETS.avatars, path, file, { contentType: file.type, upsert: true });
    if (up.error) {
      setBusy(false);
      return toast.say(up.error, true);
    }
    const { error } = await supabase.from("profiles").update({ avatar_path: path }).eq("id", profileId);
    setBusy(false);
    if (error) return toast.say(error.message, true);
    await logSelfActivity("photo_changed");
    toast.say("Profile photo updated");
    router.refresh();
  }

  async function remove() {
    setConfirm(false);
    setBusy(true);
    const supabase = createClient();
    const { data } = await supabase.from("profiles").select("avatar_path").eq("id", profileId).maybeSingle();
    if (data?.avatar_path) await removeFile(supabase, BUCKETS.avatars, data.avatar_path);
    const { error } = await supabase.from("profiles").update({ avatar_path: null }).eq("id", profileId);
    setBusy(false);
    if (error) return toast.say(error.message, true);
    await logSelfActivity("photo_removed");
    toast.say("Photo removed");
    router.refresh();
  }

  const picker = <input ref={input} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={(e) => upload(e.target.files?.[0])} />;
  const confirmModal = confirm ? (
    <Modal
      onClose={() => setConfirm(false)}
      footer={
        <>
          <Btn variant="gh" onClick={() => setConfirm(false)}>
            Cancel
          </Btn>
          <Btn variant="danger" onClick={remove}>
            Remove
          </Btn>
        </>
      }
    >
      <Result tone="neutral" icon="🗑" title="Remove your profile photo?">
        <p>Your initials will show instead. You can upload a new photo anytime.</p>
      </Result>
    </Modal>
  ) : null;
  return { open: () => input.current?.click(), askRemove: () => setConfirm(true), busy, picker, confirmModal };
}

export type PwRules = "ia" | "rep" | "qac";

export function PasswordForm({ webmail, rules, minLength = 0, onChanged }: { webmail: string; rules: PwRules; minLength?: number; onChanged?: () => void }) {
  const [cur, setCur] = useState("");
  const [next, setNext] = useState("");
  const [conf, setConf] = useState("");
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  const min = Math.max(minLength, rules === "qac" ? 10 : 8);
  const checks =
    rules === "qac"
      ? [next.length >= min, /\d/.test(next), /[a-z]/.test(next) && /[A-Z]/.test(next), Boolean(next) && next !== cur]
      : [next.length >= min, /\d/.test(next), /[a-z]/.test(next) && /[A-Z]/.test(next)];
  const passed = checks.filter(Boolean).length;
  const ok = rules === "ia" ? next.length >= 8 && /\d/.test(next) && next === conf && Boolean(cur) : Boolean(cur) && passed === checks.length && next === conf;
  const colors = rules === "qac" ? ["#c62828", "#c62828", "#eab308", "#eab308", "#22a33a"] : ["#c62828", "#c62828", "#eab308", "#22a33a"];

  function reset() {
    setCur("");
    setNext("");
    setConf("");
  }

  async function change() {
    setBusy(true);
    const supabase = createClient();
    const { error: re } = await supabase.auth.signInWithPassword({ email: webmail, password: cur });
    if (re) {
      setBusy(false);
      return toast.say("Your current password is not correct.", true);
    }
    const { error } = await supabase.auth.updateUser({ password: next });
    setBusy(false);
    if (error) return toast.say(error.message, true);
    await logSelfActivity("password_changed");
    reset();
    toast.say(rules === "qac" ? "Password changed. Other devices were signed out." : "Password changed");
    onChanged?.();
  }

  const match = conf ? (conf === next ? "✓ Passwords match" : "Passwords don’t match") : "Must match the new password";
  const matchColor = conf ? (conf === next ? "#22a33a" : "#c62828") : undefined;

  if (rules === "ia")
    return (
      <>
        <div className="f" style={{ marginBottom: 12 }}>
          <label>Current Password</label>
          <input type="password" value={cur} onChange={(e) => setCur(e.target.value)} />
        </div>
        <div className="fg" style={{ gridTemplateColumns: "1fr 1fr" }}>
          <div className="f">
            <label>New Password</label>
            <input type="password" value={next} onChange={(e) => setNext(e.target.value)} />
            <small>• At least 8 characters · • One or more numbers</small>
          </div>
          <div className="f">
            <label>Confirm New Password</label>
            <input type="password" value={conf} onChange={(e) => setConf(e.target.value)} />
            <small style={{ color: matchColor }}>{conf ? match : "Must match new password"}</small>
          </div>
        </div>
        <div style={{ textAlign: "right", marginTop: 12 }}>
          <Btn variant="o" onClick={reset}>
            Reset
          </Btn>{" "}
          <Btn disabled={!ok || busy} onClick={change}>
            Change Password
          </Btn>
        </div>
      </>
    );

  const labels = rules === "qac" ? [`• ${min}+ characters`, "• A number", "• Upper & lower case", "• Not your old password"] : [`• ${min}+ characters`, "• A number", "• Upper & lower case"];
  return (
    <>
      <div className="f" style={{ marginBottom: 12, maxWidth: rules === "qac" ? 360 : undefined }}>
        <label>Current password</label>
        <input className="inp" type="password" value={cur} onChange={(e) => setCur(e.target.value)} />
        {rules === "rep" && <small>Enter your current password to verify it’s you</small>}
      </div>
      <div className={rules === "qac" ? "fg2" : "fg3"} style={rules === "qac" ? { marginTop: 0 } : { gridTemplateColumns: "1fr 1fr" }}>
        <div className="f">
          <label>New password</label>
          <input className="inp" type="password" value={next} onChange={(e) => setNext(e.target.value)} />
          <div className="strb">
            <i style={{ width: next ? `${(Math.max(passed, 1) / checks.length) * 100}%` : 0, background: colors[passed] }} />
          </div>
          <div className="rules">
            {labels.map((l, i) => (
              <span key={l} className={checks[i] ? "ok" : ""}>
                {l}
              </span>
            ))}
          </div>
        </div>
        <div className="f">
          <label>Confirm new password</label>
          <input className="inp" type="password" value={conf} onChange={(e) => setConf(e.target.value)} />
          <small style={{ color: matchColor }}>{match}</small>
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 14 }}>
        {rules === "rep" && (
          <Btn variant="gh" onClick={reset}>
            Reset
          </Btn>
        )}
        <Btn disabled={!ok || busy} onClick={change}>
          Change password
        </Btn>
      </div>
    </>
  );
}
