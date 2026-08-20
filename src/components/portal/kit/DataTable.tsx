import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import Link from "next/link";
import { Fragment } from "react";
import SearchField from "./SearchField";
import Skeleton from "./Skeleton";

export type Column = {
  key: string;
  header: string;
  /** Tailwind width/flex class for the column, e.g. "w-[180px]" or "flex-1". */
  width?: string;
  align?: "left" | "center";
  sortable?: boolean;
  /** Hide this column below the given breakpoint instead of stacking it. */
  hideBelow?: "sm" | "md" | "lg";
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

export type DataTableSort = { key: string; dir: "asc" | "desc"; onChange: (key: string) => void };

/**
 * Grey-headed table used on Assignment and Reports. Rows are divided by a hair
 * line; a row may carry an expanded `detail` block beneath it.
 *
 * A real `<table>` (09b §9's definition of done for a rewritten kit
 * component): `<caption>`, `<th scope="col">`, optional sort, and built-in
 * `empty`/`loading` slots. The header/body cells keep exactly the layout
 * classes they always had (`flex-1`, `w-[Npx]`…) — a flex container blockifies
 * its `<td>`/`<th>` children per the CSS Display spec, so `display: flex` on
 * `<tr>` lays out real table cells the same way it laid out the old `<div>`s.
 * That is what let this rewrite land with the same visual output at every
 * existing call site while gaining real semantics.
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
  caption,
  columns,
  rows,
  leading,
  variant = "plain",
  bodyRowH,
  search,
  pagination,
  sort,
  empty,
  loading,
  stackAt = "never",
  stickyHeader,
}: {
  /** Screen-reader table name. Visually hidden — the visible title is the
   *  page's own heading. Falls back to a generic label for callers mid-
   *  migration that have not passed one yet. */
  caption?: string;
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
  /** Column sort. Only columns with `sortable: true` render the toggle. */
  sort?: DataTableSort;
  /** Rendered instead of the body when `rows` is empty. */
  empty?: React.ReactNode;
  /** Renders skeleton rows instead of `rows` while true. */
  loading?: boolean;
  /** Below this breakpoint, each row renders as a stacked definition card
   *  instead of a table row — off by default so existing callers are unaffected. */
  stackAt?: "sm" | "md" | "never";
  stickyHeader?: boolean;
}) {
  const outlined = variant === "outlined";
  const rowH = outlined ? "h-[39px]" : "py-[19px]";
  const bodyH = bodyRowH ?? rowH;
  // The outlined variant sets header and body at the same 12px; the plain one
  // steps 20 -> 15. Measured off both roles' frames.
  const headText = outlined ? "text-regular" : "text-heading";
  const bodyText = outlined ? "text-regular" : "text-subheading";
  const cell = (c: Column) =>
    `${c.width ?? "flex-1"} ${c.align === "left" ? "text-left" : "text-center"} whitespace-nowrap px-[4px] ${
      c.hideBelow ? `hidden ${c.hideBelow}:block` : ""
    }`;
  const stackClass =
    stackAt === "never" ? "" : stackAt === "sm" ? "max-sm:hidden" : "max-md:hidden";
  const cardStackClass =
    stackAt === "never" ? "hidden" : stackAt === "sm" ? "sm:hidden" : "md:hidden";

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

      {/* Stacked card fallback below stackAt — one definition card per row. */}
      {stackAt !== "never" && (
        <div className={`${cardStackClass} flex flex-col gap-[12px]`}>
          {rows.length === 0 && !loading && empty}
          {(loading ? rows.slice(0, 3) : rows).map((row) => (
            <div
              key={row.id}
              className="rounded-[var(--radius-md)] border border-[color:var(--color-gray)]/20 bg-white p-[16px]"
            >
              {columns.map((c) => (
                <div key={c.key} className="flex items-baseline justify-between gap-3 py-[4px]">
                  <span className="t-eyebrow text-gray">{c.header}</span>
                  <span className="t-body-strong text-right text-black">
                    {loading ? <Skeleton w={80} h={12} /> : row.cells[c.key]}
                  </span>
                </div>
              ))}
              {row.detail}
            </div>
          ))}
        </div>
      )}

      <div className={stackAt === "never" ? "" : `${stackClass}`}>
        <div
          className={
            outlined
              ? "overflow-x-auto rounded-[10px] border border-[color:var(--color-gray)]/25"
              : "overflow-x-auto"
          }
        >
          <table className="w-full border-collapse">
            <caption className="sr-only">{caption ?? "Data table"}</caption>
            <thead
              className={stickyHeader ? "sticky top-0 z-10 bg-white" : undefined}
            >
              <tr
                className={`flex items-center bg-[color:var(--color-gray)]/12 leading-none text-gray ${headText} ${rowH} ${
                  outlined ? "" : "rounded-lg"
                }`}
              >
                {leading && <th scope="col" className="w-[56px] shrink-0" />}
                {columns.map((c) => (
                  <th key={c.key} scope="col" className={cell(c)}>
                    {c.sortable && sort ? (
                      <button
                        type="button"
                        onClick={() => sort.onChange(c.key)}
                        className="inline-flex items-center gap-1 hover:text-black"
                      >
                        {c.header}
                        {sort.key === c.key ? (
                          sort.dir === "asc" ? (
                            <ArrowUp className="h-3 w-3" aria-hidden />
                          ) : (
                            <ArrowDown className="h-3 w-3" aria-hidden />
                          )
                        ) : (
                          <ArrowUpDown className="h-3 w-3 opacity-40" aria-hidden />
                        )}
                      </button>
                    ) : (
                      c.header
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading &&
                Array.from({ length: 4 }, (_, i) => (
                  <tr key={i} className={`flex items-center bg-white ${bodyH}`}>
                    {columns.map((c) => (
                      <td key={c.key} className={cell(c)}>
                        <Skeleton h={12} />
                      </td>
                    ))}
                  </tr>
                ))}

              {!loading &&
                rows.map((row, i) => {
                  const rowClass = `relative flex items-center leading-none text-black ${bodyText} ${bodyH} ${
                    outlined
                      ? i < rows.length - 1
                        ? "border-b border-[color:var(--color-gray)]/20"
                        : ""
                      : "border-b border-[color:var(--color-gray)]/20"
                  } ${row.href ? "transition-colors hover:bg-surface/50" : ""}`;
                  return (
                    <Fragment key={row.id}>
                      <tr className={rowClass}>
                        {leading && (
                          <td className="w-[56px] shrink-0 pl-[24px]">{leading(row)}</td>
                        )}
                        {columns.map((c, ci) => (
                          <td key={c.key} className={cell(c)}>
                            {/* A <tr> can't be an <a>; the link stretches over the row
                                from the first cell instead (the row itself carries
                                `relative`), so the whole row is one click target and
                                one keyboard stop. */}
                            {row.href && ci === 0 && (
                              <Link
                                href={row.href}
                                className="absolute inset-0"
                                aria-label={caption ? `Open ${caption} row` : "Open row"}
                              />
                            )}
                            {row.cells[c.key]}
                          </td>
                        ))}
                      </tr>
                      {row.detail && (
                        <tr>
                          <td colSpan={columns.length + (leading ? 1 : 0)}>{row.detail}</td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}

              {!loading && rows.length === 0 && empty && (
                <tr>
                  <td colSpan={columns.length + (leading ? 1 : 0)} className="py-[32px] text-center">
                    {empty}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
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
