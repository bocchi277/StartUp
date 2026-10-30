import { Bricolage_Grotesque, Fraunces, JetBrains_Mono, Mukta, Rozha_One } from "next/font/google";

// Latin display: Fraunces (variable, with soft + "wonky" axes).
export const fraunces = Fraunces({
  subsets: ["latin", "latin-ext"],
  axes: ["SOFT", "WONK", "opsz"],
  style: ["normal", "italic"],
  variable: "--font-fraunces",
  display: "swap",
});

// Latin text: Bricolage Grotesque.
export const bricolage = Bricolage_Grotesque({
  subsets: ["latin", "latin-ext"],
  axes: ["opsz", "wdth"],
  variable: "--font-bricolage",
  display: "swap",
});

// Ticket details, prices, codes.
export const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});

// Devanagari text (Hindi). Only downloaded when Devanagari glyphs are on the page.
export const mukta = Mukta({
  subsets: ["devanagari"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-mukta",
  display: "swap",
});

// Devanagari display, pairs with Fraunces in headings.
export const rozha = Rozha_One({
  subsets: ["devanagari"],
  weight: "400",
  variable: "--font-rozha",
  display: "swap",
});

export const fontVariables = [fraunces, bricolage, jetbrains, mukta, rozha].map((f) => f.variable).join(" ");
