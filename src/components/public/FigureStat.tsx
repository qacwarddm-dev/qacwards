type Props = {
  value: string;
  label: string;
  caption?: string;
  size?: "lg" | "md";
  onDark?: boolean;
};

/**
 * A headline figure. Used by the campuses stat band ("6 REGIONS / 24 CAMPUSES")
 * and the accreditation level counts, which had shipped as two unrelated
 * one-offs — `text-[96px] md:text-[150px]` on one page and a `text-[120px]`
 * numeral over a 20%-opacity building photo on the other.
 *
 * The numeral is tabular so a column of counts aligns, and its size is a clamp
 * between --text-title and the prototype's measured maximum, so it no longer
 * overflows a 360px viewport.
 */
export function FigureStat({
  value,
  label,
  caption,
  size = "lg",
  onDark = false,
}: Props) {
  return (
    <div className="flex flex-col items-center text-center">
      <span
        className={`${size === "lg" ? "t-numeral" : "t-numeral-sm"} ${
          onDark ? "text-yellow" : "text-maroon"
        }`}
      >
        {value}
      </span>
      <span
        aria-hidden
        className={`mt-5 h-px w-10 ${onDark ? "bg-yellow/50" : "bg-maroon/30"}`}
      />
      <span
        className={`t-h3 mt-4 uppercase ${onDark ? "text-white" : "text-black"}`}
      >
        {label}
      </span>
      {caption ? (
        <span className={`t-sm mt-2 ${onDark ? "text-white/70" : "text-black/70"}`}>
          {caption}
        </span>
      ) : null}
    </div>
  );
}
