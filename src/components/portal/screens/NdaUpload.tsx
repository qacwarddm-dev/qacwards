"use client";

import { Download, Monitor } from "lucide-react";
import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { uploadNda } from "@/lib/document-actions";
import { Button, TextField } from "../kit";

/**
 * The NDA gate's controls (frame 03): download a template stamped with a fresh
 * NDA File ID, then upload the signed, notarized scan together with that id and
 * the notarial details for `uploadNda` to check.
 */
const NOTARIAL_FIELDS = [
  { name: "attorney", label: "Name of Attorney (Notary Public)", placeholder: "Atty. Juan Dela Cruz" },
  { name: "docNo", label: "Doc. No.", placeholder: "123" },
  { name: "pageNo", label: "Page No.", placeholder: "25" },
  { name: "bookNo", label: "Book No.", placeholder: "IV" },
] as const;

export default function NdaUpload() {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function submit(form: HTMLFormElement) {
    if (!file) return;
    setError(null);
    const formData = new FormData(form);
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
        onChange={(e) => {
          setFile(e.target.files?.[0] ?? null);
          setError(null);
        }}
      />
      <button
        type="button"
        disabled={pending}
        onClick={() => input.current?.click()}
        className="mt-[30px] flex h-[36px] items-center gap-[10px] rounded-lg border border-[color:var(--color-gray)]/40 bg-white px-[20px] text-regular leading-none text-gray shadow-card disabled:opacity-50"
      >
        <Monitor className="h-[16px] w-[16px]" strokeWidth={2} aria-hidden />
        {file ? file.name : "Upload from computer"}
      </button>

      <a
        href="/api/documents/nda-template"
        className="mt-[16px] flex items-center gap-[6px] text-micro leading-none text-maroon underline"
      >
        <Download className="h-[11px] w-[11px]" strokeWidth={2.5} aria-hidden />
        Download NDA Form
      </a>

      {file && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit(e.currentTarget);
          }}
          className="mt-[24px] w-full max-w-[520px] rounded-md border border-[color:var(--color-gray)]/25 p-[20px]"
        >
          <p className="text-regular leading-[16px] text-gray">
            Enter the NDA File ID printed at the top of the form and the notarial
            details stamped by the notary public.
          </p>
          <div className="mt-[16px] grid grid-cols-2 gap-[14px]">
            <div className="col-span-2">
              <TextField
                label="NDA File ID"
                name="fileId"
                required
                placeholder="QAC-NDA-XXXX-XXXX"
                autoComplete="off"
                className="uppercase"
              />
            </div>
            <div className="col-span-2">
              <TextField {...NOTARIAL_FIELDS[0]} required />
            </div>
            {NOTARIAL_FIELDS.slice(1).map((f) => (
              <TextField key={f.name} {...f} required />
            ))}
            <TextField
              label="Series of"
              name="series"
              required
              inputMode="numeric"
              placeholder={String(new Date().getFullYear())}
            />
          </div>

          {error && <p className="mt-[12px] text-regular leading-tight text-maroon">{error}</p>}

          <div className="mt-[18px] flex justify-end gap-[12px]">
            <Button
              variant="ghost"
              type="button"
              onClick={() => {
                setFile(null);
                setError(null);
                if (input.current) input.current.value = "";
              }}
            >
              Cancel
            </Button>
            <Button variant="primary" type="submit" loading={pending}>
              Submit NDA
            </Button>
          </div>
        </form>
      )}
    </>
  );
}
