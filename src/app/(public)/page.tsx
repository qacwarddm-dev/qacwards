import { Play } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const DESTINATIONS = [
  {
    label: "Campuses",
    href: "/about/campuses",
    icon: "/assets/icons/campuses.png",
    description: "22 campuses across the university system.",
  },
  {
    label: "Degree Programs",
    href: "/about/degree-programs",
    icon: "/assets/icons/degree-programs.png",
    description: "Find a programme and its accreditation level.",
  },
  {
    label: "Government Recognition",
    href: "/gov-recognitions",
    icon: "/assets/icons/government-recognition.png",
    description: "Official recognitions held by the university.",
  },
  {
    label: "Accreditation",
    href: "/accreditations",
    icon: "/assets/icons/accreditation.png",
    description: "What each accreditation level means.",
  },
  {
    label: "Personnel",
    // The original tile linked to /personnel, which has never existed
    // (BUG-7) — routed to the real Officials & Staff section on /about
    // instead of a dead page.
    href: "/about#officials",
    icon: "/assets/icons/personnels.png",
    description: "Meet the Center's officials and staff.",
  },
];

/**
 * Home — REBUILD (09a §A.1). The prior version had no description of what
 * QAC-WARDS is; a bare icon over a word told a first-time visitor nothing.
 *
 * No text overlay on the hero image (owner call, 2026-08-20, overriding 09a
 * §A.1's default): the image runs plain, with no scrim, heading, copy, or
 * Log in / Register call-to-action over it. Account access already has its
 * own entry point — the person icon in the navbar.
 *
 * Deferred from the full target: a live "at a glance" stat band and a
 * "what's new" feed both need a query safe to run for an unauthenticated
 * visitor (RLS-scoped tables today assume a signed-in role), which is a
 * backend question this refactor doesn't answer speculatively.
 */
export default function Home() {
  return (
    <div>
      <h1 className="sr-only">QAC-WARDS — Quality Assurance Center</h1>
      <Image
        src="/assets/imagery/home-hero.png"
        alt="Aerial view of the PUP campus"
        width={1440}
        height={394}
        className="h-auto w-full"
        priority
      />

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <p className="t-eyebrow text-center text-maroon">Explore</p>
        <div className="mt-8 grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-6">
          {DESTINATIONS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center gap-3 rounded-[var(--radius-lg)] p-6 text-center transition-shadow hover:shadow-[var(--elev-1)]"
            >
              <div className="flex h-[90px] w-[90px] items-center justify-center">
                <Image
                  src={item.icon}
                  alt=""
                  width={90}
                  height={85}
                  className="h-[70px] w-[70px] object-contain"
                />
              </div>
              <span className="text-subheading font-bold text-maroon">{item.label}</span>
              <span className="t-sm text-gray">{item.description}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <h2 className="text-center text-heading font-bold text-maroon">
          &ldquo;PUP Ako, Tagumpay Ako!&rdquo;
        </h2>
        <div className="mx-auto mt-6 flex aspect-video max-w-3xl flex-col items-center justify-center gap-2 rounded-lg border border-gray/30 bg-gray/10">
          <Play className="h-12 w-12 text-maroon" strokeWidth={1.5} />
          <span className="text-subheading text-gray">Video coming soon</span>
        </div>
      </section>
    </div>
  );
}
