import { AlertTriangle, Lock, SearchX } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Image from "next/image";
import Button from "./Button";

type Variant = "empty" | "no-results" | "error" | "locked";

const VARIANT_ICON: Partial<Record<Variant, LucideIcon>> = {
  "no-results": SearchX,
  error: AlertTriangle,
  locked: Lock,
};

/**
 * Centred illustration or icon + message, with an optional action (09b §9).
 * `empty` keeps the original folder illustration; the other three variants
 * (an empty search, an error, and a locked/NDA-gated view — 09-ui-refactor
 * §4) render a plain icon instead, since the illustration is specific to
 * "nothing has been put here yet."
 *
 * No imposed top padding — the parent places it (the old `pt-[133px]` baked
 * in an assumption about the page around it that did not hold everywhere it
 * got reused).
 */
export default function EmptyState({
  variant = "empty",
  title,
  message,
  description,
  action,
  icon: Icon,
  size = "md",
}: {
  variant?: Variant;
  title?: string;
  /** @deprecated use `title` */
  message?: string;
  description?: string;
  action?: { label: string; onClick?: () => void; href?: string };
  icon?: LucideIcon;
  size?: "sm" | "md";
}) {
  const heading = title ?? message ?? "Nothing here yet.";
  const CustomIcon = Icon ?? VARIANT_ICON[variant];
  const imgSize = size === "sm" ? { w: 90, h: 78 } : { w: 145, h: 125 };

  return (
    <div className="flex flex-col items-center gap-[10px] py-[var(--space-8)] text-center">
      {variant === "empty" && !CustomIcon ? (
        <Image
          src="/assets/portal/empty-folder.png"
          alt=""
          width={290}
          height={250}
          style={{ width: imgSize.w, height: imgSize.h }}
          className="object-contain"
        />
      ) : (
        <span className="flex h-[64px] w-[64px] items-center justify-center rounded-full bg-[color:var(--color-gray)]/10 text-gray">
          {CustomIcon && <CustomIcon className="h-[28px] w-[28px]" strokeWidth={1.75} aria-hidden />}
        </span>
      )}
      <p className="text-subheading leading-none text-maroon">{heading}</p>
      {description && <p className="t-sm max-w-sm text-gray">{description}</p>}
      {action && (
        <Button
          variant="secondary"
          className="mt-[6px]"
          href={action.href}
          onClick={action.onClick}
        >
          {action.label}
        </Button>
      )}
    </div>
  );
}
