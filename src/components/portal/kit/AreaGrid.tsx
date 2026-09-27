import ProgressRow from "./ProgressRow";
import RowList from "./RowList";

export type AreaGridItem = {
  id: string;
  label: string;
  href: string;
  percent?: number;
};

export default function AreaGrid({ areas }: { areas: AreaGridItem[] }) {
  const half = Math.ceil(areas.length / 2);

  return (
    <div className="flex flex-col gap-[24px] lg:flex-row">
      {[areas.slice(0, half), areas.slice(half)].map((col, i) => (
        <div key={i} className="min-w-0 flex-1">
          <RowList>
            {col.map((area) => (
              <ProgressRow
                key={area.id}
                label={area.label}
                marker={false}
                percent={area.percent}
                href={area.href}
              />
            ))}
          </RowList>
        </div>
      ))}
    </div>
  );
}
