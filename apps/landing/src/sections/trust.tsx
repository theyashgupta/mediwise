import { CreditCard, IdCard, MapPin, Scale, Stethoscope } from "lucide-react";

const items = [
  {
    icon: MapPin,
    title: "Stored in India",
    body: "We store your reports and results on Supabase servers in Mumbai.",
  },
  {
    icon: Scale,
    title: "Built to follow the DPDP Act 2023",
    body: "India's law on digital personal data.",
  },
  {
    icon: Stethoscope,
    title: "No diagnosis",
    body: "MediWise explains your results. Your doctor makes the diagnosis.",
  },
  {
    icon: IdCard,
    title: "Identity pages removed",
    body: "When MediWise reads your files, it removes pages such as Aadhaar or PAN cards.",
  },
  { icon: CreditCard, title: "UPI and cards", body: "Payments go through Cashfree." },
];

export function Trust() {
  return (
    <section aria-labelledby="trust-title" className="border-y bg-card">
      <div className="mx-auto max-w-content px-4 py-12 md:px-8 md:py-16">
        <h2 id="trust-title" className="sr-only">
          How MediWise handles your data
        </h2>
        <ul className="grid gap-8 sm:grid-cols-2 lg:grid-cols-5 lg:gap-6">
          {items.map(({ icon: Icon, title, body }) => (
            <li key={title}>
              <Icon aria-hidden className="size-5 text-primary" />
              <h3 className="mt-3 text-sm font-semibold">{title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{body}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
