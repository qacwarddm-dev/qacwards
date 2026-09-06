"use client";

/**
 * The accreditor specialty chooser — round 2 §3.
 *
 * In the kit because §3 is explicitly two surfaces on one field: the accreditor
 * editing their own Profile, and QAC Admin editing theirs from User Management.
 * The two must offer the same list and the same wording, so they share the
 * component and pass their own data into it.
 *
 * Chips rather than a multi-select `<select multiple>`: the list is ~20 areas
 * and an accreditor typically holds two or three, so what matters is seeing the
 * held ones at a glance. Each chip is a real checkbox underneath, so the whole
 * group is keyboard-reachable and announces its state without any ARIA of its
 * own.
 */
export default function ExpertisePicker({
  areas,
  selected,
  onChange,
  disabled = false,
  legend = "Discipline Expertise",
}: {
  areas: { id: string; name: string }[];
  selected: string[];
  onChange: (next: string[]) => void;
  disabled?: boolean;
  legend?: string;
}) {
  const held = new Set(selected);

  function toggle(id: string) {
    const next = new Set(held);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onChange([...next]);
  }

  if (areas.length === 0) {
    return <p className="t-sm text-gray">No expertise areas are on file yet.</p>;
  }

  return (
    <fieldset disabled={disabled} className="min-w-0">
      <legend className="t-sm font-semibold text-black">{legend}</legend>
      <div className="mt-[10px] flex flex-wrap gap-[8px]">
        {areas.map((area) => {
          const on = held.has(area.id);
          return (
            <label
              key={area.id}
              className={`inline-flex cursor-pointer items-center rounded-full border px-[12px] py-[6px] text-regular leading-none transition-colors ${
                on
                  ? "border-maroon bg-maroon text-white"
                  : "border-[color:var(--color-gray)]/40 bg-white text-black"
              } ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
            >
              <input
                type="checkbox"
                checked={on}
                onChange={() => toggle(area.id)}
                className="sr-only"
              />
              {area.name}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
