import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { Section, SectionIntro } from "@/components/public";

import { LandingVideo } from "./LandingVideo";

const DESTINATIONS = [
  {
    label: "Campuses",
    href: "/about/campuses",
    icon: "/assets/icons/campuses.png",
    description:
      "24 campuses across six regions, from Bataan to the university's first campus in the Visayas.",
  },
  {
    label: "Degree Programs",
    href: "/about/degree-programs",
    icon: "/assets/icons/degree-programs.png",
    description:
      "100 academic programs in 13 colleges, from diplomas to doctoral degrees.",
  },
  {
    label: "Accreditation",
    href: "/accreditations",
    icon: "/assets/icons/accreditation.png",
    description:
      "What each AACCUP level means, and how many PUP programs currently hold it.",
  },
  {
    label: "Government Recognition",
    href: "/gov-recognitions",
    icon: "/assets/icons/government-recognition.png",
    description:
      "Recognitions and certifications held by the university and its programs.",
  },
  {
    label: "The Center",
    // The original tile linked to /personnel, which has never existed
    // (BUG-7) — routed to the real Officials & Staff section on /about
    // instead of a dead page.
    href: "/about#officials",
    icon: "/assets/icons/personnels.png",
    description:
      "The mandate, core functions and history of the QAC — and the people who run it.",
  },
];

/**
 * Home.
 *
 * **The hero stays plain.** No scrim, heading, copy or call-to-action over the
 * photograph — an explicit owner call (2026-08-20) overriding 09a §A.1, on the
 * grounds that account access already has its own entry point in the navbar.
 * The redesign keeps that decision and fixes only what was broken underneath
 * it: the image shipped as `h-auto w-full` on a 1440x394 file, so a 360px phone
 * got a 98px sliver of sky. It is now an aspect-ratio band with a cover crop,
 * so the picture reads as a photograph at every width.
 *
 * What the page gained is an introduction. It previously had none — the first
 * words a first-time visitor met were five icon labels — which the prior doc
 * comment already flagged. Copy here restates the university's own published
 * material (AACCUP membership, the Center's remit); nothing is invented.
 *
 * Still deferred: a live "at a glance" stat band and a "what's new" feed both
 * need a query that is safe to run unauthenticated, which this refactor does
 * not answer speculatively.
 */
export default function Home() {
  return (
    <div>
      <h1 className="sr-only">
        PUP Quality Assurance Center — accreditation and quality assurance
      </h1>

      {/* `object-contain` on a maroon field, not `object-cover`: this asset is
          a masthead with the seal and "QUALITY ASSURANCE CENTER" burned into the
          pixels, so any crop slices the wordmark in half — which is exactly what
          the old `h-auto w-full` avoided and what a naive cover crop reintroduces.
          Contain is a no-op at the file's own 1440:394 above sm; below it the
          box opens only as far as 5:2, which gives the band presence on a phone
          (156px at 390 rather than the ~107px it letterboxes to) while keeping
          the maroon margins narrow enough to read as a frame. Opening it
          further — 2:1, 16:9 — turns those margins into what looks like a gap
          under the navbar. */}
      <div className="relative isolate bg-maroon">
        <div className="relative aspect-[5/2] w-full sm:aspect-[1440/394]">
          <Image
            src="/assets/imagery/home-hero.png"
            alt="Polytechnic University of the Philippines — Quality Assurance Center, over an aerial view of the Sta. Mesa campus"
            fill
            priority
            sizes="100vw"
            className="object-contain object-center"
          />
        </div>
        <span aria-hidden className="absolute inset-x-0 bottom-0 h-[3px] bg-yellow" />
      </div>

      <Section>
        <div className="grid gap-[var(--space-8)] lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] lg:gap-[var(--space-11)]">
          <SectionIntro
            index="01"
            eyebrow="Sintang Paaralan"
            title="A culture of quality, kept on the record."
            as="h2"
          />
          <div className="prose-public max-w-[var(--prose-max)]">
            <p>
              The <strong>Quality Assurance Center</strong>{" "}
              is the office that
              carries accreditation for the Polytechnic University of the
              Philippines — the country&rsquo;s largest state university, with a
              student population of 104,229 across 24 campuses.
            </p>
            <p>
              A pioneer member of the{" "}
              <strong>
                Accrediting Agency for Chartered Colleges and Universities in
                the Philippines (AACCUP)
              </strong>
              , PUP has submitted programs for accreditation since 1987. The
              Center packages the documents, runs the survey visits, holds the
              evidence and reports the result — for every programme, on every
              campus, in one place.
            </p>
            <p>
              <Link href="/about">Read the Center&rsquo;s mandate and history</Link>{" "}
              or{" "}
              <Link href="/accreditations">
                see where each programme currently stands
              </Link>
              .
            </p>
          </div>
        </div>
      </Section>

      <Section tone="tint">
        <SectionIntro index="02" eyebrow="Explore" title="Start here" as="h2" />

        {/* Six columns, each card spanning two: three across on the first row,
            and the remaining two centred under them rather than left as an
            orphaned pair. A plain three-column grid could not do this. */}
        <div className="mt-[var(--space-8)] grid gap-[var(--space-5)] sm:grid-cols-2 lg:grid-cols-6">
          {DESTINATIONS.map((item, i) => (
            <Link
              key={item.href}
              href={item.href}
              className={`group relative flex flex-col gap-4 rounded-[var(--radius-lg)] border border-[var(--hairline)] bg-white p-[var(--space-6)] transition duration-[var(--motion-base)] ease-[var(--ease-out)] hover:-translate-y-1 hover:border-maroon/40 hover:shadow-[var(--elev-2)] lg:col-span-2 ${
                i === 3 ? "lg:col-start-2" : ""
              }`}
            >
              <Image
                src={item.icon}
                alt=""
                width={90}
                height={85}
                className="h-[56px] w-[56px] object-contain transition-transform duration-[var(--motion-slow)] ease-[var(--ease-out)] group-hover:scale-110"
              />
              <span className="t-h1 font-qac text-maroon">{item.label}</span>
              <span className="t-sm flex-1 leading-[1.7] text-black/70">
                {item.description}
              </span>
              <span className="t-index flex items-center gap-2 text-maroon">
                Open
                <ArrowRight
                  aria-hidden
                  className="h-4 w-4 transition-transform duration-[var(--motion-base)] group-hover:translate-x-1"
                />
              </span>
            </Link>
          ))}
        </div>
      </Section>

      <Section>
        <div className="grid items-center gap-[var(--space-8)] lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-[var(--space-11)]">
          <SectionIntro
            index="03"
            eyebrow="Watch"
            title="&ldquo;PUP Ako, Tagumpay Ako!&rdquo;"
            lede="The university in its own words — four and a half minutes on what a state education in the Philippines is for."
            as="h2"
          />
          <LandingVideo />
        </div>
      </Section>
    </div>
  );
}
