import type { Metadata } from "next";
import { fontVariables } from "@/lib/fonts";
import "./globals.css";

/**
 * Root layout — `<html>`, fonts and the stylesheet, and nothing else.
 *
 * Chrome moved out in B2's `(public)` route-group migration: the public navbar
 * and footer now live in `(public)/layout.tsx`, the portal has its own shell in
 * `portal/layout.tsx`, and the auth screens bring their own. Nothing here has to
 * know which of the three is rendering, which is why `SiteChrome` and its
 * pathname check could be deleted.
 */
export const metadata: Metadata = {
  title: "QAC-WARDDM",
  description:
    "Quality Assurance Center of the Polytechnic University of the Philippines.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${fontVariables} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-main">{children}</body>
    </html>
  );
}
