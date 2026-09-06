import type { Metadata } from "next";
import { ArrowRight, Award, Mail } from "lucide-react";
import Link from "next/link";

import { PageHero, Section, SectionIntro } from "@/components/public";

export const metadata: Metadata = {
  title: "Gov. Recognitions | PUP Quality Assurance Center",
  description:
    "Government recognitions and certifications awarded to the Polytechnic University of the Philippines.",
};

const AWAITING = [
  {
    title: "Certificate of Program Compliance",
    body: "CHED's confirmation that a programme meets the minimum policies and standards for its discipline. The Center has submitted 77 programmes to CHED Regional Quality Assessment Teams.",
  },
  {
    title: "Center of Development / Center of Excellence",
    body: "CHED's recognition of a programme that performs above the national standard in instruction, research and extension. PUP programmes have held COD status since 2013.",
  },
  {
    title: "Government recognition of programme offerings",
    body: "The authority under which a state university may confer a degree. Held per programme, per campus.",
  },
];

/**
 * Government Recognitions.
 *
 * The prototype shipped nine cards of literal "Date" / "TITLE OF CERTIFICATION"
 * placeholders; a previous pass replaced them with one honest empty state,
 * which was right but reduced the page to three centred lines under a letterbox
 * image — a visitor learned neither what a government recognition is nor when
 * to expect the list.
 *
 * The empty state stays honest (nothing here claims a recognition the client
 * has not supplied) but the page now explains the three kinds of recognition
 * the Center handles, using facts already published on /about, and gives a
 * route to a person. Swap `AWAITING` for a real `RECOGNITIONS` array or a query
 * once the citations arrive.
 */
export default function GovRecognitionsPage() {
  return (
    <div>
      <PageHero
        image="/assets/imagery/government-certification.png"
        width={1440}
        height={394}
        art="titlecard"
        alt="Polytechnic University of the Philippines — Government Certification"
        eyebrow="Recognition"
        title="What the state has certified, and what it means."
        lede="The recognitions held by the university and its programmes, awarded by the Commission on Higher Education."
        priority
      />

      <Section>
        <div className="grid gap-[var(--space-8)] lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] lg:gap-[var(--space-11)]">
          <SectionIntro
            index="01"
            eyebrow="What is listed here"
            title="Three kinds of recognition"
            lede="Accreditation is voluntary and peer-led. Government recognition is statutory — it is what allows a programme to run and to confer a degree."
            as="h2"
          />

          <ul className="flex flex-col gap-[var(--space-5)]">
            {AWAITING.map((item) => (
              <li
                key={item.title}
                className="rounded-[var(--radius-lg)] border border-[var(--hairline)] bg-white p-[var(--space-6)]"
              >
                <h3 className="t-h1 font-qac text-maroon">{item.title}</h3>
                <span aria-hidden className="mt-3 block h-[2px] w-10 bg-yellow" />
                <p className="t-sm mt-4 leading-[1.7] text-black/75">
                  {item.body}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </Section>

      <Section tone="tint">
        <div className="mx-auto flex max-w-[var(--prose-max)] flex-col items-center gap-[var(--space-4)] rounded-[var(--radius-lg)] border border-dashed border-maroon/30 bg-white p-[var(--space-9)] text-center">
          <span className="flex h-[64px] w-[64px] items-center justify-center rounded-full bg-[var(--tint-maroon)] text-maroon">
            <Award aria-hidden className="h-7 w-7" strokeWidth={1.75} />
          </span>
          <h2 className="t-h1 font-qac text-black">
            The citations are being catalogued.
          </h2>
          <p className="t-body max-w-[52ch] text-black/70">
            This page will list each recognition with its date, awarding body
            and the programme it covers. Until it does, the Center will confirm
            the standing of any particular programme on request.
          </p>
          <div className="mt-2 flex flex-wrap justify-center gap-3">
            <a
              href="mailto:qac@pup.edu.ph"
              className="inline-flex items-center gap-2 rounded-full bg-maroon px-6 py-3 text-subheading font-semibold text-white transition-opacity duration-[var(--motion-fast)] hover:opacity-90"
            >
              <Mail aria-hidden className="h-4 w-4" />
              qac@pup.edu.ph
            </a>
            <Link
              href="/accreditations"
              className="group inline-flex items-center gap-2 rounded-full border border-maroon px-6 py-3 text-subheading font-semibold text-maroon transition-colors duration-[var(--motion-fast)] hover:bg-[var(--tint-maroon)]"
            >
              Accreditation status
              <ArrowRight
                aria-hidden
                className="h-4 w-4 transition-transform duration-[var(--motion-base)] group-hover:translate-x-1"
              />
            </Link>
          </div>
        </div>
      </Section>
    </div>
  );
}
