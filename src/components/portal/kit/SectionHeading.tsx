import type { LucideIcon } from "lucide-react";

/** Maroon icon + uppercase label ("ACCOUNT ACCESS", "PERSONAL DETAILS"). */
export default function SectionHeading({
  icon: Icon,
  children,
}: {
  icon: LucideIcon;
  children: React.ReactNode;
}) {
  return (
    <h2 className="flex items-center gap-[14px] text-heading font-bold leading-none text-maroon">
      <Icon className="h-[24px] w-[24px] shrink-0" strokeWidth={2} aria-hidden />
      {children}
    </h2>
  );
}
