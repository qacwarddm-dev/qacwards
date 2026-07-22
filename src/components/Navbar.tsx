"use client";

import { ChevronDown, CircleUserRound, Menu, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
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

  // Route change closes whatever the previous page left open.
  useEffect(() => {
    setOpenDropdown(null);
    setMobileOpen(false);
  }, [pathname]);

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
    <header className="sticky top-0 z-50 bg-white shadow-sm">
      <nav className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="flex shrink-0 items-center gap-3">
          <Image
            src="/assets/logos/pup.png"
            alt="Polytechnic University of the Philippines seal"
            width={56}
            height={56}
            className="h-12 w-12 object-contain sm:h-14 sm:w-14"
            priority
          />
          <span className="flex flex-col leading-tight">
            <span className="font-pup text-regular text-black sm:text-subheading">
              Polytechnic University of the Philippines
            </span>
            <span className="font-qac text-subheading font-bold text-maroon sm:text-heading">
              Quality Assurance Center
            </span>
          </span>
        </Link>

        <div ref={dropdownRef} className="hidden items-center gap-1 lg:flex">
          {NAV_LINKS.map((link) => {
            const active = isActive(pathname, link);
            const pill = active
              ? "bg-maroon text-white"
              : "text-black hover:bg-maroon/10";

            if (!link.children) {
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-full px-4 py-2 text-subheading transition-colors ${pill}`}
                >
                  {link.label}
                </Link>
              );
            }

            return (
              <div key={link.href} className="relative">
                <button
                  type="button"
                  aria-expanded={openDropdown === link.label}
                  aria-haspopup="menu"
                  onClick={() =>
                    setOpenDropdown((open) =>
                      open === link.label ? null : link.label,
                    )
                  }
                  className={`flex items-center gap-1 rounded-full px-4 py-2 text-subheading transition-colors ${pill}`}
                >
                  {link.label}
                  <ChevronDown
                    className={`h-4 w-4 transition-transform ${
                      openDropdown === link.label ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {openDropdown === link.label && (
                  <div
                    role="menu"
                    className="absolute left-0 top-full mt-2 min-w-56 rounded-lg bg-white py-2 shadow-lg"
                  >
                    {link.children.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        role="menuitem"
                        className={`block px-4 py-2 text-subheading transition-colors hover:bg-maroon/10 ${
                          pathname === child.href
                            ? "text-maroon"
                            : "text-black"
                        }`}
                      >
                        {child.label}
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
            className="rounded-full p-1 text-maroon transition-colors hover:bg-maroon/10"
          >
            <CircleUserRound className="h-8 w-8" strokeWidth={1.5} />
          </Link>

          <button
            type="button"
            aria-label="Toggle navigation"
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((open) => !open)}
            className="rounded-full p-1 text-maroon transition-colors hover:bg-maroon/10 lg:hidden"
          >
            {mobileOpen ? (
              <X className="h-8 w-8" strokeWidth={1.5} />
            ) : (
              <Menu className="h-8 w-8" strokeWidth={1.5} />
            )}
          </button>
        </div>
      </nav>

      {mobileOpen && (
        <div className="border-t border-gray/20 bg-white px-4 pb-4 sm:px-6 lg:hidden">
          {NAV_LINKS.map((link) => (
            <div key={link.href} className="py-1">
              <Link
                href={link.href}
                className={`block rounded-full px-4 py-2 text-subheading transition-colors ${
                  isActive(pathname, link)
                    ? "bg-maroon text-white"
                    : "text-black hover:bg-maroon/10"
                }`}
              >
                {link.label}
              </Link>
              {link.children?.map((child) => (
                <Link
                  key={child.href}
                  href={child.href}
                  className={`block rounded-full px-8 py-2 text-subheading transition-colors ${
                    pathname === child.href
                      ? "text-maroon"
                      : "text-gray hover:bg-maroon/10"
                  }`}
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
