"use client";

import { Monitor } from "lucide-react";
import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { uploadNda } from "@/lib/document-actions";

/**
 * The NDA gate's upload control (frame 03).
 *
 * Decision 13 — per user, **auto-unlock on upload**. There is no verification
 * step and no approval queue, so this single write is the whole of the unlock:
 * the row's existence is what `has_nda()` tests, and that function is what both
 * the `common_documents` policy and the `common-docs` bucket policy call.
 *
 * Keeps the frame's button exactly: 36px, 8px radius, grey hairline, `shadow-card`.
 */
export default function NdaUpload() {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleFile(file: File | undefined) {
    if (!file) return;
    setError(null);

    const formData = new FormData();
    formData.set("file", file);

    startTransition(async () => {
      const result = await uploadNda(formData);
      if (!result.ok) setError(result.error);
      else router.refresh();
    });
  }

  return (
    <>
      <input
        ref={input}
        type="file"
        accept="application/pdf"
        className="sr-only"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
      <button
        type="button"
        disabled={pending}
        onClick={() => input.current?.click()}
        className="mt-[30px] flex h-[36px] items-center gap-[10px] rounded-[8px] border border-[color:var(--color-gray)]/40 bg-white px-[20px] text-regular leading-none text-gray shadow-card disabled:opacity-50"
      >
        <Monitor className="h-[16px] w-[16px]" strokeWidth={2} aria-hidden />
        {pending ? "Uploading…" : "Upload from computer"}
      </button>
      {error && (
        <p className="mt-[10px] text-regular leading-tight text-maroon">{error}</p>
      )}
    </>
  );
}
