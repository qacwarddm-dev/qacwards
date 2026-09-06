"use client";

/* eslint-disable @next/next/no-img-element -- signed Supabase URLs expire in 60s and no remotePatterns host is configured, so next/image cannot serve them */

import { PenLine, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  Button,
  Card,
  ConfirmDialog,
  SectionHeading,
  SignaturePad,
} from "@/components/portal/kit";
import { clearSignature, saveSignature } from "@/lib/accreditor-actions";

/**
 * Profile → E-Signature — round 2 §4's capture half.
 *
 * Captured once and stored on the profile, not per document: the client's note
 * is explicit about that, and it is also the only version that scales — an
 * accreditor signing every generated evaluation by hand would make sign-off a
 * per-document chore rather than a property of the person.
 *
 * A stored signature is shown, not re-editable in place: replacing it means
 * drawing a new one, which keeps "what is on file" and "what I am drawing now"
 * from ever being the same widget in two states.
 *
 * Upload goes through a server action rather than the browser Supabase client
 * that `ProfilePhotoCard` uses. The photo card predates the round 2 policies;
 * here the storage write and the `profiles.signature_path` write have to land
 * together, and doing them in one server round trip is what stops a bucket
 * object existing that no profile points at.
 */
export default function ProfileSignatureCard({
  signatureUrl,
  suggestedName,
}: {
  signatureUrl: string | null;
  /** Prefills the Type tab. */
  suggestedName: string;
}) {
  const router = useRouter();
  const [drawn, setDrawn] = useState<Blob | null>(null);
  const [capturing, setCapturing] = useState(signatureUrl === null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [confirmRemove, setConfirmRemove] = useState(false);

  function save() {
    if (!drawn) return;
    setError(null);
    startTransition(async () => {
      const body = new FormData();
      body.append("signature", new File([drawn], "signature.png", { type: "image/png" }));
      const result = await saveSignature(body);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setDrawn(null);
      setCapturing(false);
      router.refresh();
    });
  }

  function remove() {
    setConfirmRemove(false);
    setError(null);
    startTransition(async () => {
      const result = await clearSignature();
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setDrawn(null);
      setCapturing(true);
      router.refresh();
    });
  }

  return (
    <Card className="min-w-0 flex-1 px-[28px] pt-[19px] pb-[22px]">
      <SectionHeading icon={PenLine}>E-SIGNATURE</SectionHeading>

      <p className="mt-[13px] text-regular text-gray">
        Used wherever your sign-off appears on an evaluation. Stored once here —
        you are never asked to sign a document individually.
      </p>

      <div className="mt-[16px] rounded-[14px] bg-[color:var(--color-gray)]/5 px-[21px] pt-[18px] pb-[20px]">
        {capturing ? (
          <SignaturePad
            onChange={setDrawn}
            disabled={pending}
            defaultTypedValue={suggestedName}
          />
        ) : (
          <div className="flex flex-col items-center">
            {signatureUrl ? (
              <img
                src={signatureUrl}
                alt="Your signature"
                className="max-h-[110px] w-auto object-contain"
              />
            ) : (
              <p className="text-regular italic text-gray">
                Your signature is on file but could not be loaded just now.
              </p>
            )}
          </div>
        )}
      </div>

      <div className="mt-[16px] flex flex-wrap items-center gap-[16px]">
        {capturing ? (
          <>
            <Button variant="solid" size="md" disabled={pending || !drawn} onClick={save}>
              {pending ? "Saving…" : "Save signature"}
            </Button>
            {signatureUrl && (
              <Button
                variant="ghost"
                size="md"
                disabled={pending}
                onClick={() => {
                  setDrawn(null);
                  setCapturing(false);
                }}
              >
                Cancel
              </Button>
            )}
          </>
        ) : (
          <>
            <Button
              variant="solid"
              size="md"
              disabled={pending}
              onClick={() => setCapturing(true)}
            >
              Replace signature
            </Button>
            <Button
              variant="yellow"
              size="md"
              icon={Trash2}
              disabled={pending}
              onClick={() => setConfirmRemove(true)}
            >
              Remove
            </Button>
          </>
        )}
        {error && <span className="text-regular leading-tight text-maroon">{error}</span>}
      </div>

      <ConfirmDialog
        open={confirmRemove}
        onOpenChange={setConfirmRemove}
        title="Remove your e-signature"
        description="Evaluations you have already signed keep the printed name, but your mark stops appearing on anything new until you capture another one."
        confirmLabel="Remove signature"
        tone="danger"
        onConfirm={remove}
      />
    </Card>
  );
}
