// src/app/fonts.ts
import { Inter, Hind } from "next/font/google";

export const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const hind = Hind({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-hind",
  display: "swap",
});
