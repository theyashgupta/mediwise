import { Noto_Sans_Devanagari } from "next/font/google";
import type { ReactNode } from "react";
import { Document } from "@/components/document";
import { pageMetadata } from "@/lib/metadata";

export { viewport } from "@/lib/metadata";

const devanagari = Noto_Sans_Devanagari({
  subsets: ["devanagari"],
  variable: "--font-devanagari",
  display: "swap",
});

export const metadata = pageMetadata("hi");

export default function HindiLayout({ children }: { children: ReactNode }) {
  return (
    <Document locale="hi" fontClassName={devanagari.variable}>
      {children}
    </Document>
  );
}
