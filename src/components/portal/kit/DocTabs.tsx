import Link from "next/link";

export type DocTab = { key: string; label: string; href: string };

/**
 * The layered folder tabs above the Documents panel
 * (program_representative/02-06). Each tab is the same leaf shape: a 50px-tall
 * band whose left and right edges are the same S-curve, translated by the tab
 * width, so the tabs interlock rather than merely overlap.
 *
 * The curve was traced row by row off the frame — it leaves the top edge
 * steeply, almost stalls through the middle, then flares out again at the
 * bottom, which is what a plain skew or border-radius cannot express. Hence
 * SVG rather than CSS.
 *
 * Colour is positional, not semantic: the active tab is white, and the
 * remaining tabs take yellow then maroon **in order**, so which tab is yellow
 * changes with the selection. That is what the three frames show.
 *
 * Slots are fixed — the tabs do not re-flow when the selection moves.
 */
const STRIP_H = 50;
const PANEL_W = 1000;

/**
 * The strip always begins 117px into the panel; the selected tab is 9px wider
 * than the rest, so the slots shift when the selection moves — they are not
 * fixed positions. Widths are separated by a 1px hairline.
 */
const STRIP_X = 117;
const ACTIVE_W = 254;
const INACTIVE_W = 245;
const GAP = 1;

/** Horizontal travel of an edge from the top of the strip to the bottom. */
const FLARE = 68;

function slots(count: number, activeIndex: number) {
  const out: { x: number; w: number }[] = [];
  let x = STRIP_X;
  for (let i = 0; i < count; i++) {
    const w = i === activeIndex ? ACTIVE_W : INACTIVE_W;
    out.push({ x, w });
    x += w + GAP;
  }
  return out;
}

/** One tab's outline: down the left edge, across, back up the right edge. */
function tabPath(x: number, w: number) {
  return [
    `M ${x} 0`,
    `C ${x + 18} 7, ${x + 28} 42, ${x + FLARE} ${STRIP_H}`,
    `L ${x + w + FLARE} ${STRIP_H}`,
    `C ${x + w + 28} 42, ${x + w + 18} 7, ${x + w} 0`,
    "Z",
  ].join(" ");
}

const FILL = ["var(--color-yellow)", "var(--color-maroon)"];

export default function DocTabs({
  tabs,
  active,
}: {
  tabs: DocTab[];
  active: string;
}) {
  const activeIndex = tabs.findIndex((t) => t.key === active);
  const box = slots(tabs.length, activeIndex);

  let inactiveSeen = 0;
  const fillFor = new Map<number, string>();
  tabs.forEach((t, i) => {
    if (t.key !== active) fillFor.set(i, FILL[inactiveSeen++ % FILL.length]);
  });

  // Non-active tabs are painted right-to-left so each sits above its right-hand
  // neighbour; the active tab is painted last, on top of everything.
  const behind = tabs
    .map((t, i) => ({ t, i }))
    .filter(({ t }) => t.key !== active)
    .reverse();

  return (
    <div className="relative h-[50px]" style={{ width: PANEL_W }}>
      <svg
        viewBox={`0 0 ${PANEL_W} ${STRIP_H}`}
        width={PANEL_W}
        height={STRIP_H}
        className="absolute inset-0"
        aria-hidden
      >
        {behind.map(({ i }) => (
          <path key={i} d={tabPath(box[i].x, box[i].w)} fill={fillFor.get(i)} />
        ))}
        {activeIndex >= 0 && (
          <path
            d={tabPath(box[activeIndex].x, box[activeIndex].w)}
            fill="var(--color-white)"
          />
        )}
      </svg>

      {tabs.map((t, i) => {
        const isActive = t.key === active;
        return (
          <Link
            key={t.key}
            href={t.href}
            aria-current={isActive ? "page" : undefined}
            className={`absolute top-0 flex h-[50px] items-center justify-center whitespace-nowrap font-bold leading-none ${
              // The selected tab is set a step larger, not merely recoloured.
              isActive ? "text-heading text-maroon" : "text-subheading text-white"
            }`}
            style={{
              left: box[i].x + FLARE / 2,
              width: box[i].w,
              zIndex: isActive ? 10 : 10 - i,
            }}
          >
            {t.label}
          </Link>
        );
      })}
    </div>
  );
}
