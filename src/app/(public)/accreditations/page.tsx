import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { PageHero, Section, SectionIntro } from "@/components/public";

export const metadata: Metadata = {
  title: "Accreditations | PUP Quality Assurance Center",
  description:
    "Program accreditation status of the Polytechnic University of the Philippines.",
};

const AS_OF = "As of March 2026";

const ACCREDITATION_LEVELS = [
  { label: "Level IV", count: 47 },
  { label: "Level III", count: 29 },
  { label: "Level II", count: 41 },
  { label: "Level I", count: 54 },
  { label: "Candidate", count: 20 },
];

const TOTAL = ACCREDITATION_LEVELS.reduce((sum, l) => sum + l.count, 0);

/**
 * Accreditations.
 *
 * What was dated, and what it cost:
 *
 * - **The count tiles were a hack.** A 168px square with a 20%-opacity photo of
 *   the Main Building behind a 120px maroon numeral, and a fake keyline drawn
 *   with four offset text-shadows because `-webkit-text-stroke` was avoided.
 *   Gold on maroon at a 1px offset is under the contrast floor at any size, and
 *   the photograph behind live text is a straight AA failure. Both are gone;
 *   the numeral now sits on a plain card, which is also the only version that
 *   reads at a glance.
 * - **The counts had no proportion.** Five equal squares, so 20 and 54 looked
 *   the same weight. Each card now carries a share bar and a percentage, which
 *   is the thing a reader is actually trying to work out.
 * - **`h-1 max-w-[1160px] bg-maroon`** — a hand-drawn divider, one of four
 *   different ones across the site. Sections carry their own tone now.
 * - The heading kept `font-status` (Roboto Serif): "PROGRAM ACCREDITATION
 *   STATUS" is that token's one documented use in design/figma-tokens.md.
 * - **The hero repeated its own artwork.** This image is a Figma title card
 *   with ACCREDITATION burned into the pixels at 120px, so any visible <h1>
 *   saying the same word was the second copy. The scrim that used to hide it
 *   also drowned the photograph. The card is now shown untouched and the <h1>
 *   is the sentence the page is about — see the PageHero header.
 */
export default function AccreditationsPage() {
  return (
    <div>
      <PageHero
        image="/assets/imagery/accreditation.png"
        width={1356}
        height={563}
        art="titlecard"
        alt="Polytechnic University of the Philippines — Accreditation"
        eyebrow="Program status"
        title="Institutionalizing quality, one programme at a time."
        lede={`A pioneer AACCUP member since 1987. Here is where all ${TOTAL} programmes in the cycle currently stand.`}
        priority
      />

      <Section>
        <div className="grid gap-[var(--space-8)] lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] lg:gap-[var(--space-11)]">
          <SectionIntro
            index="01"
            eyebrow="Why it matters"
            title="Quality assurance at the scale of 104,229 students"
            as="h2"
          />
          <div className="prose-public max-w-[var(--prose-max)]">
            <p>
              The Polytechnic University of the Philippines has consistently
              positioned <strong>Quality Assurance</strong>{" "}
              as a cornerstone of
              its academic operations. As a pioneer member of the{" "}
              <strong>
                Accrediting Agency for Chartered Colleges and Universities in
                the Philippines (AACCUP), Inc.
              </strong>
              , the University has integrated external accreditation into its
              long-term development goals.
            </p>
            <p>
              Cultivating a robust <strong>quality culture</strong>{" "}
              within the
              Philippines&rsquo; largest state university &mdash; serving a
              student population of <strong>104,229</strong>&nbsp;&mdash; presents
              a distinct set of logistical and academic challenges. Ensuring
              consistency, compliance and excellence across such a vast
              landscape requires more than participation in accreditation; it
              demands a centralized, strategic framework.
            </p>
          </div>
        </div>
      </Section>

      <Section tone="tint">
        <div className="flex flex-wrap items-end justify-between gap-[var(--space-5)]">
          <SectionIntro
            index="02"
            eyebrow={AS_OF}
            title={
              <span className="font-status uppercase">
                Program Accreditation Status
              </span>
            }
            as="h2"
          />
          <p className="t-body-strong text-maroon">
            {TOTAL} programmes in the cycle
          </p>
        </div>

        <ul className="mt-[var(--space-9)] grid gap-[var(--space-5)] sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {ACCREDITATION_LEVELS.map((level) => {
            const share = Math.round((level.count / TOTAL) * 100);
            return (
              <li
                key={level.label}
                className="flex flex-col rounded-[var(--radius-lg)] border border-[var(--hairline)] bg-white p-[var(--space-6)] transition-shadow duration-[var(--motion-base)] hover:shadow-[var(--elev-2)]"
              >
                <span className="t-numeral-sm text-maroon">{level.count}</span>
                <span aria-hidden className="mt-4 h-[2px] w-10 bg-yellow" />
                <span className="t-h1 mt-4 font-qac text-black">
                  {level.label}
                </span>
                <span className="t-sm mt-1 text-black/70">
                  {level.count === 1 ? "programme" : "programmes"}
                </span>

                {/* Share bar. The five tiles were previously identical squares,
                    so 20 and 54 read as the same quantity. */}
                <span
                  aria-hidden
                  className="mt-5 block h-1.5 w-full overflow-hidden rounded-full bg-maroon/15"
                >
                  <span
                    className="block h-full rounded-full bg-maroon"
                    style={{ width: `${share}%` }}
                  />
                </span>
                <span className="t-meta mt-2 text-black/70">
                  {share}% of the cycle
                </span>
              </li>
            );
          })}
        </ul>

        <p className="t-sm mt-[var(--space-7)] text-black/70">
          Figures cover programmes across the Main Campus and all branches.{" "}
          {AS_OF}.
        </p>
      </Section>

      <Section>
        <div className="flex flex-col items-center gap-[var(--space-5)] text-center">
          <SectionIntro
            index="03"
            eyebrow="Next"
            title="Where a programme sits, and who to ask"
            lede="Accreditation is held per programme, per campus. The Center maintains the evidence, the survey schedule and the result for each one."
            as="h2"
            align="center"
          />
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/about/campuses"
              className="group inline-flex items-center gap-2 rounded-full bg-maroon px-6 py-3 text-subheading font-semibold text-white transition-opacity duration-[var(--motion-fast)] hover:opacity-90"
            >
              Browse campuses
              <ArrowRight
                aria-hidden
                className="h-4 w-4 transition-transform duration-[var(--motion-base)] group-hover:translate-x-1"
              />
            </Link>
            <a
              href="mailto:qac@pup.edu.ph"
              className="inline-flex items-center gap-2 rounded-full border border-maroon px-6 py-3 text-subheading font-semibold text-maroon transition-colors duration-[var(--motion-fast)] hover:bg-[var(--tint-maroon)]"
            >
              qac@pup.edu.ph
            </a>
          </div>
        </div>
      </Section>
    </div>
  );
}
