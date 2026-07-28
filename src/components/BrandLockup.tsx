import Image from "next/image";

/**
 * PUP seal + "Polytechnic University of the Philippines" + "QUALITY ASSURANCE
 * CENTER". One component for both bars because the client asked for exactly
 * that (2026-07-26): the same proportions, differing only in colour.
 *
 * The two had drifted, and not where it looked like they had. Both wordmarks
 * were already 20px Poppins bold at an identical 291px ink width — measured on
 * the client's own screenshots, which is why simply enlarging it would have been
 * wrong. What differed was everything around it: the public bar set the
 * university line at 15px against the portal's 10 and the seal at 56px against
 * 45, so the wordmark stopped dominating its block and read as the smaller of
 * the two. Matching the block fixes the proportion the client was pointing at.
 *
 * Values are the portal's, measured off assets/FIGMA/qac_personnel/01-Dashboard
 * (a 2x export, halved): seal 45px tall, university line 10px on a 12.5px line,
 * wordmark 20px caps, 15px between seal and text.
 *
 * The 8px offset holds the text where the portal frame draws it: that frame's
 * bar is 59px with a centred 45px seal (top 7) and the text block at 15, so the
 * text sits 8px below the seal's top. Anchoring to the seal rather than to the
 * bar is what lets both 80px bars centre the same lockup and get the same
 * result.
 *
 * This renders at its measured size and does no scaling of its own. Both bars
 * are unscaled chrome, and both wrap it in `.brand-lockup` (globals.css), which
 * is the single place the width factor is applied. Scaling here would
 * double-apply it.
 */
export default function BrandLockup({ tone }: { tone: "maroon" | "white" }) {
  return (
    <span className="flex shrink-0 items-start">
      <Image
        src="/assets/logos/qac.png"
        alt="Quality Assurance Center seal"
        width={3568}
        height={2880}
        className="h-[45px] w-auto shrink-0 object-contain"
        priority
      />
      <span
        className={`mt-[8px] ml-[15px] flex flex-col ${
          tone === "white" ? "text-white" : "text-maroon"
        }`}
      >
        <span className="font-pup text-small leading-[12.5px]">
          Polytechnic University of the Philippines
        </span>
        <span className="font-qac text-heading leading-[20px] font-bold uppercase">
          Quality Assurance Center
        </span>
      </span>
    </span>
  );
}
