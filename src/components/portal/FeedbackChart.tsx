/**
 * "Overall Summary" chart on QAC's Feedback screen — assets/new frames/EVENTS/
 * Feedbacks.png. Same plain-SVG, no-dependency approach as `CopcChart`, but a
 * fixed 1-5 rating scale across twelve months rather than four level buckets,
 * so it is its own component rather than a generalised prop on that one.
 */
const X_LABELS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const W = 1560;
const H = 210;
const ROWS = 4;
const Y_MIN = 1;
const Y_MAX = 5;

function smoothPath(values: number[]) {
  const step = W / (values.length - 1);
  const y = (v: number) => H - ((v - Y_MIN) / (Y_MAX - Y_MIN)) * H;
  const pts = values.map((v, i) => ({ x: i * step, y: y(v || Y_MIN) }));

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

export default function FeedbackChart({ series }: { series: number[] }) {
  return (
    <div className="pl-[40px] pr-[24px]">
      <div className="flex">
        <div className="flex w-[24px] flex-col justify-between text-micro leading-none text-gray">
          {Array.from({ length: ROWS + 1 }, (_, i) => (
            <span key={i}>{Y_MAX - i}</span>
          ))}
        </div>

        <svg
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="none"
          className="block h-[210px] w-full"
          role="img"
          aria-label="Average QAC service rating by month"
        >
          <g stroke="var(--color-gray)" strokeDasharray="3 3">
            {Array.from({ length: X_LABELS.length }, (_, i) => (
              <line
                key={`v${i}`}
                x1={(i * W) / (X_LABELS.length - 1)}
                y1={0}
                x2={(i * W) / (X_LABELS.length - 1)}
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
            d={smoothPath(series)}
            fill="none"
            stroke="var(--color-maroon)"
            strokeWidth={2}
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      </div>

      <div className="relative mt-[10px] h-[12px] pl-[24px]">
        {X_LABELS.map((label, i) => (
          <span
            key={label}
            className="absolute -translate-x-1/2 whitespace-nowrap text-micro leading-none text-gray"
            style={{ left: `${(i * 100) / (X_LABELS.length - 1)}%` }}
          >
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}
