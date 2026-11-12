import { Phone, Screen, type ScreenName } from "@/components/phone";
import { SectionHeader } from "@/components/section-header";
import { messages, type Locale } from "@/config/messages";
import { facts } from "@/lib/facts";

type Step = { title: string; body: string; screen: ScreenName; alt: string };

export function HowItWorks({ locale }: { locale: Locale }) {
  const { howItWorks: how, story } = messages[locale];
  const steps: Step[] = [
    {
      title: how.upload.title,
      body: how.upload.body(facts.maxFiles),
      screen: "upload",
      alt: how.upload.alt(facts.maxFiles),
    },
    { ...story.moveFirst, screen: "move-first" },
    { ...how.understand, screen: "marker" },
    { ...story.findings, screen: "findings" },
    { ...story.alert, screen: "alert" },
    { ...how.track, screen: "trends" },
  ];
  return (
    <section
      id="how-it-works"
      aria-labelledby="how-title"
      className="story-section mx-auto max-w-content px-4 pt-12 pb-16 md:px-8 md:pt-20 lg:pb-24"
    >
      <SectionHeader id="how-title" eyebrow={how.eyebrow} title={how.title}>
        {how.body}
      </SectionHeader>
      <p className="mt-3 max-w-2xl text-sm text-muted-foreground">{story.body}</p>
      <ol className="mt-10 space-y-16 lg:mt-16 lg:space-y-24">
        {steps.map((step, index) => (
          <li
            key={step.screen}
            data-reveal=""
            className="lg:grid lg:grid-cols-2 lg:items-center lg:gap-x-16"
          >
            <div className={index % 2 ? "lg:order-last" : undefined}>
              <p className="font-mono text-sm text-primary">0{index + 1}</p>
              <h3 className="mt-2 text-2xl font-semibold tracking-tight">{step.title}</h3>
              <p className="mt-3 max-w-md text-lg text-muted-foreground">{step.body}</p>
            </div>
            <Phone className="mx-auto mt-8 max-w-[260px] lg:mt-0 lg:max-w-[300px]">
              <Screen name={step.screen} alt={step.alt} loading={index ? "lazy" : "eager"} />
            </Phone>
          </li>
        ))}
      </ol>
    </section>
  );
}
