export default function ReadinessBar({
  percent,
  size = "table",
}: {
  percent: number;
  size?: "table" | "heading";
}) {
  return (
    <span className="inline-flex items-center gap-[10px]">
      <span className="h-[8px] w-[140px] shrink-0 rounded-full bg-surface">
        <span className="block h-full rounded-full bg-yellow" style={{ width: `${percent}%` }} />
      </span>
      <span
        className={
          size === "heading"
            ? "text-subheading font-semibold leading-none text-black"
            : "font-semibold"
        }
      >
        {percent}%
      </span>
    </span>
  );
}
