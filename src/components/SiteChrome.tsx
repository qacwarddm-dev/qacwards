"use client";

import { usePathname } from "next/navigation";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";

/**
 * TEMPORARY. The portal ships its own top bar and sidebar, so the public
 * navbar/footer must not render under /portal — but they currently live in the
 * root layout, which applies to every route.
 *
 * Delete this file when the `(public)` route-group migration lands
 * (plans/03-auth-role-gate.md). That migration moves the chrome into
 * `src/app/(public)/layout.tsx`, where it stops reaching /portal by itself.
 */
export default function SiteChrome({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();

  if (pathname.startsWith("/portal")) return <>{children}</>;

  // The auth screens carry their own footnote inside the panel and fill the
  // window, so the site footer would push them into a scroll. Same shape as the
  // /portal case above, and it goes away with the same route-group migration.
  const isAuth = pathname === "/login" || pathname.startsWith("/register");

  return (
    <>
      <Navbar />
      <main className={isAuth ? "flex flex-1 flex-col" : "flex-1"}>
        {children}
      </main>
      {!isAuth && <Footer />}
    </>
  );
}
