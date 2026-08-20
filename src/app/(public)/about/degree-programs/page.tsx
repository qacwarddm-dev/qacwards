import type { Metadata } from "next";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Degree Programs | PUP Quality Assurance Center",
  description:
    "Degree programs offered by the Polytechnic University of the Philippines Main Campus.",
};

export default function DegreeProgramsPage() {
  return (
    <div>
      <Image
        src="/assets/imagery/degree-programs.png"
        alt="Polytechnic University of the Philippines — Degree Programs"
        width={1356}
        height={372}
        className="h-auto w-full"
        priority
      />

      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[var(--prose-max)] space-y-8 text-center text-subheading leading-loose">
          <h1 className="t-h1 text-maroon">Degree Programs</h1>
          <p>
            The{" "}
            <strong className="font-bold">
              Polytechnic University of the Philippines (PUP) Main Campus
            </strong>{" "}
            in Sta. Mesa, Manila, stands as a powerhouse of Philippine higher
            education, renowned for its commitment to accessible, high-quality
            learning. As the flagship campus of the &quot;Country&apos;s 1st
            PolytechnicU&quot; it serves as a sprawling hub of innovation and
            professional development, guided by its ambitious vision:{" "}
            <strong className="font-bold">
              &quot;A Leading Comprehensive Polytechnic University in Asia.&quot;
            </strong>
          </p>
          <p>
            At the heart of its academic mission is an expansive curriculum
            designed to meet the demands of a globalizing workforce. The Main
            Campus alone boasts an impressive portfolio of{" "}
            <strong className="font-bold">100 Academic Programs</strong>,
            ranging from specialized diplomas to advanced doctoral degrees. This
            diverse range of offerings is strategically housed within{" "}
            <strong className="font-bold">13 specialized colleges</strong>, each
            serving as a center of excellence in its respective field
          </p>
        </div>
      </section>
    </div>
  );
}
