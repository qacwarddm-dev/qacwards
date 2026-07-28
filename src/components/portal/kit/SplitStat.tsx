export type SplitStatHalf = {
  value: string;
  /** Wrapped in the prototype ("Missing / Documents"); keep the newline. */
  caption: string;
  tone: "maroon" | "yellow";
};

/**
 * Two numbers side by side in one bordered tile, split by a hairline — the
 * Readiness Scores card on assets/FIGMA/program_representative/07-Submissions.png.
 * 230x82 there, but the tile flexes so a row of four fills the panel.
 *
 * The rule is inset 16px top and bottom rather than running full height.
 */
function Half({ value, caption, tone }: SplitStatHalf) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center">
      <span
        className={`text-heading font-bold leading-none ${
          tone === "maroon" ? "text-maroon" : "text-yellow"
        }`}
      >
        {value}
      </span>
      <span className="mt-[8.5px] whitespace-pre-line text-center text-micro leading-[11px] text-gray">
        {caption}
      </span>
    </div>
  );
}

export default function SplitStat({
  left,
  right,
}: {
  left: SplitStatHalf;
  right: SplitStatHalf;
}) {
  return (
    <div className="flex h-[82px] flex-1 rounded-lg border border-[color:var(--color-gray)]/20">
      <Half {...left} />
      <div className="my-[16px] w-px bg-[color:var(--color-gray)]/20" />
      <Half {...right} />
    </div>
  );
}
