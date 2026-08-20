import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";

/**
 * The public site's chrome.
 *
 * `(public)` is a **route group**: the parentheses scope this layout without
 * contributing a segment, so every URL under it is byte-identical to what it was
 * before the migration — `/`, `/about`, `/accreditations`, `/gov-recognitions`.
 *
 * This is what `SiteChrome` was standing in for. That component had to ask
 * `usePathname()` whether it was under /portal and render nothing if so, which
 * made the root layout a client component's problem and put the public navbar one
 * mistake away from appearing inside the portal. Scoping the chrome to the routes
 * that want it removes the question instead of answering it.
 *
 * `login/` and `register/` deliberately stay outside this group: the auth screens
 * fill the window and carry their own footnote, so the site footer would push
 * them into a scroll (plans/03-auth-role-gate.md §Migration step 3).
 */
export default function PublicLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      {/* First focusable element on the page (09a §A.7) — there was none before. */}
      <a
        href="#main"
        className="sr-only rounded-full bg-maroon px-4 py-2 text-white focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100]"
      >
        Skip to content
      </a>
      <Navbar />
      <main id="main" className="flex-1">
        {children}
      </main>
      <Footer />
    </>
  );
}
