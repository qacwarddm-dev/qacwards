"use client";

import { usePathname } from "next/navigation";
import { PORTAL_USERS } from "./data";
import { PORTAL_NAV, type PortalUser } from "./portal-nav";

/**
 * Dev-only control for previewing the portal as each role. Pairs with the
 * route handler at /portal/dev/switch, which sets the cookie getCurrentUser()
 * reads.
 *
 * **Not a feature, and never an auth mechanism.** It is styled to look like a
 * debug tool on purpose — dashed rule, monospace, lowercase — so it cannot be
 * mistaken for product UI, and it is deliberately the one thing in the portal
 * that does not follow design/figma-tokens.md's type scale. Removing it is
 * three deletions: this file, the route handler, and one line in PortalTopBar.
 *
 * `process.env.NODE_ENV` is inlined at build time, so the whole component is
 * dead code in a production build.
 *
 * Absolutely positioned in the top bar's empty middle so it contributes no
 * layout — the twelve confirmed qac_personnel screens measure identically with
 * it present. Screenshot scripts hide it with `[data-dev-switcher]`.
 */
export default function DevUserSwitcher({ user }: { user: PortalUser }) {
  const pathname = usePathname();

  if (process.env.NODE_ENV === "production") return null;

  return (
    <details
      data-dev-switcher
      className="group absolute top-1/2 left-1/2 z-50 -translate-x-1/2 -translate-y-1/2 font-mono"
    >
      <summary className="cursor-pointer list-none rounded-sm border border-dashed border-yellow/70 px-[7px] py-[2px] text-[9px] leading-[14px] tracking-wide text-yellow marker:hidden hover:bg-yellow/10">
        dev · preview as {user.role}
      </summary>

      <div className="absolute top-[calc(100%+6px)] left-1/2 w-[268px] -translate-x-1/2 rounded-sm border border-dashed border-gray bg-white p-[10px] text-black shadow-card">
        <p className="text-[9px] leading-[13px] tracking-wide text-gray">
          Dev preview only. Sets a cookie, grants nothing — there is no auth in
          this phase.
        </p>

        <ul className="mt-[8px] flex flex-col gap-[3px]">
          {Object.entries(PORTAL_USERS).map(([key, candidate]) => {
            const navCount = PORTAL_NAV[candidate.role]?.length ?? 0;
            const current = key === user.role;

            return (
              <li key={key}>
                <a
                  href={`/portal/dev/switch?as=${key}&next=${encodeURIComponent(pathname)}`}
                  aria-current={current ? "true" : undefined}
                  className={`block rounded-sm px-[6px] py-[4px] text-[10px] leading-[14px] hover:bg-gray/15 ${
                    current ? "bg-gray/15 font-bold" : ""
                  }`}
                >
                  {current ? "▸ " : "  "}
                  {key}
                  <span className="block pl-[12px] text-[9px] leading-[12px] text-gray">
                    {navCount > 0
                      ? `sidebar: ${navCount} items`
                      : "sidebar empty by design — frames not built yet"}
                  </span>
                </a>
              </li>
            );
          })}
        </ul>

        <p className="mt-[8px] border-t border-dashed border-gray/50 pt-[6px] text-[9px] leading-[12px] text-gray">
          qac_admin is out of scope this phase, so it has no fake user.
          Pages themselves are still qac_personnel&apos;s until each role&apos;s
          frames are built.
        </p>
      </div>
    </details>
  );
}
