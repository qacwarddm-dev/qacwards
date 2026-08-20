import { Search } from "lucide-react";

/**
 * Keyword search box that sits above every document-browser screen.
 * Measured 493x42.5, 8px radius, 1px maroon border, centred in the content area.
 *
 * Shipped inert with the static screens (plans/BACKEND.md §8.2). B3 gave it the
 * controlled `value`/`onChange` pair it needed to actually filter, and a
 * `className` escape for the one caller that is not in a 493px column — both as
 * props on the component rather than a second search box living beside it.
 *
 * `aria-label` is a prop for the same reason: "Search documents" is wrong on a
 * screen that searches programmes, and a stale label is worse than none.
 */
export default function SearchField({
  placeholder = "Enter keyword",
  label = "Search documents",
  value,
  onChange,
  className = "w-[493px]",
}: {
  placeholder?: string;
  label?: string;
  value?: string;
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
  className?: string;
}) {
  return (
    <div
      className={`flex h-[42.5px] items-center gap-[10px] rounded-lg border border-maroon bg-white px-[21px] ${className}`}
    >
      <Search
        className="h-[20px] w-[20px] shrink-0 text-black"
        strokeWidth={2.5}
        aria-hidden
      />
      <input
        type="search"
        placeholder={placeholder}
        aria-label={label}
        {...(value !== undefined ? { value, onChange } : {})}
        className="min-w-0 flex-1 bg-transparent text-subheading leading-none text-black outline-none placeholder:text-gray focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-maroon"
      />
    </div>
  );
}
