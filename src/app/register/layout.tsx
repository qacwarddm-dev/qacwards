/**
 * The auth screens fill the window rather than flowing under site chrome, so they
 * need the `flex-1` column `SiteChrome` used to give them when it recognised the
 * path. Scoped here instead, which is the same removal-of-a-question the
 * `(public)` group performs for the marketing pages.
 *
 * No navbar and no footer on purpose: `AuthShell` draws its own frame and carries
 * its own footnote inside the panel, and the site footer would push the card into
 * a scroll.
 */
export default function RegisterLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <main className="flex flex-1 flex-col">{children}</main>;
}
