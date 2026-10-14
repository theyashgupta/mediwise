import { Instrument_Serif } from "next/font/google";
import type { ReactNode } from "react";
import { Document } from "@/components/document";
import { pageMetadata } from "@/lib/metadata";

export { viewport } from "@/lib/metadata";

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-instrument-serif",
  display: "swap",
  preload: false,
});

export const metadata = pageMetadata("en");

export default function EnglishLayout({ children }: { children: ReactNode }) {
  return (
    <Document locale="en" fontClassName={instrumentSerif.variable}>
      {children}
    </Document>
  );
}
