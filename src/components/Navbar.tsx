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
  children?: { label: string; href: string; hint: string }[];
};

const NAV_LINKS: NavLink[] = [
  { label: "Home", href: "/" },
  {
    label: "About",
    href: "/about",
    children: [
      { label: "The Center", href: "/about", hint: "Mandate, goals and history" },
      { label: "Campuses", href: "/about/campuses", hint: "24 campuses, 6 regions" },
      {
        label: "Degree Programs",
        href: "/about/degree-programs",
        hint: "100 programs, 13 colleges",
      },
    ],
  },
  { label: "Gov. Recognitions", href: "/gov-recognitions" },
  { label: "Accreditations", href: "/accreditations" },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * Public top bar.
 *
 * Three things were dated or broken here and all three are fixed below.
 *
 * 1. **Contrast.** Inactive links were `text-maroon/50` — #800000 at 50% over
 *    white is ~2.9:1, under the 4.5:1 floor for 15px text. They are now near-
 *    black, which also stops every link reading as a de-emphasised version of
 *    the brand colour.
 * 2. **The active state was a solid maroon pill**, the single heaviest element
 *    in the bar and a 2015 idiom. It is now a gold underline against maroon
 *    type — the same keyline the heroes and section markers use — plus a real
 *    `aria-current="page"`, which was missing entirely.
 * 3. **The mobile menu was an inline block that pushed the page down**, with no
 *    Escape handler and no scroll lock. It is now a sheet with both.
 *
 * The bar stays white — the lockup is maroon type on a transparent PNG and
 * would be unreadable over a photograph — but it is flat at rest and picks up
 * its hairline and elevation once the page scrolls, so it reads as attached to
 * the hero rather than as a separate stripe above it.
 */
export default function Navbar() {
  const pathname = usePathname();
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
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
      if (event.key === "Escape") {
        setOpenDropdown(null);
        setMobileOpen(false);
      }
    }
    function onScroll() {
      setScrolled(window.scrollY > 8);
    }
    onScroll();
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  // Scroll lock while the sheet is open — without it the page behind scrolls
  // under the overlay on iOS.
  useEffect(() => {
    if (!mobileOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [mobileOpen]);

  return (
    <header
      className={`sticky top-0 z-50 bg-white transition-shadow duration-[var(--motion-base)] ${
        scrolled
          ? "border-b border-[var(--hairline)] shadow-[var(--elev-1)]"
          : "border-b border-transparent"
      }`}
    >
      {/* Height is pinned to --bar-h, not derived from the lockup: the auth
          screens reserve exactly that for this bar, so the lockup stepping down
          on a phone must not move it. */}
      <nav
        aria-label="Primary"
        className="mx-auto flex h-[var(--bar-h)] max-w-[var(--page-max)] items-center justify-between gap-4 px-[var(--page-gutter)]"
      >
        {/* brand-lockup carries the width step-down, not BrandLockup itself. */}
        <Link href="/" className="brand-lockup flex min-w-0 items-center">
          <BrandLockup tone="maroon" />
          <span className="sr-only">— home</span>
        </Link>

        <div className="flex items-center gap-2 lg:gap-6">
          <div ref={dropdownRef} className="hidden items-center gap-1 lg:flex">
            {NAV_LINKS.map((link) => {
              const active = isActive(pathname, link.href);
              const base =
                "relative flex items-center gap-1.5 rounded-[var(--radius-sm)] px-3 py-2 text-subheading transition-colors duration-[var(--motion-fast)]";
              const tone = active
                ? "font-semibold text-maroon"
                : "text-black/65 hover:text-maroon";
              const underline = active ? (
                <span
                  aria-hidden
                  className="absolute inset-x-3 -bottom-0.5 h-[3px] rounded-full bg-yellow"
                />
              ) : null;

              if (!link.children) {
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    aria-current={active ? "page" : undefined}
                    className={`${base} ${tone}`}
                  >
                    {link.label}
                    {underline}
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
                    // `true`, not `page`: the trigger marks the current
                    // *section*, while the page itself is an item inside it,
                    // and that item only carries `page` while the menu is open.
                    // Without this a visitor on /about/campuses had no exposed
                    // current item at all on desktop, because the child link
                    // holding it is unmounted whenever the menu is closed.
                    aria-current={active ? "true" : undefined}
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
                    className={`${base} ${tone}`}
                  >
                    {link.label}
                    <ChevronDown
                      aria-hidden
                      className={`h-4 w-4 transition-transform duration-[var(--motion-base)] ${
                        isOpen ? "rotate-180" : ""
                      }`}
                    />
                    {underline}
                  </button>

                  {isOpen && (
                    <div
                      id={menuId}
                      role="menu"
                      aria-label={link.label}
                      onKeyDown={(e) => {
                        const items = Array.from(
                          e.currentTarget.querySelectorAll<HTMLElement>(
                            "[role=menuitem]",
                          ),
                        );
                        const idx = items.indexOf(
                          document.activeElement as HTMLElement,
                        );
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
                      className="reveal absolute left-0 top-full z-10 mt-3 w-[288px] overflow-hidden rounded-[var(--radius-lg)] border border-[var(--hairline)] bg-white p-[var(--space-2)] shadow-[var(--elev-3)]"
                    >
                      {link.children.map((child) => (
                        <Link
                          key={child.href}
                          href={child.href}
                          role="menuitem"
                          aria-current={
                            pathname === child.href ? "page" : undefined
                          }
                          className="group flex items-center justify-between gap-3 rounded-[var(--radius-md)] px-4 py-3 transition-colors duration-[var(--motion-fast)] hover:bg-[var(--tint-maroon)]"
                        >
                          <span className="flex flex-col">
                            <span className="t-body-strong text-maroon">
                              {child.label}
                            </span>
                            <span className="t-sm text-black/70">{child.hint}</span>
                          </span>
                          <ChevronRight
                            aria-hidden
                            className="h-4 w-4 shrink-0 text-maroon opacity-0 transition-all duration-[var(--motion-fast)] group-hover:translate-x-0.5 group-hover:opacity-100"
                          />
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex items-center gap-1">
            {/* Was a bare 32px icon with only an aria-label — unlabelled to a
                sighted visitor, who had no way to know the site had accounts.
                The word ships from sm up; the icon alone remains on a phone,
                where it sits beside the menu toggle. */}
            <Link
              href="/login"
              className="flex items-center gap-2 rounded-full border border-[var(--hairline)] py-2 pl-3 pr-3 text-subheading font-semibold text-maroon transition-colors duration-[var(--motion-fast)] hover:border-maroon hover:bg-[var(--tint-maroon)] sm:pr-4"
            >
              <CircleUserRound
                aria-hidden
                className="h-5 w-5 shrink-0"
                strokeWidth={1.75}
              />
              <span className="hidden sm:inline">Sign in</span>
              <span className="sr-only sm:hidden">Sign in</span>
            </Link>

            <button
              type="button"
              aria-label={mobileOpen ? "Close navigation" : "Open navigation"}
              aria-expanded={mobileOpen}
              aria-controls="mobile-nav-menu"
              onClick={() => setMobileOpen((open) => !open)}
              className="rounded-[var(--radius-sm)] p-2 text-maroon transition-colors duration-[var(--motion-fast)] hover:bg-[var(--tint-maroon)] lg:hidden"
            >
              {mobileOpen ? (
                <X aria-hidden className="h-6 w-6" strokeWidth={1.75} />
              ) : (
                <Menu aria-hidden className="h-6 w-6" strokeWidth={1.75} />
              )}
            </button>
          </div>
        </div>
      </nav>

      {mobileOpen && (
        <>
          <button
            type="button"
            aria-label="Close navigation"
            tabIndex={-1}
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 top-[var(--bar-h)] z-40 cursor-default bg-black/40 lg:hidden"
          />
          <div
            id="mobile-nav-menu"
            className="fixed inset-x-0 top-[var(--bar-h)] z-40 max-h-[calc(100dvh-var(--bar-h))] overflow-y-auto border-t border-[var(--hairline)] bg-white px-[var(--page-gutter)] pb-[var(--space-8)] pt-[var(--space-4)] shadow-[var(--elev-3)] lg:hidden"
            style={{ animation: "drawer-down var(--motion-base) var(--ease-out)" }}
          >
            {NAV_LINKS.map((link) => {
              const active = isActive(pathname, link.href);
              return (
                <div
                  key={link.href}
                  className="border-b border-[var(--hairline)] py-1 last:border-0"
                >
                  <Link
                    href={link.href}
                    aria-current={active ? "page" : undefined}
                    className={`flex items-center justify-between rounded-[var(--radius-md)] px-3 py-3 text-subheading transition-colors ${
                      active
                        ? "font-semibold text-maroon"
                        : "text-black/75 hover:text-maroon"
                    }`}
                  >
                    {link.label}
                    {active ? (
                      <span aria-hidden className="h-2 w-2 rounded-full bg-yellow" />
                    ) : null}
                  </Link>
                  {link.children?.map((child) => (
                    <Link
                      key={child.href}
                      href={child.href}
                      aria-current={pathname === child.href ? "page" : undefined}
                      className="flex flex-col rounded-[var(--radius-md)] py-2 pl-7 pr-3 transition-colors hover:bg-[var(--tint-maroon)]"
                    >
                      <span className="t-body-strong text-maroon">
                        {child.label}
                      </span>
                      <span className="t-sm text-black/70">{child.hint}</span>
                    </Link>
                  ))}
                </div>
              );
            })}
          </div>
        </>
      )}
    </header>
  );
}
