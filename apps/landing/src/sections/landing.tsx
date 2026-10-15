import { MotionObservers } from "@/components/motion";
import { messages, type Locale } from "@/config/messages";
import { Comparison } from "@/sections/comparison";
import { Faq } from "@/sections/faq";
import { Features } from "@/sections/features";
import { FinalCta, Footer } from "@/sections/footer";
import { Hero } from "@/sections/hero";
import { HowItWorks } from "@/sections/how-it-works";
import { MarkerMarquee } from "@/sections/marquee";
import { Nav } from "@/sections/nav";
import { Numbers } from "@/sections/numbers";
import { Pricing } from "@/sections/pricing";
import { Trust } from "@/sections/trust";

export function Landing({ locale }: { locale: Locale }) {
  return (
    <>
      <a
        href="#main"
        className="sr-only z-50 rounded-md bg-card px-3 py-2 focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        {messages[locale].site.skipToContent}
      </a>
      <Nav locale={locale} />
      <main id="main">
        <Hero locale={locale} />
        <HowItWorks locale={locale} />
        <Numbers locale={locale} />
        <Comparison locale={locale} />
        <Features locale={locale} />
        <MarkerMarquee locale={locale} />
        <Trust locale={locale} />
        <Pricing locale={locale} />
        {/** Testimonials go here, after real customer quotes exist. Do not write invented ones. */}
        <Faq locale={locale} />
        <FinalCta locale={locale} />
      </main>
      <Footer locale={locale} />
      <MotionObservers />
    </>
  );
}
