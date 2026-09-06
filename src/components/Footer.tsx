import { ArrowUpRight, Mail, MapPin, Phone } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const SITE_LINKS = [
  { label: "The Center", href: "/about" },
  { label: "Campuses", href: "/about/campuses" },
  { label: "Degree Programs", href: "/about/degree-programs" },
  { label: "Accreditations", href: "/accreditations" },
  { label: "Government Recognitions", href: "/gov-recognitions" },
];

const GOVPH_LINKS = [
  { label: "Official Gazette", href: "https://www.officialgazette.gov.ph/" },
  { label: "Open Data Portal", href: "https://data.gov.ph/" },
  { label: "Office of the President", href: "https://op-proper.gov.ph/" },
  { label: "Senate of the Philippines", href: "https://www.senate.gov.ph/" },
  { label: "House of Representatives", href: "https://www.congress.gov.ph/" },
  { label: "Supreme Court", href: "https://sc.judiciary.gov.ph/" },
];

function ColumnHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="t-eyebrow font-qac text-yellow">
      {children}
    </h2>
  );
}

/**
 * Site footer.
 *
 * Rebuilt for three reasons.
 *
 * 1. **It had no links to this site.** Three of its four columns pointed at
 *    other government departments; a visitor at the bottom of the About page
 *    could reach the Supreme Court but not the Campuses page. A sitemap column
 *    now leads.
 * 2. **Sizing.** The Republic seal was a hard `w-[175px]`, roughly half a phone
 *    screen, and every link was 12px — under the comfortable tap target and at
 *    the bottom of the type scale for what is a link list, not fine print.
 *    Links are 15px on a 40px row; only the copyright line stays at 12.
 * 3. **The seven-item Government Links column was a wall.** It is trimmed to
 *    the six a university visitor plausibly wants and merged with GOVPH, which
 *    frees the fourth column for contact detail that can now breathe.
 *
 * The gold keyline on top is the same one that closes every hero, so the page
 * ends the way each band ends.
 *
 * **Both rows align to `--content-max`, not `--page-max`** (owner report,
 * 2026-08-21). Every section on every public page is capped at 1180px; the
 * footer was capped at 1440, so on a wide monitor its left edge sat ~130px
 * outside the column of text directly above it and the whole block read as
 * belonging to a different page. The seal is capped by *width* for the same
 * reason — but the seal's real bug was distortion, not size. Both seals sit in
 * a `flex flex-col`, whose default `align-items: stretch` blew the `w-auto`
 * out to the full column width while `h-[92px]` held the height, rendering a
 * 175x234 portrait seal as a 3:1 ribbon. `self-start` is the fix and is why
 * both images now carry it; without it any future `w-auto` here distorts
 * again.
 */
export default function Footer() {
  return (
    <footer className="on-maroon border-t-[3px] border-yellow bg-maroon font-footer text-white">
      <div className="mx-auto grid w-full max-w-[var(--content-max)] gap-x-[var(--space-8)] gap-y-[var(--space-9)] px-[var(--page-gutter)] py-[var(--space-11)] sm:grid-cols-2 lg:grid-cols-[1.15fr_1fr_1fr_1.15fr]">
        <div className="flex flex-col gap-4">
          <Image
            src="/assets/logos/republika-ng-pilipinas.png"
            alt="Seal of the Republic of the Philippines"
            width={175}
            height={234}
            unoptimized
            className="h-[112px] w-auto self-start"
          />
          <ColumnHeading>Republic of the Philippines</ColumnHeading>
          <p className="text-regular leading-[1.6] text-white/85">
            All content is in the public domain unless otherwise stated. Learn
            more about the Philippine government, its structure, how government
            works and the people behind it.
          </p>
        </div>

        <nav aria-label="Quality Assurance Center" className="flex flex-col gap-4">
          <ColumnHeading>Quality Assurance Center</ColumnHeading>
          <ul className="flex flex-col">
            {SITE_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="flex min-h-[40px] items-center text-subheading text-white/90 transition-colors duration-[var(--motion-fast)] hover:text-yellow"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Government links" className="flex flex-col gap-4">
          <ColumnHeading>GOVPH</ColumnHeading>
          <ul className="flex flex-col">
            {GOVPH_LINKS.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  target="_blank"
                  rel="noreferrer"
                  className="group flex min-h-[40px] items-center gap-1.5 text-subheading text-white/90 transition-colors duration-[var(--motion-fast)] hover:text-yellow"
                >
                  {link.label}
                  <ArrowUpRight
                    aria-hidden
                    className="h-3.5 w-3.5 shrink-0 opacity-50 transition-opacity group-hover:opacity-100"
                  />
                  <span className="sr-only">(opens in a new tab)</span>
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex flex-col gap-4">
          <Image
            src="/assets/logos/pup.png"
            alt="Polytechnic University of the Philippines seal"
            width={380}
            height={380}
            unoptimized
            className="h-[92px] w-[92px] self-start"
          />
          <ColumnHeading>Contact</ColumnHeading>
          <address className="flex flex-col not-italic">
            <a
              href="mailto:qac@pup.edu.ph"
              className="flex min-h-[40px] items-start gap-3 py-2 text-subheading text-white/90 transition-colors duration-[var(--motion-fast)] hover:text-yellow"
            >
              <Mail aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-yellow" />
              qac@pup.edu.ph
            </a>
            <a
              href="tel:+6323351787"
              className="flex min-h-[40px] items-start gap-3 py-2 text-subheading text-white/90 transition-colors duration-[var(--motion-fast)] hover:text-yellow"
            >
              <Phone aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-yellow" />
              (+632) 335-1787 / 335-1777 loc. 242
            </a>
            <p className="flex items-start gap-3 py-2 text-subheading text-white/85">
              <MapPin aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-yellow" />
              Ninoy Aquino Library and Learning Resource Center, PUP Sta. Mesa,
              Manila
            </p>
          </address>
        </div>
      </div>

      <div className="border-t border-white/20">
        <div className="mx-auto flex w-full max-w-[var(--content-max)] flex-col items-center justify-between gap-2 px-[var(--page-gutter)] py-[var(--space-5)] text-regular text-white/75 sm:flex-row">
          <p>© 2026 Polytechnic University of the Philippines</p>
          <p>Quality Assurance Center</p>
        </div>
      </div>
    </footer>
  );
}
