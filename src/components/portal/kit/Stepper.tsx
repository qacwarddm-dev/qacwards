export type Step = { label: string; done?: boolean };

const DOT = 22;
const LABEL_W = 160;

/**
 * Horizontal progress track under an expanded assignment row. Completed steps
 * and the segments joining them are yellow; the rest are grey.
 *
 * Each step is a zero-width anchor at its percentage along the track, with the
 * dot and label centred on it. The anchor must stay `w-0` — give it width and
 * `-translate-x-1/2` starts measuring against the label instead of the point.
 */
export default function Stepper({ steps }: { steps: Step[] }) {
  const last = steps.length - 1;
  const doneCount = steps.filter((s) => s.done).length;
  const donePct = last > 0 ? (Math.max(doneCount - 1, 0) / last) * 100 : 0;
  const at = (i: number) => (last > 0 ? (i / last) * 100 : 0);

  return (
    <div className="relative h-[74px]" style={{ marginInline: DOT / 2 }}>
      <div className="absolute inset-x-0 top-[7px] h-[8px] rounded-full bg-[color:var(--color-gray)]/35" />
      <div
        className="absolute left-0 top-[7px] h-[8px] rounded-full bg-yellow"
        style={{ width: `${donePct}%` }}
      />

      {steps.map((step, i) => (
        <div key={step.label} className="absolute top-0 w-0" style={{ left: `${at(i)}%` }}>
          <span
            className={`absolute left-0 top-0 -translate-x-1/2 rounded-full ${
              step.done ? "bg-yellow" : "bg-[color:var(--color-gray)]/35"
            }`}
            style={{ width: DOT, height: DOT }}
          />
          <span
            className={`absolute left-0 top-[35px] -translate-x-1/2 text-center text-subheading leading-[1.35] ${
              step.done ? "text-yellow" : "text-[color:var(--color-gray)]/70"
            }`}
            style={{ width: LABEL_W }}
          >
            {step.label}
          </span>
        </div>
      ))}
    </div>
  );
}
