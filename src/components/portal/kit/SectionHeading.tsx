import type { LucideIcon } from "lucide-react";

/**
 * Maroon icon + uppercase label ("ACCOUNT ACCESS", "PERSONAL DETAILS").
 * 15px, not 20: the frame's whole lockup measures 176.5px wide including the
 * icon, which leaves ~138 for the text — and at 20px it overflowed the 260px
 * ACCOUNT ACCESS card by a single pixel and wrapped.
 */
export default function SectionHeading({
  icon: Icon,
  children,
}: {
  icon: LucideIcon;
  children: React.ReactNode;
}) {
  return (
    <h2 className="flex h-[18px] items-center gap-[10px] text-subheading font-bold leading-none text-maroon">
      <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={2} aria-hidden />
      {children}
    </h2>
  );
}
