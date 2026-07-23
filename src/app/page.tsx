import { Play } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const ICON_LINKS = [
  {
    label: "Campuses",
    href: "/about/campuses",
    icon: "/assets/icons/campuses.png",
  },
  {
    label: "Degree Programs",
    href: "/about/degree-programs",
    icon: "/assets/icons/degree-programs.png",
  },
  {
    label: "Government Recognition",
    href: "/gov-recognitions",
    icon: "/assets/icons/government-recognition.png",
  },
  {
    label: "Accreditation",
    href: "/accreditations",
    icon: "/assets/icons/accreditation.png",
  },
];

const PERSONNEL_LINK = {
  label: "Personnels",
  href: "/personnel",
  icon: "/assets/icons/personnels.png",
};

export default function Home() {
  return (
    <div>
      <Image
        src="/assets/imagery/home-hero.png"
        alt="Aerial view of the PUP campus with the Quality Assurance Center wordmark"
        width={1440}
        height={394}
        className="h-auto w-full"
        priority
      />

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="flex flex-wrap justify-center gap-x-24 gap-y-14">
          {ICON_LINKS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center gap-3 text-center"
            >
              <div className="flex h-28 w-28 items-center justify-center sm:h-[120px] sm:w-[120px]">
                <Image
                  src={item.icon}
                  alt=""
                  width={90}
                  height={85}
                  className="h-20 w-20 object-contain sm:h-[90px] sm:w-[90px]"
                />
              </div>
              <span className="text-subheading font-bold text-maroon">
                {item.label}
              </span>
            </Link>
          ))}

          <Link
            href={PERSONNEL_LINK.href}
            className="flex flex-col items-center gap-3 text-center"
          >
            <div className="flex h-28 w-28 items-center justify-center sm:h-[120px] sm:w-[120px]">
              <Image
                src={PERSONNEL_LINK.icon}
                alt=""
                width={120}
                height={113}
                className="h-28 w-28 object-contain sm:h-[120px] sm:w-[120px]"
              />
            </div>
            <span className="text-subheading font-bold text-maroon">
              {PERSONNEL_LINK.label}
            </span>
          </Link>
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
