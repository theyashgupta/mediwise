import { Phone, Screen, type ScreenName } from "@/components/phone";

export type PhoneStep = { title: string; body: string; screen: ScreenName; alt: string };

export function PhoneSteps({ steps }: { steps: PhoneStep[] }) {
  return (
    <ol className="mt-14 grid gap-12 md:grid-cols-3 md:gap-8">
      {steps.map((step, index) => (
        <li key={step.title} className="reveal flex flex-col">
          <p className="font-mono text-sm text-primary">0{index + 1}</p>
          <h3 className="mt-2 text-xl font-semibold">{step.title}</h3>
          <p className="mt-2 text-muted-foreground">{step.body}</p>
          <div className="mt-8 px-6 md:px-2 lg:px-6">
            <Phone className="mx-auto max-w-[260px]">
              <Screen name={step.screen} alt={step.alt} />
            </Phone>
          </div>
        </li>
      ))}
    </ol>
  );
}
