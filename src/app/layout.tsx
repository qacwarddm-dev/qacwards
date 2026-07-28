import type { Metadata } from "next";
import SiteChrome from "@/components/SiteChrome";
import { fontVariables } from "@/lib/fonts";
import "./globals.css";

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
      <body className="flex min-h-full flex-col font-main">
        <SiteChrome>{children}</SiteChrome>
      </body>
    </html>
  );
}
