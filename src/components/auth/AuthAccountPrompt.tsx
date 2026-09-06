import Link from "next/link";

/**
 * The "you're on the wrong flow" line under an auth card's primary action:
 * "Don't have an account? Register" on the login side, "Already have an account?
 * Log in" on the register side.
 *
 * 2026-08-21: the lead was `--color-gray` at 12px with an un-underlined maroon
 * link, so the only thing marking the link as a link was its colour — which
 * fails WCAG 1.4.1 (use of colour) and, at maroon on grey, was not much of a
 * colour difference either. Lead is `text-black/70`, the link is underlined and
 * padded to a real target.
 *
 * The frames' own wording was "Doesn’t have an Account?", kept verbatim through
 * every earlier pass. Corrected here: it is a grammatical error on the front
 * door of the product, the capitalisation was inconsistent with every other
 * sentence on these screens, and no other copy in the flow is now frame-verbatim
 * either.
 */
const PROMPTS = {
  register: {
    lead: "Don’t have an account?",
    href: "/register",
    label: "Register",
  },
  login: {
    lead: "Already have an account?",
    href: "/login",
    label: "Log in",
  },
} as const;

export default function AuthAccountPrompt({
  /** Which flow to offer — the one the current screen is *not* on. */
  to,
}: {
  to: keyof typeof PROMPTS;
}) {
  const { lead, href, label } = PROMPTS[to];

  return (
    <p className="t-sm flex flex-wrap items-center justify-center gap-x-[var(--space-1)] text-black/70">
      {lead}
      <Link
        href={href}
        className="inline-block rounded-[var(--radius-sm)] px-[var(--space-1)] py-[6px] font-semibold text-maroon underline underline-offset-[3px] hover:no-underline"
      >
        {label}
      </Link>
    </p>
  );
}
