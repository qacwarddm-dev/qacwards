"use client";

import { Monitor, UserRound } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { AuthButton, AuthCard, AuthShell } from "@/components/auth";
import { createClient } from "@/lib/supabase/browser";
import { BUCKETS, avatarPath, uploadFile } from "@/lib/storage";
import { REGISTER_STEPS } from "../register-options";
import { clearDraft } from "../registration-draft";

/**
 * Step 4 of register — assets/FIGMA/register/upload-profile.png, titled PROFILE.
 *
 * Measured from the body top (card top + the 63px band): blurb 40.5, the 80px
 * avatar 110, "Drag photo here" 203, "- or -" 234, the outlined 191x35 upload
 * button 260, Next 345 and Skip 404. The placeholder disc is #B7B7B7, which no
 * token carries; --color-gray at 55% renders 182 against the card's white and is
 * the nearest token-derived match to the measured 183.
 *
 * Wired in B2. The picker still previews locally, but Next now uploads the chosen
 * file to the private `avatars` bucket and writes `profiles.avatar_path`. The
 * account already exists by this point (it was created when the OTP was
 * verified), so **Skip is a real ending, not an abandonment** — that is why the
 * frame offers both and why only Next implies a picture was chosen.
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
    if (!file?.type.startsWith("image/")) return;
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
      setError("That registration expired. Start again from Create an Account.");
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
    <AuthShell align="center">
      <AuthCard variant="register" title="PROFILE">
        <p className="mt-[5.5px] text-center text-regular leading-[14.5px] text-gray">
          We suggest using your PUP picture as your profile picture.
        </p>

        <div
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
          className="flex flex-col items-center"
        >
          {preview ? (
            // A blob: object URL of unknown dimensions that the optimiser cannot
            // fetch, so next/image has nothing to do here.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={preview}
              alt="Chosen profile picture"
              className={`mt-[40.5px] h-[80px] w-[80px] rounded-full object-cover ${
                dragging ? "opacity-60" : ""
              }`}
            />
          ) : (
            <span
              className={`mt-[40.5px] flex h-[80px] w-[80px] items-center justify-center rounded-full bg-gray/55 ${
                dragging ? "opacity-60" : ""
              }`}
            >
              <UserRound
                className="h-[46px] w-[46px] text-white"
                strokeWidth={0}
                fill="currentColor"
                aria-hidden
              />
            </span>
          )}

          <p className="mt-[13px] text-regular leading-[12px] text-black">
            Drag photo here
          </p>
          <p className="mt-[19px] text-regular leading-[12px] text-gray">- or -</p>

          <input
            ref={fileInput}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => accept(e.target.files?.[0])}
          />
          <span className="mt-[14px]">
            <AuthButton
              tone="outline"
              size="upload"
              onClick={() => fileInput.current?.click()}
            >
              <Monitor className="h-[16px] w-[16px]" strokeWidth={1.5} aria-hidden />
              Upload from computer
            </AuthButton>
          </span>
        </div>

        {error && (
          <p className="mt-[14px] text-center text-regular leading-tight text-maroon">
            {error}
          </p>
        )}

        <div className="mt-[50px] mb-[11.5px] flex flex-col items-center">
          <AuthButton
            tone="maroon"
            size="pill-sm"
            onClick={handleNext}
            disabled={pending}
          >
            {pending ? "Saving…" : "Next"}
          </AuthButton>
          <Link
            href={REGISTER_STEPS.done}
            onClick={clearDraft}
            className="mt-[19px] text-regular leading-[12px] text-maroon"
          >
            Skip
          </Link>
        </div>
      </AuthCard>
    </AuthShell>
  );
}
