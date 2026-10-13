import { Bento } from "@/sections/bento";
import { Comparison } from "@/sections/comparison";
import { Faq } from "@/sections/faq";
import { FeatureStory } from "@/sections/feature-story";
import { FinalCta, Footer } from "@/sections/footer";
import { Hero } from "@/sections/hero";
import { HowItWorks } from "@/sections/how-it-works";
import { MarkerMarquee } from "@/sections/marquee";
import { Nav } from "@/sections/nav";
import { Numbers } from "@/sections/numbers";
import { Pricing } from "@/sections/pricing";
import { Trust } from "@/sections/trust";

export default function Home() {
  return (
    <>
      <a
        href="#main"
        className="sr-only z-50 rounded-md bg-card px-3 py-2 focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Skip to content
      </a>
      <Nav />
      <main id="main">
        <Hero />
        <MarkerMarquee />
        <HowItWorks />
        <FeatureStory />
        <Comparison />
        <Bento />
        <Numbers />
        <Trust />
        <Pricing />
        {/** Testimonials go here, after real customer quotes exist. Do not write invented ones. */}
        <Faq />
        <FinalCta />
      </main>
      <Footer />
    </>
  );
}
