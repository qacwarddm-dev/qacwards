/**
 * "Overall Program With Issued COPCs" chart from
 * assets/FIGMA/qac_personnel/01-Dashboard.png.
 *
 * Plain SVG rather than a chart library: phase 3a adds no dependencies, and the
 * prototype's curve is reproduced exactly by sampling it. SERIES is the swap
 * point when real data arrives — counts on the 0–300 axis, one sample per
 * 1/16th across the plot.
 *
 * Absolutely positioned inside the chart card so the plot lands at the measured
 * offset (220px from the card's left edge, 37px from its top).
 */
const SERIES = [
  13.5, 23.9, 34.7, 60.4, 91.9, 106.3, 112.3, 115.8, 130.8, 158.1, 184.8, 193.7,
  192.5, 191.8, 217.0, 241.1, 247.8,
];

const Y_MAX = 300;
const X_LABELS = ["I", "II", "III", "IV"];

// Plot box in CSS px at the 1440 design width.
const W = 761;
const H = 236;
const COLS = 8;
const ROWS = 4;

/** Catmull-Rom through the samples, emitted as cubic beziers. */
function smoothPath(values: number[]) {
  const pts = values.map((v, i) => ({
    x: (i * W) / (values.length - 1),
    y: H - (v / Y_MAX) * H,
  }));

  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    d +=
      ` C ${p1.x + (p2.x - p0.x) / 6} ${p1.y + (p2.y - p0.y) / 6}` +
      ` ${p2.x - (p3.x - p1.x) / 6} ${p2.y - (p3.y - p1.y) / 6}` +
      ` ${p2.x} ${p2.y}`;
  }
  return d;
}

export default function CopcChart() {
  return (
    <div className="absolute inset-x-0 top-[37px] pl-[220px] pr-[95px]">
      {/* y axis, right-aligned into the gutter left of the plot */}
      <span className="absolute left-0 top-0 w-[212px] -translate-y-1/2 text-right text-micro leading-none text-gray">
        {Y_MAX}
      </span>
      <span className="absolute left-0 top-[236px] w-[210px] -translate-y-[85%] text-right text-micro leading-none text-gray">
        0
      </span>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        className="block h-[236px] w-full"
        role="img"
        aria-label="Overall programs with issued COPCs, rising across accreditation levels I to IV"
      >
        <g stroke="var(--color-gray)" strokeDasharray="3 3">
          {Array.from({ length: COLS + 1 }, (_, i) => (
            <line
              key={`v${i}`}
              x1={(i * W) / COLS}
              y1={0}
              x2={(i * W) / COLS}
              y2={H}
              vectorEffect="non-scaling-stroke"
            />
          ))}
          {Array.from({ length: ROWS + 1 }, (_, i) => (
            <line
              key={`h${i}`}
              x1={0}
              y1={(i * H) / ROWS}
              x2={W}
              y2={(i * H) / ROWS}
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </g>

        <path
          d={smoothPath(SERIES)}
          fill="none"
          stroke="var(--color-maroon)"
          strokeWidth={2}
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>

      {/* x axis — labels sit on every second column boundary */}
      <div className="relative mt-[10px] h-[10px]">
        {X_LABELS.map((label, i) => (
          <span
            key={label}
            className="absolute -translate-x-1/2 text-micro leading-none text-gray"
            style={{ left: `${((i + 1) * 2 * 100) / COLS}%` }}
          >
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}
