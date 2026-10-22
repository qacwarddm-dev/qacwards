import localFont from "next/font/local";

// One export per --font-* token in design/figma-tokens.md. Self-hosted so the
// app renders the same with no internet (offline defense) and no build-time
// fetch from Google.

export const inter = localFont({
  src: "../fonts/inter-latin-wght-normal.woff2",
  weight: "100 900",
  variable: "--font-inter",
  display: "swap",
});

export const playfairDisplaySC = localFont({
  src: [
    { path: "../fonts/playfair-display-sc-latin-400-normal.woff2", weight: "400" },
    { path: "../fonts/playfair-display-sc-latin-700-normal.woff2", weight: "700" },
    { path: "../fonts/playfair-display-sc-latin-900-normal.woff2", weight: "900" },
  ],
  variable: "--font-playfair-display-sc",
  display: "swap",
});

export const poppins = localFont({
  src: [
    { path: "../fonts/poppins-latin-400-normal.woff2", weight: "400" },
    { path: "../fonts/poppins-latin-500-normal.woff2", weight: "500" },
    { path: "../fonts/poppins-latin-600-normal.woff2", weight: "600" },
    { path: "../fonts/poppins-latin-700-normal.woff2", weight: "700" },
  ],
  variable: "--font-poppins",
  display: "swap",
});

export const inriaSerif = localFont({
  src: [
    { path: "../fonts/inria-serif-latin-300-normal.woff2", weight: "300" },
    { path: "../fonts/inria-serif-latin-400-normal.woff2", weight: "400" },
    { path: "../fonts/inria-serif-latin-700-normal.woff2", weight: "700" },
  ],
  variable: "--font-inria-serif",
  display: "swap",
});

export const robotoSerif = localFont({
  src: "../fonts/roboto-serif-latin-wght-normal.woff2",
  weight: "100 900",
  variable: "--font-roboto-serif",
  display: "swap",
});

export const fontVariables = [
  inter.variable,
  playfairDisplaySC.variable,
  poppins.variable,
  inriaSerif.variable,
  robotoSerif.variable,
].join(" ");
