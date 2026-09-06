import type { Metadata } from "next";
import { ArrowRight, Mail } from "lucide-react";
import Link from "next/link";

import {
  FigureStat,
  PageHero,
  Section,
  SectionIntro,
} from "@/components/public";

export const metadata: Metadata = {
  title: "Degree Programs | PUP Quality Assurance Center",
  description:
    "Degree programs offered by the Polytechnic University of the Philippines Main Campus.",
};

const STATS = [
  { value: "100", label: "Academic programs", caption: "Diploma to doctoral" },
  { value: "13", label: "Colleges", caption: "Main Campus" },
];

/**
 * Degree Programs.
 *
 * What was dated: the whole page was a letterbox image followed by two centred
 * paragraphs at `--prose-max` and nothing else — no structure, no hierarchy
 * beyond one `t-h1`, and the two figures the copy is actually about ("100
 * Academic Programs", "13 specialized colleges") buried mid-sentence in bold.
 *
 * The figures are pulled out as the page's headline, the copy runs as a proper
 * standfirst plus body, and the page now says what a visitor should do next.
 *
 * **Not invented:** the individual programs and colleges are deliberately not
 * listed. The client has not supplied that list, and 13 plausible-looking
 * college names would read as data. The honest pointer below is the same
 * pattern /gov-recognitions uses.
 */
export default function DegreeProgramsPage() {
  return (
    <div>
      <PageHero
        image="/assets/imagery/degree-programs.png"
        width={1356}
        height={372}
        art="titlecard"
        alt="Polytechnic University of the Philippines — Degree Programs"
        eyebrow="What we offer"
        title="One hundred programs, thirteen colleges, one campus."
        lede="From specialized diplomas to advanced doctoral degrees, at the Main Campus in Sta. Mesa, Manila."
        priority
      />

      <Section>
        <div className="grid gap-[var(--space-9)] lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)] lg:gap-[var(--space-11)]">
          <div className="flex gap-[var(--space-9)] sm:gap-[var(--space-12)] lg:flex-col lg:gap-[var(--space-9)]">
            {STATS.map((stat) => (
              <FigureStat
                key={stat.label}
                value={stat.value}
                label={stat.label}
                caption={stat.caption}
                size="md"
              />
            ))}
          </div>

          <div>
            <SectionIntro
              index="01"
              eyebrow="Main Campus"
              title="A Leading Comprehensive Polytechnic University in Asia"
              as="h2"
            />
            <div className="prose-public mt-[var(--space-7)] max-w-[var(--prose-max)]">
              <p>
                The{" "}
                <strong>
                  Polytechnic University of the Philippines (PUP) Main Campus
                </strong>{" "}
                in Sta. Mesa, Manila, stands as a powerhouse of Philippine
                higher education, renowned for its commitment to accessible,
                high-quality learning. As the flagship campus of the
                &ldquo;Country&rsquo;s 1st Polytechnic U&rdquo;, it serves as a
                sprawling hub of innovation and professional development.
              </p>
              <p>
                At the heart of its academic mission is an expansive curriculum
                designed to meet the demands of a globalizing workforce. The
                Main Campus alone boasts an impressive portfolio of{" "}
                <strong>100 academic programs</strong>, ranging from specialized
                diplomas to advanced doctoral degrees. This diverse range of
                offerings is strategically housed within{" "}
                <strong>13 specialized colleges</strong>, each serving as a
                center of excellence in its respective field.
              </p>
            </div>
          </div>
        </div>
      </Section>

      <Section tone="tint">
        <div className="mx-auto flex max-w-[var(--prose-max)] flex-col items-start gap-[var(--space-5)] rounded-[var(--radius-lg)] border border-[var(--hairline)] bg-white p-[var(--space-8)]">
          <h2 className="t-h1 font-qac text-maroon">
            Looking for a specific programme?
          </h2>
          <p className="t-body text-black/75">
            The full course catalogue is maintained by each college. The Quality
            Assurance Center publishes where every programme stands in the
            accreditation cycle, and will answer enquiries about a particular
            degree directly.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/accreditations"
              className="group inline-flex items-center gap-2 rounded-full bg-maroon px-6 py-3 text-subheading font-semibold text-white transition-opacity duration-[var(--motion-fast)] hover:opacity-90"
            >
              Accreditation status
              <ArrowRight
                aria-hidden
                className="h-4 w-4 transition-transform duration-[var(--motion-base)] group-hover:translate-x-1"
              />
            </Link>
            <a
              href="mailto:qac@pup.edu.ph"
              className="inline-flex items-center gap-2 rounded-full border border-maroon px-6 py-3 text-subheading font-semibold text-maroon transition-colors duration-[var(--motion-fast)] hover:bg-[var(--tint-maroon)]"
            >
              <Mail aria-hidden className="h-4 w-4" />
              qac@pup.edu.ph
            </a>
          </div>
        </div>
      </Section>
    </div>
  );
}
