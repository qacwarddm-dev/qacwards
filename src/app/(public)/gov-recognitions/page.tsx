import type { Metadata } from "next";
import { Award } from "lucide-react";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Gov. Recognitions | PUP Quality Assurance Center",
  description:
    "Government recognitions and certifications awarded to the Polytechnic University of the Philippines.",
};

/**
 * UPGRADE (09a §A.6): the prototype shipped nine cards of literal "Date" /
 * "TITLE OF CERTIFICATION" placeholders. Nine fake entries reads as content;
 * one honest empty state reads as "we haven't published these yet," which is
 * the truth — swap this for a real `RECOGNITIONS` array (or a DB query) once
 * the client supplies actual citations.
 */
export default function GovRecognitionsPage() {
  return (
    <div>
      <Image
        src="/assets/imagery/government-certification.png"
        alt="Polytechnic University of the Philippines — Government Certification"
        width={1440}
        height={394}
        className="h-auto w-full"
        priority
      />

      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <h1 className="t-h1 text-center text-maroon">Government Recognitions</h1>
        <div className="mx-auto mt-10 flex max-w-[var(--prose-max)] flex-col items-center gap-3 text-center">
          <span className="flex h-[64px] w-[64px] items-center justify-center rounded-full bg-[color:var(--color-gray)]/10 text-maroon">
            <Award className="h-[28px] w-[28px]" strokeWidth={1.75} aria-hidden />
          </span>
          <p className="t-h2 text-black">Recognitions are being catalogued.</p>
          <p className="t-body text-gray">
            This page will list the government recognitions and certifications
            held by the university. In the meantime, reach the Quality
            Assurance Center directly at{" "}
            <a href="mailto:qac@pup.edu.ph" className="text-maroon underline">
              qac@pup.edu.ph
            </a>
            .
          </p>
        </div>
      </section>
    </div>
  );
}
