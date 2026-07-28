export type Step = { label: string; done?: boolean };

/**
 * Horizontal progress track. Completed steps and the segments joining them are
 * yellow; the rest are grey.
 *
 * Each step is a zero-width anchor at its percentage along the track, with the
 * dot and label centred on it. The anchor must stay `w-0` — give it width and
 * `-translate-x-1/2` starts measuring against the label instead of the point.
 *
 * Two measured sizes:
 * - `assignment` — under an expanded row of the Assignment table
 *   (qac_personnel/03-Accreditation Assignment.png): 22px dots, 15px labels.
 * - `levels` — inside the Submissions levels list
 *   (program_representative/08-Submissions(LevelsAcred.png): 20px dots sitting
 *   30.5px below the row above, 12px labels on a 15px line, #D9D9D9 idle track.
 *
 * Labels honour newlines (`whitespace-pre-line`). The frames break "Program /
 * Evaluated" over two lines at a width that still keeps the longer "Phases
 * Completed" on one, so the break is content, not a consequence of label width.
 *
 * Tailwind needs whole class names at build time, so each variant carries its
 * idle colour as a literal rather than composing an opacity suffix.
 */
const VARIANTS = {
  assignment: {
    height: 74,
    dot: 22,
    dotTop: 0,
    labelTop: 35,
    labelWidth: 160,
    labelClass: "text-subheading leading-[1.35]",
    idle: "bg-[color:var(--color-gray)]/35",
  },
  levels: {
    height: 110,
    dot: 20,
    dotTop: 30.5,
    labelTop: 57.5,
    labelWidth: 120,
    labelClass: "text-regular leading-[15px]",
    idle: "bg-[color:var(--color-gray)]/30",
  },
} as const;

export default function Stepper({
  steps,
  variant = "assignment",
}: {
  steps: Step[];
  variant?: keyof typeof VARIANTS;
}) {
  const v = VARIANTS[variant];
  const last = steps.length - 1;
  const doneCount = steps.filter((s) => s.done).length;
  const donePct = last > 0 ? (Math.max(doneCount - 1, 0) / last) * 100 : 0;
  const at = (i: number) => (last > 0 ? (i / last) * 100 : 0);
  const trackTop = v.dotTop + (v.dot - 8) / 2;

  return (
    <div className="relative" style={{ marginInline: v.dot / 2, height: v.height }}>
      <div
        className={`absolute inset-x-0 h-[8px] rounded-full ${v.idle}`}
        style={{ top: trackTop }}
      />
      <div
        className="absolute left-0 h-[8px] rounded-full bg-yellow"
        style={{ top: trackTop, width: `${donePct}%` }}
      />

      {steps.map((step, i) => (
        <div key={step.label} className="absolute top-0 w-0" style={{ left: `${at(i)}%` }}>
          <span
            className={`absolute left-0 -translate-x-1/2 rounded-full ${
              step.done ? "bg-yellow" : v.idle
            }`}
            style={{ width: v.dot, height: v.dot, top: v.dotTop }}
          />
          <span
            className={`absolute left-0 -translate-x-1/2 whitespace-pre-line text-center ${v.labelClass} ${
              step.done ? "text-yellow" : "text-[color:var(--color-gray)]/70"
            }`}
            style={{ width: v.labelWidth, top: v.labelTop }}
          >
            {step.label}
          </span>
        </div>
      ))}
    </div>
  );
}
