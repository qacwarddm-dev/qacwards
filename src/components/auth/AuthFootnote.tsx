/**
 * Shared chrome under the auth card.
 *
 * ## 2026-08-21 redesign
 *
 * **Sizes.** The block ran at 10px and 9px in `--color-gray`. `--color-gray`
 * (#7B7979) is 4.39:1 on white — under the AA floor on its own — and 9px text in
 * it is not a realistic reading target for anyone. It is `t-meta` (10px, the
 * smallest size the token file carries) in `text-black/70` (~8.6:1), which is
 * the same substitution the public site made and for the same reason. The notes
 * flagged the copyright line as measuring ~7.5px in the prototype and therefore
 * shipping ~20% wider than the frame; that flag is now moot — no line on this
 * page goes under 10px by choice.
 *
 * **Layout.** It was a stacked centred column with a hand-set 41px gap before
 * the copyright. The links now sit on one wrapped row with real separators, so
 * the block is three lines on a phone instead of five and the tap targets are
 * far enough apart to hit individually.
 *
 * Copy is unchanged.
 */

const LINKS = [
  { label: "Terms of Use", href: "/terms" },
  { label: "Privacy Statement", href: "/privacy" },
];

export default function AuthFootnote() {
  return (
    <footer className="mt-auto flex flex-col items-center gap-[var(--space-2)] pt-[var(--space-6)] text-center">
      <p className="t-meta text-black/70">
        For other PUP Services, kindly visit our site{" "}
        <a
          href="https://www.pup.edu.ph"
          className="inline-block rounded-[var(--radius-sm)] px-[var(--space-1)] py-[6px] text-maroon underline underline-offset-[3px] hover:no-underline"
        >
          www.pup.edu.ph
        </a>
      </p>

      <p className="t-meta max-w-[46ch] text-balance text-black/70">
        By using this service, you understood and agree to the PUP Online Service
      </p>

      {/* `py-1` on the links buys the row height a 10px link cannot: the text is
          small by design here, the target does not have to be. */}
      <ul className="flex flex-wrap items-center justify-center gap-x-[var(--space-3)] gap-y-[var(--space-1)]">
        {LINKS.map((link) => (
          <li key={link.href}>
            <a
              href={link.href}
              className="t-meta inline-block rounded-[var(--radius-sm)] px-[var(--space-1)] py-[6px] text-maroon underline underline-offset-[3px] hover:no-underline"
            >
              {link.label}
            </a>
          </li>
        ))}
      </ul>

      <p className="t-meta max-w-[46ch] text-balance text-black/70">
        © 2025 Polytechnic University of the Philippines. All Rights Reserved.
      </p>
    </footer>
  );
}
