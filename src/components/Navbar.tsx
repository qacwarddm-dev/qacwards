"use client";

import {
  ChevronDown,
  ChevronRight,
  CircleUserRound,
  Menu,
  X,
} from "lucide-react";
import Link from "next/link";
import BrandLockup from "@/components/BrandLockup";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type NavLink = {
  label: string;
  href: string;
  children?: { label: string; href: string }[];
};

const NAV_LINKS: NavLink[] = [
  { label: "Home", href: "/" },
  {
    label: "About",
    href: "/about",
    children: [
      { label: "About", href: "/about" },
      { label: "Campuses", href: "/about/campuses" },
      { label: "Degree Programs", href: "/about/degree-programs" },
    ],
  },
  { label: "Gov. Recognitions", href: "/gov-recognitions" },
  { label: "Accreditations", href: "/accreditations" },
];

function isActive(pathname: string, link: NavLink) {
  if (link.href === "/") return pathname === "/";
  return pathname === link.href || pathname.startsWith(`${link.href}/`);
}

export default function Navbar() {
  const pathname = usePathname();
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Route change closes whatever the previous page left open. Reset during
  // render (not an effect) so the closed state is what the same commit paints.
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    setOpenDropdown(null);
    setMobileOpen(false);
  }

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!dropdownRef.current?.contains(event.target as Node)) {
        setOpenDropdown(null);
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpenDropdown(null);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  return (
    <header className="sticky top-0 z-50 bg-white">
      {/* Height is pinned, not derived from the lockup: the auth screens reserve
          exactly 80px for this bar (`auth-scale`, globals.css), so the lockup
          shrinking from a 56px seal to the portal's 45 must not move it. */}
      <nav className="flex h-[80px] items-center justify-between gap-4 px-6">
        {/* brand-lockup carries the scale, not BrandLockup itself — the portal
            top bar gets the same growth for free from the shell it sits in. */}
        <Link href="/" className="brand-lockup flex min-w-0 items-center">
          <BrandLockup tone="maroon" />
        </Link>

        <div className="flex items-center gap-6 lg:gap-10">
          <div ref={dropdownRef} className="hidden items-center gap-1 lg:flex">
            {NAV_LINKS.map((link) => {
              const active = isActive(pathname, link);
              const pill = active
                ? "bg-maroon text-white"
                : "text-maroon/50 hover:text-maroon";

              if (!link.children) {
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`rounded-lg px-4 py-2 text-subheading transition-colors ${pill}`}
                  >
                    {link.label}
                  </Link>
                );
              }

              const menuId = `nav-menu-${link.label}`;
              const isOpen = openDropdown === link.label;
              return (
                <div key={link.href} className="relative">
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    aria-haspopup="menu"
                    aria-controls={menuId}
                    onKeyDown={(e) => {
                      if (e.key === "ArrowDown") {
                        e.preventDefault();
                        setOpenDropdown(link.label);
                        requestAnimationFrame(() =>
                          document
                            .getElementById(menuId)
                            ?.querySelector<HTMLElement>("[role=menuitem]")
                            ?.focus(),
                        );
                      }
                    }}
                    onClick={() =>
                      setOpenDropdown((open) =>
                        open === link.label ? null : link.label,
                      )
                    }
                    className={`flex items-center gap-1 rounded-lg px-4 py-2 text-subheading transition-colors ${pill}`}
                  >
                    {link.label}
                    <ChevronDown
                      className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
                    />
                  </button>

                  {isOpen && (
                    <div
                      id={menuId}
                      role="menu"
                      aria-label={link.label}
                      onKeyDown={(e) => {
                        const items = Array.from(
                          e.currentTarget.querySelectorAll<HTMLElement>("[role=menuitem]"),
                        );
                        const idx = items.indexOf(document.activeElement as HTMLElement);
                        if (e.key === "ArrowDown") {
                          e.preventDefault();
                          items[(idx + 1) % items.length]?.focus();
                        } else if (e.key === "ArrowUp") {
                          e.preventDefault();
                          items[(idx - 1 + items.length) % items.length]?.focus();
                        } else if (e.key === "Tab") {
                          setOpenDropdown(null);
                        }
                      }}
                      className="absolute left-0 top-full mt-2 w-[254px] rounded-[20px] bg-white p-[10px] shadow-lg"
                    >
                      {link.children.map((child) => (
                        <Link
                          key={child.href}
                          href={child.href}
                          role="menuitem"
                          className="group flex h-[38px] items-center justify-between rounded pl-5 pr-2 text-subheading text-maroon transition-colors hover:bg-gray/15 hover:font-bold"
                        >
                          {child.label}
                          <ChevronRight
                            className="h-5 w-5 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                            aria-hidden
                          />
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/login"
              aria-label="Log in"
              className="rounded-full p-1 text-black/60 transition-colors hover:text-black"
            >
              <CircleUserRound className="h-8 w-8" strokeWidth={1.5} />
            </Link>

            <button
              type="button"
              aria-label="Toggle navigation"
              aria-expanded={mobileOpen}
              aria-controls="mobile-nav-menu"
              onClick={() => setMobileOpen((open) => !open)}
              className="rounded-full p-1 text-maroon/60 transition-colors hover:text-maroon lg:hidden"
            >
              {mobileOpen ? (
                <X className="h-8 w-8" strokeWidth={1.5} />
              ) : (
                <Menu className="h-8 w-8" strokeWidth={1.5} />
              )}
            </button>
          </div>
        </div>
      </nav>

      {mobileOpen && (
        <div id="mobile-nav-menu" className="border-t border-gray/20 bg-white px-4 pb-4 sm:px-6 lg:hidden">
          {NAV_LINKS.map((link) => (
            <div key={link.href} className="py-1">
              <Link
                href={link.href}
                className={`block rounded-lg px-4 py-2 text-subheading transition-colors ${
                  isActive(pathname, link)
                    ? "bg-maroon text-white"
                    : "text-maroon/50 hover:text-maroon"
                }`}
              >
                {link.label}
              </Link>
              {link.children?.map((child) => (
                <Link
                  key={child.href}
                  href={child.href}
                  className="block rounded px-8 py-2 text-subheading text-maroon transition-colors hover:bg-gray/15 hover:font-bold"
                >
                  {child.label}
                </Link>
              ))}
            </div>
          ))}
        </div>
      )}
    </header>
  );
}
