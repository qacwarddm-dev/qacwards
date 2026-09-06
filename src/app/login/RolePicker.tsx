import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { AuthAccountPrompt, AuthCard, AuthShell, BackLink } from "@/components/auth";

/**
 * Role picker at `/login` — the auth area's front door.
 *
 * ## 2026-08-21 redesign
 *
 * **The three roles were identical yellow rectangles with white labels.** Two
 * separate problems in one control: white on `--color-yellow` measures about
 * 1.9:1, an outright AA failure on the product's front door, and three
 * same-coloured blocks reading only "Academic Program / Internal Accreditor /
 * QAC Personnel" gave a first-time user nothing to choose *between*. They are
 * now rows: role, a line saying what that role does here, and a chevron. Yellow
 * survives as the accent bar that fills on hover — the palette is unchanged, it
 * is just no longer being asked to sit behind white text.
 *
 * **The tagline was the largest text on the screen**, set at `--text-heading`
 * bold maroon above a smaller "Welcome to QAC Website". The `<h1>` is now the
 * heading and the tagline is the eyebrow above it, which is the order they are
 * actually read in.
 *
 * **The seal moved to the shell masthead**, where it is on all eight screens
 * rather than this one.
 *
 * Still static: the buttons carry the chosen role to the form as `?as=`, which
 * is a cosmetic hint only — the account carries the real role once authenticated.
 */
const ROLES = [
  {
    label: "Academic Program",
    slug: "program_representative",
    blurb: "Prepare and submit your program’s accreditation documents.",
  },
  {
    label: "Internal Accreditor",
    slug: "internal_accreditor",
    blurb: "Evaluate assigned programs and record your findings.",
  },
  {
    label: "QAC Personnel",
    slug: "qac_personnel",
    blurb: "Run accreditation cycles, assignments and schedules.",
  },
];

export default function RolePicker() {
  return (
    // Back leaves the auth area entirely: this screen is the only way in from
    // the marketing site, so without it the browser's own Back is the sole way
    // out. Deliberate deviation from the frame (owner, 2026-08-20).
    <AuthShell topRight={<BackLink href="/" destination="the QAC website" />}>
      <AuthCard>
        <div className="auth-stagger flex flex-col gap-[var(--space-6)]">
          <div className="flex flex-col gap-[var(--space-2)]">
            {/* The tagline is the eyebrow, not the headline. It is set in
                black/70 rather than the brand yellow: #EFBF04 on white is
                1.9:1, so yellow can be a mark on this page but never the ink
                of a line someone has to read. */}
            <p className="t-eyebrow flex items-center gap-[var(--space-2)] text-black/70">
              <span aria-hidden className="h-[3px] w-[18px] rounded-full bg-yellow" />
              “PUP Ako, Tagumpay Ako!”
            </p>
            <h1 className="t-hero text-balance text-maroon">
              Welcome to the QAC Website
            </h1>
            <p className="t-sm text-pretty text-black/70">
              Choose how you work with the Quality Assurance Center to continue.
            </p>
          </div>

          <nav aria-label="Sign in as">
            <ul className="flex flex-col gap-[var(--space-3)]">
              {ROLES.map((role) => (
                <li key={role.slug}>
                  <Link
                    href={`/login?as=${role.slug}`}
                    className="group relative flex min-h-[var(--auth-control-h)] items-center gap-[var(--space-3)] overflow-hidden rounded-[var(--radius-lg)] border border-[var(--hairline-strong)] bg-white p-[var(--space-4)] pl-[var(--space-5)] transition-[border-color,background-color] duration-[var(--motion-fast)] ease-[var(--ease-out)] hover:border-maroon hover:bg-[var(--tint-maroon)]"
                  >
                    {/* Grows from a hairline to a bar on hover/focus. Decorative
                        — the row already states which role it is. */}
                    <span
                      aria-hidden
                      className="absolute inset-y-0 left-0 w-[4px] bg-yellow transition-[width] duration-[var(--motion-base)] ease-[var(--ease-out)] group-hover:w-[8px] group-focus-visible:w-[8px]"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="t-body-strong block text-maroon">
                        {role.label}
                      </span>
                      <span className="t-sm mt-[2px] block text-pretty text-black/70">
                        {role.blurb}
                      </span>
                    </span>
                    <ChevronRight
                      className="h-[18px] w-[18px] shrink-0 text-maroon transition-transform duration-[var(--motion-fast)] group-hover:translate-x-[2px]"
                      strokeWidth={2}
                      aria-hidden
                    />
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <AuthAccountPrompt to="register" />
        </div>
      </AuthCard>
    </AuthShell>
  );
}
