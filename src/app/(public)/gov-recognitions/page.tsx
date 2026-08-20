import type { Metadata } from "next";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Gov. Recognitions | PUP Quality Assurance Center",
  description:
    "Government recognitions and certifications awarded to the Polytechnic University of the Philippines.",
};

// Placeholder content — the prototype ships literal "Date" / "TITLE OF CERTIFICATION"
// placeholders in all nine cards. Swap for client-provided recognitions (or a DB
// query) once the real content exists; each entry will bring its own image too.
const RECOGNITIONS = Array.from({ length: 9 }, (_, index) => ({
  id: index + 1,
  date: "Date",
  title: "TITLE OF CERTIFICATION",
  facebookUrl: "https://www.facebook.com/share/p/189wu",
  image: "/assets/imagery/gov-certification.jpg",
}));

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
        <div className="mx-auto grid max-w-[1270px] grid-cols-1 gap-x-[35px] gap-y-[86px] sm:grid-cols-2 lg:grid-cols-3">
          {RECOGNITIONS.map((item) => (
            <article
              key={item.id}
              className="rounded-2xl border border-black bg-white p-5 shadow-lg"
            >
              <div className="relative aspect-[358/323] w-full overflow-hidden">
                <Image
                  src={item.image}
                  alt=""
                  fill
                  sizes="(min-width: 1024px) 358px, (min-width: 640px) 50vw, 100vw"
                  className="object-cover"
                />
              </div>

              <p className="mt-1 text-regular italic text-gray">{item.date}</p>

              <h2 className="mt-5 text-center text-heading font-bold text-maroon">
                {item.title}
              </h2>

              <p className="mt-5 truncate text-regular">
                <span className="font-bold">Facebook: </span>
                <a
                  href={item.facebookUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="underline transition-colors hover:text-maroon"
                >
                  {item.facebookUrl}
                </a>
              </p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
