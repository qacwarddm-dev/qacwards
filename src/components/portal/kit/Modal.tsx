import { X } from "lucide-react";
import Link from "next/link";
import Card from "./Card";

/**
 * Full-screen dialog overlay — internal_accreditor/02.1-Accept-Modal.png and
 * program_representative/07.6-Requirements-modal.png share this shell.
 *
 * Modal state is a URL query param, not component state (every other overlay
 * in the kit is a `Link`-driven route), so `closeHref` closes the dialog by
 * navigating back rather than by an `onClick` handler. Omitting it drops the
 * corner ✕ and centers the title, matching the Accept Confirmation frame,
 * which has no close affordance at all.
 */
export default function Modal({
  title,
  closeHref,
  className = "w-[430px]",
  children,
}: {
  title: string;
  closeHref?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/45 px-[20px]">
      <Card radius={16} className={`p-[28px] ${className}`}>
        <div className={`flex items-center ${closeHref ? "justify-between" : "justify-center"}`}>
          <h2 className="text-heading font-bold leading-none text-black">{title}</h2>
          {closeHref && (
            <Link
              href={closeHref}
              aria-label="Close"
              className="text-black transition-opacity hover:opacity-60"
            >
              <X className="h-[18px] w-[18px]" strokeWidth={2} aria-hidden />
            </Link>
          )}
        </div>
        <div className="mt-[20px]">{children}</div>
      </Card>
    </div>
  );
}
