import type { Metadata } from "next";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Accreditations | PUP Quality Assurance Center",
  description:
    "Program accreditation status of the Polytechnic University of the Philippines.",
};

const ACCREDITATION_LEVELS = [
  { label: "Level IV", count: 47 },
  { label: "Level III", count: 29 },
  { label: "Level II", count: 41 },
  { label: "Level I", count: 54 },
  { label: "Candidate", count: 20 },
];

// Maroon numerals carry a thin gold keyline in the prototype — four offset
// shadows fake a stroke without relying on -webkit-text-stroke.
const NUMERAL_KEYLINE =
  "[text-shadow:1px_1px_0_var(--color-yellow),-1px_-1px_0_var(--color-yellow),1px_-1px_0_var(--color-yellow),-1px_1px_0_var(--color-yellow)]";

export default function AccreditationsPage() {
  return (
    <div>
      <Image
        src="/assets/imagery/accreditation.png"
        alt="Polytechnic University of the Philippines — Accreditation"
        width={1356}
        height={563}
        className="aspect-[3.66] w-full object-cover object-[center_38%]"
        priority
      />

      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1140px] text-center">
          <h1 className="text-title font-bold text-maroon">
            Institutionalizing Quality: A Strategic Overview of PUP-QAC
          </h1>
          <p className="mt-8 text-subheading leading-loose">
            The Polytechnic University of the Philippines (PUP) has consistently
            positioned{" "}
            <strong className="font-bold">Quality Assurance (QA)</strong> as a
            cornerstone of its academic operations. As a pioneer member of the{" "}
            <strong className="font-bold">
              Accrediting Agency for Chartered Colleges and Universities in the
              Philippines (AACCUP), Inc.
            </strong>
            , the University has integrated external accreditation into its
            long-term development goals. Cultivating a robust{" "}
            <strong className="font-bold">Quality Culture</strong>{" "}
            within the Philippines&rsquo; largest state
            university&mdash;serving a massive
            student population of{" "}
            <strong className="font-bold">104,229</strong>&mdash;presents a
            unique set of logistical and academic challenges. Ensuring
            consistency, compliance, and excellence across such a vast landscape
            requires more than just participation in accreditation; it demands a
            centralized, strategic framework.
          </p>
        </div>
      </section>

      <div className="px-4 sm:px-6 lg:px-8">
        <div className="mx-auto h-1 max-w-[1160px] bg-maroon" />
      </div>

      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <h2 className="text-center font-status text-title font-bold text-maroon">
          PROGRAM ACCREDITATION STATUS
        </h2>
        <p className="mt-2 text-center text-subheading tracking-widest text-maroon">
          As of March 2026
        </p>

        <div className="mt-16 flex flex-wrap justify-center gap-x-[61px] gap-y-12">
          {ACCREDITATION_LEVELS.map((level) => (
            <div key={level.label} className="flex flex-col items-center">
              <div className="relative h-[168px] w-[168px] overflow-hidden border border-black">
                <Image
                  src="/assets/imagery/pup-main-building.jpg"
                  alt=""
                  fill
                  sizes="168px"
                  className="object-cover opacity-20"
                />
                <span
                  className={`relative flex h-full items-center justify-center text-[120px] font-extrabold leading-none text-maroon ${NUMERAL_KEYLINE}`}
                >
                  {level.count}
                </span>
              </div>
              <span className="mt-9 text-heading font-bold">{level.label}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
