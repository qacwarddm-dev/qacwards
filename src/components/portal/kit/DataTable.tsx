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
};

/**
 * Grey-headed table used on Assignment and Reports. Rows are divided by a hair
 * line; a row may carry an expanded `detail` block beneath it.
 */
export default function DataTable({
  columns,
  rows,
  leading,
}: {
  columns: Column[];
  rows: Row[];
  /** Optional fixed-width gutter at the row start (the assignment toggle). */
  leading?: (row: Row) => React.ReactNode;
}) {
  const cell = (c: Column) =>
    `${c.width ?? "flex-1"} ${c.align === "left" ? "text-left" : "text-center"} whitespace-nowrap px-[4px]`;

  // No overflow-hidden here: an expanded row's stepper labels overhang the
  // table's edges by design, and clipping them cut "Assigned" in half.
  return (
    <div>
      <div className="flex items-center rounded-lg bg-[color:var(--color-gray)]/12 py-[19px] text-heading leading-none text-gray">
        {leading && <span className="w-[56px] shrink-0" />}
        {columns.map((c) => (
          <span key={c.key} className={cell(c)}>
            {c.header}
          </span>
        ))}
      </div>

      {rows.map((row) => (
        <div key={row.id} className="border-b border-[color:var(--color-gray)]/20 bg-white">
          <div className="flex items-center py-[19px] text-subheading leading-none text-black">
            {leading && <span className="w-[56px] shrink-0 pl-[24px]">{leading(row)}</span>}
            {columns.map((c) => (
              <span key={c.key} className={cell(c)}>
                {row.cells[c.key]}
              </span>
            ))}
          </div>
          {row.detail}
        </div>
      ))}
    </div>
  );
}
