"use client";

import { Play } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

const SRC = "/assets/video/pup-ako-tagumpay-ako.mp4";
const POSTER = "/assets/video/pup-ako-tagumpay-ako-poster.webp";

/**
 * The landing video is a 4½-minute file — an order of magnitude heavier than
 * every other asset on the page put together. So it is never fetched on load:
 * until the visitor clicks, all that ships is the poster still (~43KB, served
 * through next/image so small viewports get a smaller one). The <video> element
 * is not mounted at all in the idle state, which beats `preload="none"` on
 * Safari, where a poster on a mounted <video> can still trigger a range request
 * for the moov atom.
 *
 * Clicking mounts the element with `autoPlay`, so the play gesture is not spent
 * on the mount — the user clicks once and it plays. That is also why the
 * overlay is a real <button>: it is the thing keyboard and screen-reader users
 * activate, and the native controls take over from the second frame.
 *
 * The 768px cap is load-bearing, not styling: the shipped encode is 720p
 * precisely because the frame never exceeds it, and widening the box would put
 * an upscaled picture on screen.
 */
export function LandingVideo() {
  const [playing, setPlaying] = useState(false);

  const frame =
    "relative w-full max-w-[768px] overflow-hidden rounded-[var(--radius-lg)] border border-[var(--hairline)] bg-black shadow-[var(--elev-3)]";

  if (playing) {
    return (
      <div className={frame}>
        {/* No <track> — the asset ships no caption file; its lyrics and
            credits are burned into the picture. */}
        <video
          className="aspect-video w-full"
          src={SRC}
          poster={POSTER}
          controls
          autoPlay
          playsInline
        />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setPlaying(true)}
      className={`group aspect-video ${frame} cursor-pointer`}
    >
      <Image
        src={POSTER}
        alt=""
        fill
        sizes="(min-width: 768px) 768px, 100vw"
        className="object-cover transition-transform duration-[var(--motion-slow)] ease-[var(--ease-out)] group-hover:scale-[1.03]"
      />
      <span
        aria-hidden
        className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent"
      />
      <span className="absolute inset-0 flex items-center justify-center">
        <span className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-white/95 shadow-[var(--elev-3)] transition-transform duration-[var(--motion-base)] ease-[var(--ease-out)] group-hover:scale-110">
          <Play
            aria-hidden
            className="ml-1 h-8 w-8 text-maroon"
            strokeWidth={1.5}
            fill="currentColor"
          />
        </span>
      </span>
      <span className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-3 px-[var(--space-5)] pb-[var(--space-4)] text-left">
        <span className="t-body-strong text-white">
          PUP Ako, Tagumpay Ako
        </span>
        <span className="t-meta rounded-full bg-white/15 px-3 py-1 text-white/90">
          4:27
        </span>
      </span>
      <span className="sr-only">Play the video: PUP Ako, Tagumpay Ako</span>
    </button>
  );
}
