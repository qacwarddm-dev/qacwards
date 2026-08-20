"use client";

import { CircleUserRound, SquarePen, Trash2, Upload } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Button, Card, ConfirmDialog, SectionHeading } from "@/components/portal/kit";
import { createClient } from "@/lib/supabase/browser";
import { BUCKETS, avatarPath, removeFile, signedUrl, uploadFile } from "@/lib/storage";

/**
 * The Profile screen's photo panel — the only self-service write on the left half
 * of that screen. Personal details stay display-only per the owner's 2026-08-01
 * revision, so this card and the password card are the entire interactive surface.
 *
 * Client component because it owns a file picker and two mutations. It receives
 * the current avatar rather than resolving one, so the server stays the single
 * place identity is looked up.
 *
 * Geometry is unchanged from the static version: 150px disc, `md` buttons because
 * the card's measured 43px padding leaves 174px and "Upload New Photo" at 15px
 * wraps inside it.
 */
const ACCEPTED = "image/jpeg,image/png,image/webp";
const MAX_BYTES = 2 * 1024 * 1024;

export default function ProfilePhotoCard({
  profileId,
  avatarUrl,
  hasAvatar,
}: {
  profileId: string;
  /** Already-signed URL, or the placeholder. */
  avatarUrl: string;
  hasAvatar: boolean;
}) {
  const router = useRouter();
  const fileInput = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmRemove, setConfirmRemove] = useState(false);

  async function handleFile(file: File | undefined) {
    if (!file) return;

    // The bucket enforces both of these too. Checking here as well turns a
    // rejected upload into an explanation instead of a failed round trip.
    if (!ACCEPTED.split(",").includes(file.type)) {
      setError("Accepted formats: JPG, PNG, WEBP.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("That photo is larger than 2 MB.");
      return;
    }

    setError(null);
    setBusy(true);
    const supabase = createClient();
    const path = avatarPath(profileId, file.name);

    const upload = await uploadFile(supabase, BUCKETS.avatars, path, file, {
      contentType: file.type,
      upsert: true,
    });
    if (upload.error) {
      setError(upload.error);
      setBusy(false);
      return;
    }

    const { error: saveError } = await supabase
      .from("profiles")
      .update({ avatar_path: path })
      .eq("id", profileId);

    if (saveError) {
      setError(saveError.message);
      setBusy(false);
      return;
    }

    // Show it immediately; the server re-render behind `refresh()` replaces this
    // object URL with a signed one on the next paint.
    const signed = await signedUrl(supabase, BUCKETS.avatars, path);
    setPreview(signed.data ?? URL.createObjectURL(file));
    setBusy(false);
    router.refresh();
  }

  async function handleRemove() {
    setConfirmRemove(false);
    setError(null);
    setBusy(true);
    const supabase = createClient();

    const { data: current } = await supabase
      .from("profiles")
      .select("avatar_path")
      .eq("id", profileId)
      .maybeSingle();

    if (current?.avatar_path) {
      await removeFile(supabase, BUCKETS.avatars, current.avatar_path);
    }

    const { error: clearError } = await supabase
      .from("profiles")
      .update({ avatar_path: null })
      .eq("id", profileId);

    if (clearError) setError(clearError.message);

    setPreview(null);
    setBusy(false);
    router.refresh();
  }

  const shown = preview ?? avatarUrl;

  return (
    <Card className="flex w-[260px] shrink-0 flex-col px-[43px] pt-[19px] pb-[12px]">
      <SectionHeading icon={CircleUserRound}>PROFILE</SectionHeading>

      <div className="relative mt-[18px] self-center">
        <Image
          src={shown}
          alt=""
          width={150}
          height={150}
          unoptimized={shown.startsWith("blob:") || shown.includes("/storage/v1/")}
          className="h-[150px] w-[150px] rounded-full border-[3px] border-maroon object-cover shadow-card"
        />
        <button
          type="button"
          aria-label="Change profile photo"
          onClick={() => fileInput.current?.click()}
          disabled={busy}
          className="absolute bottom-[6px] right-[6px] flex h-[32px] w-[32px] items-center justify-center rounded-full bg-white text-maroon shadow-card"
        >
          <SquarePen className="h-[17px] w-[17px]" strokeWidth={2} aria-hidden />
        </button>
      </div>

      <input
        ref={fileInput}
        type="file"
        accept={ACCEPTED}
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />

      <Button
        variant="solid"
        size="md"
        icon={Upload}
        className="mt-[34px] w-full"
        onClick={() => fileInput.current?.click()}
        disabled={busy}
      >
        {busy ? "Working…" : "Upload New Photo"}
      </Button>
      <Button
        variant="yellow"
        size="md"
        icon={Trash2}
        className="mt-[8px] w-full"
        onClick={() => setConfirmRemove(true)}
        disabled={busy || !hasAvatar}
      >
        Remove Photo
      </Button>

      <ConfirmDialog
        open={confirmRemove}
        onOpenChange={setConfirmRemove}
        title="Remove profile photo"
        description="Your profile photo will be removed and the placeholder avatar will show instead. You can upload a new photo any time."
        confirmLabel="Remove photo"
        tone="danger"
        onConfirm={handleRemove}
      />

      {error ? (
        <p className="mt-[9px] text-center text-regular leading-tight text-maroon">
          {error}
        </p>
      ) : (
        <p className="mt-[9px] text-center text-regular italic leading-none text-gray">
          Accepted format: JPG, PNG
        </p>
      )}
    </Card>
  );
}
