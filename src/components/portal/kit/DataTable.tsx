import Link from "next/link";
import SearchField from "./SearchField";

export type Column = {
  key: string;
  header: string;
  /** Tailwind width/flex class for the column, e.g. "w-[180px]" or "flex-1". */
  width?: string;
  align?: "left" | "center";
};

export type Row = {
  id: string;
  cells: Record<string, React.ReactNode>;
  /** Rendered full-width underneath the row — the assignment stepper. */
  detail?: React.ReactNode;
  /** Makes the row a link to this href (the evaluation list drills in). */
  href?: string;
};

export type DataTableSearch = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
};

/** Href-based, matching the rest of this codebase's URL-as-state convention
 *  (`/portal/submission`, `/portal/activity`) — Prev/Next are links, not a
 *  client callback, so the page stays a plain server-rendered fetch. Omit a
 *  side entirely (rather than passing an href) to hide it, and pass a falsy
 *  href to render it disabled — the two read differently to a keyboard user. */
export type DataTablePagination = {
  prevHref?: string;
  nextHref?: string;
  prevLabel?: string;
  nextLabel?: string;
};

/**
 * Grey-headed table used on Assignment and Reports. Rows are divided by a hair
 * line; a row may carry an expanded `detail` block beneath it.
 *
 * `outlined` is the program_representative dashboard's variant: the whole table
 * is wrapped in a rounded hairline and the rows are shorter (39px rather than
 * 58px). Those two always travel together in the frames, so they are one prop
 * rather than two.
 *
 * `search` and `pagination` are §8.2/§8.3: added once here, in B4, so the four
 * screens that need them (documents, assignments, evaluations, activity —
 * every list backed by a table that only grows) share one implementation
 * instead of each hand-rolling its own. Both are presentational only — the
 * caller owns the actual query (search runs through RLS with a `pg_trgm`
 * index behind it, never a client-side filter over a full table; pagination
 * is keyset, `(created_at, id)`, never `OFFSET` — see the migration comment on
 * `profiles_name_trgm_idx` and `getActivity()` in `src/lib/activity.ts`).
 */
export default function DataTable({
  columns,
  rows,
  leading,
  variant = "plain",
  bodyRowH,
  search,
  pagination,
}: {
  columns: Column[];
  rows: Row[];
  /** Optional fixed-width gutter at the row start (the assignment toggle). */
  leading?: (row: Row) => React.ReactNode;
  variant?: "plain" | "outlined";
  /** Fixed body-row height, e.g. "h-[47px]" — the create-assignment eligible-
   *  accreditors rows sit tighter than the default `py-[19px]` because each
   *  carries an Assign button. The grey header keeps the default height. */
  bodyRowH?: string;
  /** Search box above the table. Controlled — DataTable only renders it. */
  search?: DataTableSearch;
  /** Prev/Next below the table. */
  pagination?: DataTablePagination;
}) {
  const outlined = variant === "outlined";
  const rowH = outlined ? "h-[39px]" : "py-[19px]";
  const bodyH = bodyRowH ?? rowH;
  // The outlined variant sets header and body at the same 12px; the plain one
  // steps 20 -> 15. Measured off both roles' frames.
  const headText = outlined ? "text-regular" : "text-heading";
  const bodyText = outlined ? "text-regular" : "text-subheading";
  const cell = (c: Column) =>
    `${c.width ?? "flex-1"} ${c.align === "left" ? "text-left" : "text-center"} whitespace-nowrap px-[4px]`;

  // No overflow-hidden here: an expanded row's stepper labels overhang the
  // table's edges by design, and clipping them cut "Assigned" in half.
  return (
    <div>
      {search && (
        <div className="mb-[14px] w-full max-w-[360px]">
          <SearchField
            value={search.value}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => search.onChange(e.target.value)}
            label={search.label ?? "Search"}
            placeholder={search.placeholder}
            className="w-full"
          />
        </div>
      )}

      <div
        className={
          outlined
            ? "overflow-hidden rounded-[10px] border border-[color:var(--color-gray)]/25"
            : ""
        }
      >
      <div
        className={`flex items-center bg-[color:var(--color-gray)]/12 leading-none text-gray ${headText} ${rowH} ${
          outlined ? "" : "rounded-lg"
        }`}
      >
        {leading && <span className="w-[56px] shrink-0" />}
        {columns.map((c) => (
          <span key={c.key} className={cell(c)}>
            {c.header}
          </span>
        ))}
      </div>

      {rows.map((row, i) => (
        <div
          key={row.id}
          className={`bg-white ${
            outlined
              ? i < rows.length - 1
                ? "border-b border-[color:var(--color-gray)]/20"
                : ""
              : "border-b border-[color:var(--color-gray)]/20"
          }`}
        >
          {(() => {
            const inner = (
              <>
                {leading && (
                  <span className="w-[56px] shrink-0 pl-[24px]">{leading(row)}</span>
                )}
                {columns.map((c) => (
                  <span key={c.key} className={cell(c)}>
                    {row.cells[c.key]}
                  </span>
                ))}
              </>
            );
            const rowClass = `flex items-center leading-none text-black ${bodyText} ${bodyH}`;
            return row.href ? (
              <Link href={row.href} className={`${rowClass} transition-colors hover:bg-surface/50`}>
                {inner}
              </Link>
            ) : (
              <div className={rowClass}>{inner}</div>
            );
          })()}
          {row.detail}
        </div>
      ))}
      </div>

      {pagination && (pagination.prevHref !== undefined || pagination.nextHref !== undefined) && (
        <div className="mt-[18px] flex items-center justify-center gap-[24px]">
          {pagination.prevHref !== undefined &&
            (pagination.prevHref ? (
              <Link
                href={pagination.prevHref}
                className="text-subheading font-semibold text-maroon transition-opacity hover:opacity-70"
              >
                {pagination.prevLabel ?? "Newer"}
              </Link>
            ) : (
              <span className="text-subheading font-semibold text-gray/50">
                {pagination.prevLabel ?? "Newer"}
              </span>
            ))}
          {pagination.nextHref !== undefined &&
            (pagination.nextHref ? (
              <Link
                href={pagination.nextHref}
                className="text-subheading font-semibold text-maroon transition-opacity hover:opacity-70"
              >
                {pagination.nextLabel ?? "Older"}
              </Link>
            ) : (
              <span className="text-subheading font-semibold text-gray/50">
                {pagination.nextLabel ?? "Older"}
              </span>
            ))}
        </div>
      )}
    </div>
  );
}
