/**
 * Bordered, rounded container for a stack of `ProgressRow`s — the Levels,
 * Phases and Requirements lists on the Submissions screens.
 *
 * 10.5px of vertical padding is not a typo: the frames put four 57px rows in a
 * 249px box, and half-pixels are how Figma's auto-layout landed.
 */
export default function RowList({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-[color:var(--color-gray)]/20 py-[10.5px]">
      {children}
    </div>
  );
}
