"use client";

import { useLayoutEffect, useRef, useState } from "react";

/**
 * The surface card sitting in the auth panel. 382px wide with a 20px radius on
 * both login frames, centred in the 518px panel; fill is the surface token
 * rather than white because the panel behind it already is white.
 *
 * The frames differ only in where the card starts and how it is padded —
 * `picker` centres its own contents, `form` sits 58.5px below the Back link and
 * hands its body to a white sub-card, and `register` (assets/FIGMA/register) is
 * two-toned and carries no top margin at all — it is centred by its shell
 * (`AuthShell align="center"`), because the register frames grow the card about
 * a fixed middle rather than a fixed top. See AuthShell for the measurements.
 *
 * `register` is two-toned because all five register frames are: the card itself
 * is --color-surface (#F5F5F5) and its body is a white rounded-top panel that
 * runs to the card's bottom edge, so the surface only shows through as a band
 * behind the title. Measured off the 2x frames (halved): the band is 63px tall
 * (62-65 across reg form / program-rep-form / createpassword / verify-webmail /
 * upload-profile), the title's cap-top sits a consistent 26.5px below the card
 * top, and the body's top corners carry the same 20px radius as the card.
 *
 * The body must NOT be clipped with overflow-hidden to get its bottom corners —
 * AuthSelect opens its menu out of the body, and clipping would cut it off. It
 * carries the radius on all four corners instead; the bottom two coincide with
 * the card's own, so the surface is invisible there.
 *
 * The picker's top gap was 84px in the frame; the owner asked (2026-07-24) to
 * lift it a little, so it is 54px — a deliberate step away from the frame.
 *
 * `register` also reads too large to the owner at frame size (2026-07-25), so the
 * whole card is zoomed to 0.85 — one factor keeps every measured proportion
 * intact while shrinking it, rather than re-tuning each field (which the login
 * frames share and must stay frame-accurate). Raise toward 1 to enlarge.
 */
const REGISTER_ZOOM = 0.85;

/**
 * 0.85 is a ceiling, not a constant: the card shrinks further whenever it would
 * not otherwise fit the room above the footnote (owner, 2026-07-26 — the tall
 * Program Representative state was still running past it).
 *
 * Centring alone could not fix that, because the panel magnifies rather than
 * reflows. `auth-scale` (globals.css) zooms the whole panel by viewport-width/1440
 * while its height is only (100dvh - 80px)/that same factor — so a wider monitor
 * makes the card bigger and the room *smaller*. Measured on the six-field state:
 * 593px tall with 17px to spare at 1440x810, but 791px and 28px past the footnote
 * at 1920x950, and over by 4px at 1366x768. Any fixed factor is wrong somewhere.
 *
 * The two measurements must be put in the same coordinate space before they are
 * compared, which is the whole trap here: `getBoundingClientRect()` is in device
 * px and so carries every ancestor `zoom`, while `clientHeight` is in the
 * element's own local px and carries none. Divide one by the other on the room
 * itself and the quotient *is* the ancestor zoom, which then cancels out of the
 * card. Comparing them raw instead silently over-shrinks by exactly the
 * auth-scale factor — 648px where 791 fits, at 1920x1080.
 *
 * Natural height divides out the factor we set rather than reading offsetHeight,
 * which disagrees with rect under `zoom`. That also makes this converge in one
 * pass: the measurement it feeds on does not move when the zoom does.
 */
const FIT_GAP = 16;

function useFitToRoom(max: number) {
  const ref = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(max);
  const applied = useRef(max);

  // Mirrored in a layout effect rather than during render, so the observer below
  // reads it only after the zoom it describes has actually been committed.
  useLayoutEffect(() => {
    applied.current = zoom;
  }, [zoom]);

  useLayoutEffect(() => {
    const card = ref.current;
    const room = card?.parentElement;
    if (!card || !room) return;

    const fit = () => {
      const local = room.clientHeight;
      if (!local) return;
      const ancestorZoom = room.getBoundingClientRect().height / local;
      const natural =
        card.getBoundingClientRect().height / (applied.current * ancestorZoom);
      const available = local - FIT_GAP;
      if (!natural || available <= 0) return;
      const next = Math.floor(Math.min(max, available / natural) * 1000) / 1000;
      // Sub-pixel drift would otherwise ping-pong against the observer below.
      if (Math.abs(next - applied.current) > 0.002) setZoom(next);
    };

    fit();
    // The room changes on resize; the card changes when a conditional field
    // appears. Both have to re-fit, so both are observed.
    const observer = new ResizeObserver(fit);
    observer.observe(room);
    observer.observe(card);
    return () => observer.disconnect();
  }, [max]);

  return [ref, zoom] as const;
}

const SHELL = "flex w-[382px] max-w-[calc(100%-32px)] flex-col rounded-[20px] shadow-card";

export default function AuthCard({
  variant = "picker",
  title,
  contentWidth = "full",
  children,
}: {
  variant?: "picker" | "form" | "register";
  /** Register only — the step name shown on the surface band above the body. */
  title?: string;
  /**
   * Register only. Every register frame is a 378px card, but they do not all
   * inset the body the same: `full` is the 44px padding (290px of content) used
   * by reg form, verify-webmail and upload-profile, and `narrow` is the 64px
   * padding (250px) that createpassword.png alone draws. Measured, not chosen —
   * flagged in the notes as a likely design slip worth normalising.
   */
  contentWidth?: "full" | "narrow";
  children: React.ReactNode;
}) {
  const [cardRef, registerZoom] = useFitToRoom(REGISTER_ZOOM);

  if (variant === "register") {
    return (
      <div ref={cardRef} style={{ zoom: registerZoom }} className={`${SHELL} bg-surface`}>
        {/* Height and padding are both measured: h-63 is the band, pt-25 lands
            the cap-top at the frame's 26.5px. Centring the 20px line box in the
            band instead puts the caps ~3.5px high, because the font's ascent
            and descent are not symmetric about the caps. */}
        <h1 className="h-[63px] shrink-0 pt-[25px] text-center text-heading leading-none font-bold text-maroon">
          {title}
        </h1>
        <div
          className={`rounded-[20px] bg-white pt-[35px] pb-[28px] ${
            contentWidth === "narrow" ? "px-[64px]" : "px-[44px]"
          }`}
        >
          {children}
        </div>
      </div>
    );
  }

  const pad = {
    picker: "mt-[54px] items-center pt-[41.5px] pb-[71px]",
    form: "mt-[58.5px] px-[2px] pt-[23.75px]",
  }[variant];

  return <div className={`${SHELL} bg-surface ${pad}`}>{children}</div>;
}
