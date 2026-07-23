import { CoverCard } from "@/components/portal/kit";

/** Documents landing — assets/FIGMA/qac_personnel/02-Documents.png */
const ENTRIES = [
  { label: "MAIN CAMPUS", href: "/portal/documents/main-campus" },
  { label: "CAMPUSES", href: "/portal/documents/campuses" },
];

export default function DocumentsPage() {
  return (
    <div className="pt-[118px] pb-[45px] pl-[203.5px] pr-[74px]">
      <p className="w-[851px] text-center text-subheading leading-none text-gray">
        Click the <strong className="font-bold text-maroon">Campus</strong> to see
        all the document files.
      </p>

      <div className="mt-[70px] flex gap-[149px]">
        {ENTRIES.map((e) => (
          <CoverCard
            key={e.href}
            label={e.label}
            href={e.href}
            image="/assets/portal/documents-cover.jpg"
          />
        ))}
      </div>
    </div>
  );
}
