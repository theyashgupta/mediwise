import { Check, Minus } from "lucide-react";
import { SectionHeader } from "@/components/section-header";
import { facts } from "@/lib/facts";

const rows = [
  { label: "Explained", pdf: "Test names and numbers", us: "Every marker in plain English or Hindi" },
  { label: "Scored", pdf: "The lab's printed range", us: "Ranges for your age, sex and ancestry" },
  { label: "Tracked", pdf: "One visit in each file", us: "Each marker across your visits" },
  {
    label: "Family",
    pdf: "A file for each person",
    us: `Up to ${facts.maxProfiles} profiles in one account`,
  },
  {
    label: "Flags for your doctor",
    pdf: "Easy to miss in a long report",
    us: "Scan lines and questions to take to your doctor",
  },
  { label: "Cost", pdf: "Comes with the test", us: `From ${facts.cheapest.perReport} a report` },
];

export function Comparison() {
  return (
    <section
      aria-labelledby="compare-title"
      className="mx-auto max-w-content px-4 py-12 md:px-8 md:py-20"
    >
      <SectionHeader
        id="compare-title"
        eyebrow="Compare"
        title="A lab PDF gives you numbers. MediWise tells you what they mean."
      />
      <div className="reveal mt-12 overflow-hidden rounded-xl border bg-card">
        <table className="w-full table-fixed text-left text-sm md:text-base">
          <caption className="sr-only">A standard lab PDF compared with MediWise</caption>
          <thead>
            <tr className="border-b">
              <th
                scope="col"
                className="w-[28%] px-4 py-4 font-normal text-muted-foreground md:px-6"
              >
                <span className="sr-only">Feature</span>
              </th>
              <th scope="col" className="px-4 py-4 font-medium text-muted-foreground md:px-6">
                A standard lab PDF
              </th>
              <th scope="col" className="bg-primary/6 px-4 py-4 font-semibold text-primary md:px-6">
                MediWise
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.map((row) => (
              <tr key={row.label}>
                <th scope="row" className="px-4 py-4 align-top font-medium md:px-6">
                  {row.label}
                </th>
                <td className="px-4 py-4 align-top text-muted-foreground md:px-6">
                  <span className="flex gap-2">
                    <Minus aria-hidden className="mt-0.5 hidden size-4 shrink-0 sm:block" />
                    {row.pdf}
                  </span>
                </td>
                <td className="bg-primary/6 px-4 py-4 align-top md:px-6">
                  <span className="flex gap-2">
                    <Check
                      aria-hidden
                      className="mt-0.5 hidden size-4 shrink-0 text-primary sm:block"
                    />
                    {row.us}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
