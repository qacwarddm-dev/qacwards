import {
  Inria_Serif,
  Inter,
  Playfair_Display_SC,
  Poppins,
  Roboto_Serif,
} from "next/font/google";

// One export per --font-* token in design/figma-tokens.md.

export const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const playfairDisplaySC = Playfair_Display_SC({
  subsets: ["latin"],
  weight: ["400", "700", "900"],
  variable: "--font-playfair-display-sc",
  display: "swap",
});

export const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
});

export const inriaSerif = Inria_Serif({
  subsets: ["latin"],
  weight: ["300", "400", "700"],
  variable: "--font-inria-serif",
  display: "swap",
});

export const robotoSerif = Roboto_Serif({
  subsets: ["latin"],
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
