// Plain `animate-*`, not `motion-safe:`: under reduced motion the global rule
// in globals.css collapses the animation to its end frame, whereas skipping it
// would leave the tick at its hidden starting dash offset.
export default function SuccessCheck({ size = 84 }: { size?: 72 | 84 }) {
  const glyph = Math.round(size * 0.52);
  return (
    <span
      aria-hidden
      className="mx-auto flex shrink-0 animate-[success-pop_450ms_cubic-bezier(0.2,1.4,0.4,1)_both] items-center justify-center rounded-full bg-[color:var(--tint-approved)]"
      style={{ width: size, height: size }}
    >
      <svg width={glyph} height={glyph} viewBox="0 0 24 24" fill="none">
        <path
          d="M5 12.5l4.5 4.5L19 7.5"
          pathLength={1}
          stroke="var(--color-approved)"
          strokeWidth={2.6}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={1}
          strokeDashoffset={1}
          className="animate-[check-draw_500ms_var(--ease-out)_250ms_forwards]"
        />
      </svg>
    </span>
  );
}
