"use client";

import { ImagePlus, X } from "lucide-react";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthButton, AuthCard, AuthFormError, AuthShell } from "@/components/auth";
import { createClient } from "@/lib/supabase/browser";
import { BUCKETS, avatarPath, uploadFile } from "@/lib/storage";
import { REGISTER_STEPS } from "../register-options";
import { clearDraft } from "../registration-draft";

/**
 * Step 4 of register — the profile picture.
 *
 * The account already exists by this point (it was created when the OTP was
 * verified), so **Skip is a real ending, not an abandonment** — that is why the
 * screen offers both and why only Next implies a picture was chosen.
 *
 * ## 2026-08-21 redesign
 *
 * **The drop zone was not reachable.** It was a `<div>` carrying drag handlers,
 * with the only usable control a separate outlined "Upload from computer"
 * button beside a "Drag photo here" instruction that was false for anyone not
 * using a mouse. The zone is one `<button>` now: click it, focus it and press
 * Enter, or drop a file on it — three ways into the same file picker, and the
 * label reads correctly for all of them.
 *
 * **The chosen file was never announced.** Picking a photo swapped a grey disc
 * for a preview and said nothing; the file name is now stated in a polite live
 * region, and the preview has a real alt.
 *
 * **There was no way to undo a choice** short of picking a different file. There
 * is a Remove control.
 *
 * **The placeholder disc was `--color-gray` at 55%** to hit a measured #B7B7B7
 * that no token carries. It is a bordered, tinted well instead — no invented
 * colour, and it reads as a target rather than as a person-shaped blank.
 */
const MAX_BYTES = 2 * 1024 * 1024;

export default function ProfileForm() {
  const router = useRouter();
  const [preview, setPreview] = useState<string | null>(null);
  const [chosen, setChosen] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const accept = (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("That file is not an image. Choose a JPG or PNG.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("That photo is larger than 2 MB.");
      return;
    }
    setError(null);
    setChosen(file);
    setPreview((old) => {
      if (old) URL.revokeObjectURL(old);
      return URL.createObjectURL(file);
    });
  };

  const clearChoice = () => {
    setPreview((old) => {
      if (old) URL.revokeObjectURL(old);
      return null;
    });
    setChosen(null);
    setError(null);
    if (fileInput.current) fileInput.current.value = "";
  };

  function finish() {
    clearDraft();
    router.push(REGISTER_STEPS.done);
  }

  async function handleNext() {
    if (!chosen) return finish();

    setError(null);
    setPending(true);
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("That registration expired. Start again from Create an account.");
      setPending(false);
      return;
    }

    const path = avatarPath(user.id, chosen.name);
    const upload = await uploadFile(supabase, BUCKETS.avatars, path, chosen, {
      contentType: chosen.type,
      upsert: true,
    });

    if (upload.error) {
      setError(upload.error);
      setPending(false);
      return;
    }

    await supabase.from("profiles").update({ avatar_path: path }).eq("id", user.id);
    finish();
  }

  return (
    <AuthShell>
      <AuthCard
        variant="register"
        step={{ current: 4, total: 4 }}
        title="Add a profile photo"
        subtitle="We suggest your PUP picture. You can skip this and add one later."
      >
        <div className="auth-stagger flex flex-col gap-[var(--auth-vgap)]">
          {error && <AuthFormError>{error}</AuthFormError>}

          <input
            ref={fileInput}
            type="file"
            accept="image/*"
            className="sr-only"
            tabIndex={-1}
            onChange={(e) => accept(e.target.files?.[0])}
          />

          <div className="flex flex-col gap-[var(--space-3)]">
            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragging(false);
                accept(e.dataTransfer.files[0]);
              }}
              aria-label={
                chosen
                  ? `Change profile photo. Currently ${chosen.name}`
                  : "Choose a profile photo. You can also drop an image here"
              }
              className={`flex flex-col items-center gap-[var(--space-3)] rounded-[var(--radius-lg)] border border-dashed p-[var(--space-6)] text-center transition-colors duration-[var(--motion-fast)] ${
                dragging
                  ? "border-maroon bg-[var(--tint-maroon)]"
                  : "border-[var(--hairline-strong)] bg-surface hover:border-maroon hover:bg-[var(--tint-maroon)]"
              }`}
            >
              {preview ? (
                // A blob: object URL of unknown dimensions that the optimiser
                // cannot fetch, so next/image has nothing to do here.
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={preview}
                  alt="Preview of the profile photo you chose"
                  className="h-[96px] w-[96px] rounded-full object-cover shadow-[var(--elev-2)]"
                />
              ) : (
                <span className="grid h-[96px] w-[96px] place-items-center rounded-full border border-[var(--hairline-strong)] bg-white">
                  <ImagePlus
                    className="h-[32px] w-[32px] text-maroon"
                    strokeWidth={1.5}
                    aria-hidden
                  />
                </span>
              )}

              <span className="flex flex-col gap-[2px]">
                <span className="t-body-strong text-maroon">
                  {chosen ? "Choose a different photo" : "Upload a photo"}
                </span>
                <span className="t-sm text-black/70">
                  Drag an image here, or click to browse. JPG or PNG, up to 2 MB.
                </span>
              </span>
            </button>

            {chosen && (
              <div className="flex items-center justify-between gap-[var(--space-3)] rounded-[var(--radius-md)] border border-[var(--hairline)] bg-white p-[var(--space-2)] pl-[var(--space-3)]">
                <p className="t-sm min-w-0 flex-1 truncate text-black">
                  {chosen.name}
                </p>
                <AuthButton tone="ghost" onClick={clearChoice}>
                  <X className="h-[14px] w-[14px]" strokeWidth={2.5} aria-hidden />
                  Remove
                </AuthButton>
              </div>
            )}

            <p role="status" aria-live="polite" className="sr-only">
              {chosen ? `${chosen.name} selected.` : ""}
            </p>
          </div>

          <div className="flex flex-col gap-[var(--space-3)]">
            <AuthButton
              tone="maroon"
              size="lg"
              block
              onClick={handleNext}
              loading={pending}
            >
              {pending ? "Saving…" : chosen ? "Save and finish" : "Finish"}
            </AuthButton>
            <AuthButton
              tone="ghost"
              block
              onClick={() => {
                clearDraft();
                router.push(REGISTER_STEPS.done);
              }}
            >
              Skip for now
            </AuthButton>
          </div>
        </div>
      </AuthCard>
    </AuthShell>
  );
}
