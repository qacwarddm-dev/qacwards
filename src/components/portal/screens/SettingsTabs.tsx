"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * Section switcher for `/portal/settings`.
 *
 * There is no Figma for Settings — assets/FIGMA/qac_admin/ is empty and decision
 * 16 says these screens are designed against the existing kit. So this borrows
 * the portal's established vocabulary rather than inventing one: maroon fill for
 * the active pill, the same `rounded-full` + `text-subheading` the kit `Button`
 * uses, and `shadow-card` on the strip like every other panel.
 *
 * `DocTabs` was the other candidate and was deliberately not reused. It is the
 * layered folder-leaf shape traced off the Documents frames, hard-coded to a
 * 1000px panel and an S-curve measured row by row — reusing it here would mean
 * bending a very specific piece of artwork to a screen it was never drawn for.
 */
const TABS = [
  { href: "/portal/settings/cycles", label: "Accreditation Cycles" },
  { href: "/portal/settings/reps", label: "Program Representatives" },
  { href: "/portal/settings/programs", label: "Program Management" },
  { href: "/portal/settings/users", label: "Users" },
];

export default function SettingsTabs() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-[8px] rounded-full bg-white p-[6px] shadow-card">
      {TABS.map((tab) => {
        const active = pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex h-[35px] items-center rounded-full px-[16px] text-subheading font-semibold leading-none transition-opacity hover:opacity-90 ${
              active ? "bg-maroon text-white" : "text-gray"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
