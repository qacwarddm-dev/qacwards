"use client";

import { Monitor, UserRound } from "lucide-react";
import Link from "next/link";
import { useRef, useState } from "react";
import { AuthButton, AuthCard, AuthShell } from "@/components/auth";
import { REGISTER_STEPS } from "../register-options";

/**
 * Step 4 of register — assets/FIGMA/register/upload-profile.png, titled PROFILE.
 *
 * Measured from the body top (card top + the 63px band): blurb 40.5, the 80px
 * avatar 110, "Drag photo here" 203, "- or -" 234, the outlined 191x35 upload
 * button 260, Next 345 and Skip 404. The placeholder disc is #B7B7B7, which no
 * token carries; --color-gray at 55% renders 182 against the card's white and is
 * the nearest token-derived match to the measured 183.
 *
 * The picker is real (drag-and-drop or file dialog) but purely local: it shows an
 * object URL so the screen is not inert, and nothing is uploaded — storage lands
 * with Supabase in 3b. Skip and Next therefore go to the same place; the frame
 * offers both because only one of them implies a picture was chosen.
 */
export default function ProfileForm() {
  const [preview, setPreview] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const accept = (file: File | undefined) => {
    if (!file?.type.startsWith("image/")) return;
    setPreview((old) => {
      if (old) URL.revokeObjectURL(old);
      return URL.createObjectURL(file);
    });
  };

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

        <div className="mt-[50px] mb-[11.5px] flex flex-col items-center">
          <AuthButton tone="maroon" size="pill-sm" href={REGISTER_STEPS.done}>
            Next
          </AuthButton>
          <Link
            href={REGISTER_STEPS.done}
            className="mt-[19px] text-regular leading-[12px] text-maroon"
          >
            Skip
          </Link>
        </div>
      </AuthCard>
    </AuthShell>
  );
}
