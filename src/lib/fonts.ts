import { Cinzel_Decorative, Press_Start_2P, Oswald, Cairo } from "next/font/google";

// Gothic/distressed — Annabelle
export const fontGothic = Cinzel_Decorative({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-gothic",
  display: "swap",
});

// Retro display — Stranger Things
export const fontRetro = Press_Start_2P({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-retro",
  display: "swap",
});

// Stencil/industrial — Breaking Bad
export const fontIndustrial = Oswald({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-industrial",
  display: "swap",
});

// UI / body — Cairo works beautifully for Arabic and Latin
export const fontUI = Cairo({
  subsets: ["latin", "arabic"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-ui",
  display: "swap",
});
