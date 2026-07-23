import { Mail, Phone } from "lucide-react";
import Image from "next/image";

const GOVPH_LINKS = [
  { label: "Official Gazette", href: "https://www.officialgazette.gov.ph/" },
  { label: "Open Data Portal", href: "https://data.gov.ph/" },
];

const GOVERNMENT_LINKS = [
  { label: "Office of the President", href: "https://op-proper.gov.ph/" },
  { label: "Office of the Vice President", href: "https://ovp.gov.ph/" },
  { label: "Senate of the Philippines", href: "https://www.senate.gov.ph/" },
  { label: "House of Representatives", href: "https://www.congress.gov.ph/" },
  { label: "Supreme Court", href: "https://sc.judiciary.gov.ph/" },
  { label: "Court of Appeals", href: "https://ca.judiciary.gov.ph/" },
  { label: "Sandiganbayan", href: "https://sb.judiciary.gov.ph/" },
];

function ColumnHeading({ children }: { children: React.ReactNode }) {
  return <h2 className="text-heading font-bold text-white">{children}</h2>;
}

export default function Footer() {
  return (
    <footer className="bg-maroon font-footer text-white">
      <div className="mx-auto grid max-w-[1440px] gap-8 px-4 py-12 sm:px-6 md:grid-cols-2 lg:grid-cols-[2.49fr_1.78fr_1fr_1.65fr] lg:px-8">
        <div className="flex items-start gap-4">
          <Image
            src="/assets/logos/republika-ng-pilipinas.png"
            alt="Republic of the Philippines seal"
            width={175}
            height={234}
            unoptimized
            className="w-[175px] shrink-0"
          />
          <div className="flex flex-col gap-4 pt-5">
            <ColumnHeading>Republic of the Philippines</ColumnHeading>
            <p className="text-regular text-white/80">
              All content is in the public domain unless otherwise stated.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <ColumnHeading>About GOVPH</ColumnHeading>
          <p className="text-regular text-white/80">
            Learn more about the Philippine government, its structure, how
            government works and the people behind it.
          </p>
          <ul className="flex flex-col gap-2">
            {GOVPH_LINKS.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  target="_blank"
                  rel="noreferrer"
                  className="text-regular transition-colors hover:text-yellow"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col gap-3">
          <ColumnHeading>Government Links</ColumnHeading>
          <ul className="flex flex-col gap-2">
            {GOVERNMENT_LINKS.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  target="_blank"
                  rel="noreferrer"
                  className="text-regular transition-colors hover:text-yellow"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col items-center gap-3 text-center">
          <Image
            src="/assets/logos/pup.png"
            alt="Polytechnic University of the Philippines seal"
            width={380}
            height={380}
            unoptimized
            className="h-[108px] w-[108px]"
          />

          <h2 className="text-subheading font-bold text-yellow">EMAIL</h2>
          <a
            href="mailto:qac@pup.edu.ph"
            className="flex items-center gap-2 text-subheading font-bold transition-colors hover:text-yellow"
          >
            <Mail className="h-5 w-5 shrink-0" />
            <span className="underline">qac@pup.edu.ph</span>
          </a>

          <h2 className="mt-3 text-subheading font-bold text-yellow">
            CONTACT US
          </h2>
          <p className="flex items-center gap-2 text-subheading font-bold">
            <Phone className="h-5 w-5 shrink-0" />
            <span className="underline">
              (+632) 335-1787 or 335-1777 local 242
            </span>
          </p>
        </div>
      </div>

      <div className="border-t border-white/20 px-4 py-4 text-center text-regular sm:px-6 lg:px-8">
        © 2024 Polytechnic University of the Philippines
      </div>
    </footer>
  );
}
