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
  return (
    <h2 className="text-heading font-bold text-yellow">{children}</h2>
  );
}

export default function Footer() {
  return (
    <footer className="bg-maroon font-footer text-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-2 lg:grid-cols-4 lg:px-8">
        <div className="flex flex-col gap-3">
          <Image
            src="/assets/logos/republika-ng-pilipinas.png"
            alt="Republika ng Pilipinas seal"
            width={80}
            height={80}
            className="h-20 w-20 object-contain"
          />
          <ColumnHeading>Republika ng Pilipinas</ColumnHeading>
          <p className="text-regular">
            All content is public domain unless otherwise stated.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <ColumnHeading>About GOVPH</ColumnHeading>
          <p className="text-regular">
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

        <div className="flex flex-col gap-3">
          <Image
            src="/assets/logos/qac.png"
            alt="Quality Assurance Center seal"
            width={80}
            height={80}
            className="h-20 w-20 object-contain"
          />
          <div className="flex items-start gap-2">
            <Mail className="mt-0.5 h-4 w-4 shrink-0 text-yellow" />
            <a
              href="mailto:qac@pup.edu.ph"
              className="text-regular transition-colors hover:text-yellow"
            >
              qac@pup.edu.ph
            </a>
          </div>
          <div className="flex items-start gap-2">
            <Phone className="mt-0.5 h-4 w-4 shrink-0 text-yellow" />
            <p className="text-regular">
              <span className="block font-bold">Contact Us</span>
              (+632) 335-1787 or 335-1777 local 242
            </p>
          </div>
        </div>
      </div>

      <div className="border-t border-white/20 px-4 py-4 text-center text-regular sm:px-6 lg:px-8">
        © 2024 Polytechnic University of the Philippines
      </div>
    </footer>
  );
}
