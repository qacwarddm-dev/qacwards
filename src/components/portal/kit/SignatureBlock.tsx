/* eslint-disable @next/next/no-img-element -- signed Supabase URLs expire in 60s and no remotePatterns host is configured, so next/image cannot serve them */

/**
 * "Signed by" — round 2 §4's render step, wherever accreditor sign-off appears.
 *
 * One component so the mark always arrives with the name and the date under it:
 * a signature image on its own says who drew it only to whoever recognises the
 * handwriting, which is not a property a record can rely on.
 *
 * An accreditor who never captured a signature still gets a block, with a
 * printed name over the rule instead of an image. That is the honest fallback —
 * the sheet still records who signed off — and it is what makes the block safe
 * to place unconditionally.
 */
export default function SignatureBlock({
  name,
  signatureUrl,
  caption,
  date,
}: {
  name: string;
  signatureUrl: string | null;
  /** Role or capacity under the rule — "Internal Accreditor" on an evaluation. */
  caption?: string;
  /** Already formatted by the caller: this is a presentational component and
   *  has no business deciding the portal's timezone (§8.4 says Manila). */
  date?: string;
}) {
  return (
    <div className="w-[220px]">
      <div className="flex h-[64px] items-end justify-center">
        {signatureUrl ? (
          <img
            src={signatureUrl}
            alt={`Signature of ${name}`}
            className="max-h-[64px] w-auto object-contain"
          />
        ) : (
          <span className="pb-[6px] text-subheading italic leading-none text-gray">
            {name}
          </span>
        )}
      </div>
      <div className="mt-[4px] border-t border-black/60 pt-[6px] text-center">
        <span className="block text-regular font-semibold leading-none text-black">{name}</span>
        {caption && (
          <span className="mt-[3px] block text-regular leading-none text-gray">{caption}</span>
        )}
        {date && (
          <span className="mt-[3px] block text-regular leading-none text-gray">{date}</span>
        )}
      </div>
    </div>
  );
}
