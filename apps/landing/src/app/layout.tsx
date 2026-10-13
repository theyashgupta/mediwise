import type { Metadata, Viewport } from "next";
import { Instrument_Serif, Inter, JetBrains_Mono } from "next/font/google";
import type { ReactNode } from "react";
import { siteUrl } from "@/lib/site";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  preload: false,
});
const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-instrument-serif",
  display: "swap",
});
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
  preload: false,
});

const description =
  "Upload a lab report as a PDF or photos. MediWise explains every marker, scores it for your age, sex and ancestry, and tracks it across visits.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "MediWise: your lab report, explained marker by marker",
  description,
  alternates: { canonical: "/" },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    type: "website",
    url: "/",
    siteName: "MediWise",
    title: "MediWise: your lab report, explained marker by marker",
    description,
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "MediWise" }],
  },
  twitter: { card: "summary_large_image", images: ["/og-image.png"] },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FBFAF7" },
    { media: "(prefers-color-scheme: dark)", color: "#181715" },
  ],
};

const restoreMotion = `try{if(localStorage.getItem("motion")==="paused")document.documentElement.dataset.motion="paused"}catch(e){}`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en-IN"
      className={`${inter.variable} ${instrumentSerif.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <link
          rel="preload"
          as="image"
          href="/screens/report-light.webp"
          media="(prefers-color-scheme: light)"
          fetchPriority="high"
        />
        <link
          rel="preload"
          as="image"
          href="/screens/report-dark.webp"
          media="(prefers-color-scheme: dark)"
          fetchPriority="high"
        />
        <script dangerouslySetInnerHTML={{ __html: restoreMotion }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
