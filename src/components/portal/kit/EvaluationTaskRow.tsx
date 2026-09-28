import StatusPill from "./StatusPill";
import type { StatusKey } from "./status";

export default function EvaluationTaskRow({
  badge,
  title,
  meta,
  done = false,
  status,
  action,
  index = 0,
}: {
  badge: string;
  title: string;
  meta: string;
  done?: boolean;
  status?: StatusKey;
  action: React.ReactNode;
  index?: number;
}) {
  return (
    <div
      className="flex animate-[rise-in_var(--motion-slow)_var(--ease-out)_both] flex-wrap items-center gap-x-[14px] gap-y-[10px] rounded-[14px] border border-[color:var(--hairline)] bg-white px-[16px] py-[14px]"
      style={{ animationDelay: `${index * 70}ms` }}
    >
      <span
        aria-hidden
        className={`flex h-[36px] w-[36px] shrink-0 items-center justify-center rounded-[8px] text-small font-bold text-black ${
          done ? "bg-[color:var(--tint-approved)]" : "bg-[color:var(--tint-yellow)]"
        }`}
      >
        {badge}
      </span>
      <div className="min-w-0 flex-1 basis-[180px]">
        <p className="text-subheading font-semibold leading-snug text-black">{title}</p>
        <p className="mt-[2px] text-regular text-black/70">{meta}</p>
      </div>
      <div className="ml-auto flex shrink-0 items-center gap-[10px]">
        {status && <StatusPill status={status} />}
        {action}
      </div>
    </div>
  );
}
