import type { DocStatus } from "./StatusPill";

const FILL: Record<DocStatus, string> = {
  approved: "bg-[color:var(--color-approved)]",
  pending: "bg-yellow",
  disapproved: "bg-maroon",
};

const LABEL: Record<DocStatus, string> = {
  approved: "Approved",
  pending: "Pending",
  disapproved: "Disapproved",
};

export type StatusBar = { status: DocStatus; value: number };

const BAR_RADIUS = 18;

/**
 * "Document Status Distribution" — three columns on one baseline with a 0/max
 * scale. Bars are 66px wide and carry a 33px top radius, so a short bar reads as
 * a dome rather than a stub; that is how the frame draws Disapproved.
 *
 * Everything is placed absolutely against offsets measured off
 * program_representative/01-Dashboard.png, relative to the top of the card's
 * body (i.e. below the 54px title bar): max gridline 29.5, baseline 181, bars
 * starting at x 117 on a 124px pitch, axis running x 63..528.
 *
 * The card is fluid — it is the dashboard's flexing left column — so the axis is
 * pinned to both of the card's edges rather than given a width, and the bars
 * ride it as fractions of its length instead of at fixed x offsets. At the 605
 * the frame draws, the axis is 465 long and those fractions land the bar centres
 * on the measured 179 / 303 / 427; wider, the whole plot grows with the card
 * instead of stranding it against the left edge.
 */
const TOP = 29.5;
const BASE = 181;
const PLOT_H = BASE - TOP;

const AXIS_LEFT = 63;
/** 605 (frame card) - 63 (left inset) - 528 (axis end). */
const AXIS_RIGHT = 77;
const AXIS_W = 465;
/** Both measured from the axis's left end, not the card's. */
const FIRST_CENTRE = 116;
const PITCH = 124;

/** Bar i's centre as a percentage along the axis. */
const centre = (i: number) => `${((FIRST_CENTRE + i * PITCH) / AXIS_W) * 100}%`;

export default function StatusBarChart({
  bars,
  max = 100,
}: {
  bars: StatusBar[];
  max?: number;
}) {
  const scale = "absolute left-0 w-[55px] -translate-y-1/2 text-right text-micro leading-none text-[color:var(--color-gray)]/70";
  const axis = { left: `${AXIS_LEFT}px`, right: `${AXIS_RIGHT}px` };

  return (
    <div className="relative h-[240px]">
      <span className={scale} style={{ top: `${TOP}px` }}>{max}</span>
      <span className={scale} style={{ top: `${BASE}px` }}>0</span>

      <div
        className="absolute h-px bg-[color:var(--color-gray)]/40"
        style={{ ...axis, top: `${BASE}px` }}
      />

      <div
        className="absolute"
        style={{ ...axis, top: `${TOP}px`, height: `${PLOT_H}px` }}
      >
        {bars.map((b, i) => (
          /* Not a semicircle: the frame's bar reaches its full 66px width
             17px below the top edge. */
          <span
            key={b.status}
            className={`absolute bottom-0 w-[66px] -translate-x-1/2 ${FILL[b.status]}`}
            style={{
              left: centre(i),
              height: `${(b.value / max) * PLOT_H}px`,
              borderRadius: `${BAR_RADIUS}px ${BAR_RADIUS}px 0 0`,
            }}
          />
        ))}
      </div>

      <div className="absolute" style={{ ...axis, top: "198px" }}>
        {bars.map((b, i) => (
          <span
            key={b.status}
            className="absolute w-[124px] -translate-x-1/2 text-center text-regular leading-none text-gray"
            style={{ left: centre(i) }}
          >
            {LABEL[b.status]}
          </span>
        ))}
      </div>
    </div>
  );
}
