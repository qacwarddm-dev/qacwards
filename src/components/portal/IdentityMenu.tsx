"use client";

import { LogOut, Settings, User } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/browser";
import type { PortalUser } from "./portal-nav";

/**
 * Top bar identity block, opened as a menu (09-ui-refactor §5.1): Profile,
 * Settings (admin only), Log Out. Log Out used to sit at the bottom of the
 * sidebar, competing with navigation — it lives here now, next to the person
 * it signs out.
 *
 * Escape/click-away/focus-trap mirrors `NotificationBell`'s existing pattern
 * rather than a new generic `Popover` — the two are the only overlay triggers
 * in the top bar and neither justifies a shared abstraction yet.
 */
export default function IdentityMenu({
  user,
  children,
}: {
  user: PortalUser;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    menuRef.current?.querySelector<HTMLElement>("a,button")?.focus();
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  async function handleLogOut() {
    await createClient().auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="relative ml-[14px] flex items-center">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex items-center transition-opacity hover:opacity-85"
      >
        {children}
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-hidden
            tabIndex={-1}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-40 cursor-default"
          />
          <div
            ref={menuRef}
            role="menu"
            aria-label="Account"
            className="absolute right-0 top-[52px] z-50 w-[220px] overflow-hidden rounded-[10px] bg-white py-[8px] text-black shadow-[0_8px_28px_rgba(0,0,0,0.2)]"
          >
            <Link
              role="menuitem"
              href="/portal/profile"
              onClick={() => setOpen(false)}
              className="flex items-center gap-[10px] px-[18px] py-[10px] text-subheading transition-colors hover:bg-highlight"
            >
              <User className="h-[16px] w-[16px]" strokeWidth={1.75} aria-hidden />
              Profile
            </Link>
            {user.role === "qac_admin" && (
              <Link
                role="menuitem"
                href="/portal/settings"
                onClick={() => setOpen(false)}
                className="flex items-center gap-[10px] px-[18px] py-[10px] text-subheading transition-colors hover:bg-highlight"
              >
                <Settings className="h-[16px] w-[16px]" strokeWidth={1.75} aria-hidden />
                Settings
              </Link>
            )}
            <button
              type="button"
              role="menuitem"
              onClick={handleLogOut}
              className="flex w-full items-center gap-[10px] px-[18px] py-[10px] text-left text-subheading text-maroon transition-colors hover:bg-highlight"
            >
              <LogOut className="h-[16px] w-[16px]" strokeWidth={1.75} aria-hidden />
              Log Out
            </button>
          </div>
        </>
      )}
    </div>
  );
}
