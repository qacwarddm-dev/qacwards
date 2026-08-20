import VisuallyHidden from "./VisuallyHidden";

const SIZES = { 16: "h-4 w-4 border-2", 20: "h-5 w-5 border-2", 24: "h-6 w-6 border-[3px]" } as const;

/** Inline loading indicator. `label` is required — a spinner with no text is
 *  meaningless to a screen reader. */
export default function Spinner({
  size = 20,
  label = "Loading",
}: {
  size?: 16 | 20 | 24;
  label?: string;
}) {
  return (
    <span
      role="status"
      className={`inline-block animate-spin rounded-full border-[color:var(--color-gray)]/30 border-t-maroon ${SIZES[size]}`}
    >
      <VisuallyHidden>{label}</VisuallyHidden>
    </span>
  );
}
