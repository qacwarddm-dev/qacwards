import Link from "next/link";

/**
 * The two-flap switcher above `/portal/events` and `/portal/events/schedule`
 * (assets/new frames/EVENTS/Event Calendar.png, Event Schedule.png).
 *
 * Both tabs share one flat top-edge width (`TAB_W`) — "Calendar" and "Event
 * Schedule" render the same size regardless of label length, they are not
 * sized to their own text. What makes this look like a flap is that the
 * *active* tab's bottom edge bulges outward at the seam while the inactive
 * one stays a straight-sided rectangle: measured off both frame exports
 * (pixel-diffed left/seam/right boundaries at the strip's top and bottom
 * rows), the outer-left edge always travels `LEFT_FLARE`, the outer-right
 * edge always travels `RIGHT_FLARE`, and the seam travels `SEAM_FLARE`
 * *toward whichever side is active* — so the active tab's rendered width
 * grows from `TAB_W` at the top to roughly `TAB_W + SEAM_FLARE + LEFT_FLARE`
 * (or `+ RIGHT_FLARE`) at the bottom, while the inactive one stays `TAB_W`
 * throughout. One SVG draws both tab shapes so the shared seam edge is a
 * single path — never a hairline gap or overlap — same convention as
 * `DocTabs`, just with per-edge flare instead of one shared constant (this
 * is two tabs with an asymmetric curve, not `DocTabs`' three-tab symmetric
 * one — see that component's own note on not forcing its curve onto a frame
 * it wasn't traced for).
 */
const STRIP_H = 50;
const TAB_W = 247;
const LEFT_FLARE = 58;
const RIGHT_FLARE = 78;
const SEAM_FLARE = 78;
const TOTAL_W = LEFT_FLARE + TAB_W * 2 + RIGHT_FLARE;

export type EventsTab = "calendar" | "schedule";

const TABS: { key: EventsTab; label: string; href: string }[] = [
  { key: "calendar", label: "Calendar", href: "/portal/events" },
  { key: "schedule", label: "Event Schedule", href: "/portal/events/schedule" },
];

/** Same top-to-bottom bezier proportions `DocTabs.tabPath` uses (its
 *  `C 18 7, 28 42, FLARE H` scaled to fractions of the box), applied to
 *  whatever `(dx, H)` box a given edge travels through. `reverse` draws the
 *  curve bottom-to-top for an edge's trailing side. */
function edgeCurve(xTop: number, xBottom: number, reverse: boolean) {
  const dx = xBottom - xTop;
  const cp1x = xTop + dx * 0.2647;
  const cp2x = xTop + dx * 0.4118;
  const cp1y = STRIP_H * 0.14;
  const cp2y = STRIP_H * 0.84;
  return reverse
    ? `C ${cp2x} ${cp2y}, ${cp1x} ${cp1y}, ${xTop} 0`
    : `C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${xBottom} ${STRIP_H}`;
}

function tabShape(xTopL: number, xTopR: number, xBotL: number, xBotR: number) {
  return [
    `M ${xTopL} 0`,
    edgeCurve(xTopL, xBotL, false),
    `L ${xBotR} ${STRIP_H}`,
    edgeCurve(xTopR, xBotR, true),
    "Z",
  ].join(" ");
}

export default function EventsTabs({ active }: { active: EventsTab }) {
  const calendarActive = active === "calendar";
  const seamBottom = LEFT_FLARE + TAB_W + (calendarActive ? SEAM_FLARE : -SEAM_FLARE);

  const calendarPath = tabShape(LEFT_FLARE, LEFT_FLARE + TAB_W, 0, seamBottom);
  const schedulePath = tabShape(
    LEFT_FLARE + TAB_W,
    LEFT_FLARE + TAB_W * 2,
    seamBottom,
    TOTAL_W,
  );

  return (
    <div className="relative mx-auto" style={{ width: TOTAL_W, height: STRIP_H }}>
      <svg
        viewBox={`0 0 ${TOTAL_W} ${STRIP_H}`}
        width={TOTAL_W}
        height={STRIP_H}
        className="absolute inset-0"
        aria-hidden
      >
        {/* Inactive tab painted first, active tab on top of it at the shared seam. */}
        <path
          d={calendarActive ? schedulePath : calendarPath}
          fill="var(--color-maroon)"
        />
        <path
          d={calendarActive ? calendarPath : schedulePath}
          fill="var(--color-white)"
        />
      </svg>

      {TABS.map((tab, i) => {
        const isActive = tab.key === active;
        return (
          <Link
            key={tab.key}
            href={tab.href}
            aria-current={isActive ? "page" : undefined}
            className="absolute top-0 flex items-center justify-center whitespace-nowrap font-bold leading-none text-subheading"
            style={{
              left: LEFT_FLARE + i * TAB_W,
              width: TAB_W,
              height: STRIP_H,
              color: isActive ? "var(--color-maroon)" : "var(--color-white)",
            }}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
