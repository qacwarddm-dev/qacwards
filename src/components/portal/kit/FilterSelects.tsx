export type SelectFilter = {
  /** Also the accessible name; the first option reads "All <label>" unless `all` is given. */
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  all?: string;
};

/** Distinct, sorted options built from the values on screen. */
export const optionsOf = (values: (string | null | undefined)[]) =>
  [...new Set(values.filter((v): v is string => Boolean(v)))].sort((a, b) => a.localeCompare(b)).map((v) => ({ value: v, label: v }));

/** The filter dropdowns that sit beside a SearchBox. Every search bar carries at least one. */
export default function FilterSelects({ filters }: { filters: SelectFilter[] }) {
  return (
    <>
      {filters.map((f) => (
        <select key={f.label} className="inp" aria-label={f.label} value={f.value} onChange={(e) => f.onChange(e.target.value)}>
          <option value="all">{f.all ?? `All ${f.label.toLowerCase()}`}</option>
          {f.options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      ))}
    </>
  );
}
