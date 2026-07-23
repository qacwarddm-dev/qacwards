import { Search } from "lucide-react";

/**
 * Keyword search box that sits above every document-browser screen.
 * Measured 493x42.5, 8px radius, 1px maroon border, centred in the content area.
 */
export default function SearchField({
  placeholder = "Enter keyword",
}: {
  placeholder?: string;
}) {
  return (
    <div className="flex h-[42.5px] w-[493px] items-center gap-[10px] rounded-lg border border-maroon bg-white px-[21px]">
      <Search className="h-[20px] w-[20px] shrink-0 text-black" strokeWidth={2.5} aria-hidden />
      <input
        type="search"
        placeholder={placeholder}
        aria-label="Search documents"
        className="min-w-0 flex-1 bg-transparent text-subheading leading-none text-black outline-none placeholder:text-gray"
      />
    </div>
  );
}
