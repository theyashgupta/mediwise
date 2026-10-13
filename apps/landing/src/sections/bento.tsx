import { FileText, HeartPulse, Printer, Upload, Users } from "lucide-react";
import type { ReactNode } from "react";
import { SectionHeader } from "@/components/section-header";
import { facts } from "@/lib/facts";
import { cn } from "@/lib/utils";

function Cell({
  icon,
  title,
  body,
  children,
  className,
}: {
  icon: ReactNode;
  title: string;
  body: string;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <li
      className={cn(
        "group flex flex-col overflow-hidden rounded-xl border bg-card p-6 transition-colors duration-200 hover:border-primary/40",
        className,
      )}
    >
      <div className="flex size-9 items-center justify-center rounded-md bg-muted text-primary transition-transform duration-200 group-hover:-translate-y-0.5">
        {icon}
      </div>
      <h3 className="mt-4 font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{body}</p>
      {children && <div className="mt-6 flex flex-1 items-end">{children}</div>}
    </li>
  );
}

const files = ["report.pdf", "page-1.jpg", "page-2.jpg", "ecg.pdf", "scan.heic"];
const people = ["Me", "Partner", "Parent", "Child"];

export function Bento() {
  return (
    <section aria-labelledby="bento-title" className="border-t bg-sidebar">
      <div className="mx-auto max-w-content px-4 py-12 md:px-8 md:py-20">
        <SectionHeader
          id="bento-title"
          eyebrow="Features"
          title="Built for the reports Indian labs print"
        />
        <ul className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Cell
            className="md:col-span-2"
            icon={<Upload aria-hidden className="size-4" />}
            title={`Up to ${facts.maxFiles} files in one report`}
            body={`PDF, JPG, PNG, HEIC or WebP. Each file up to ${facts.maxFileMb} MB, ${facts.maxTotalMb} MB in total.`}
          >
            <div className="w-full rounded-lg border border-dashed p-4">
              <ul className="flex flex-wrap gap-2">
                {files.map((file) => (
                  <li
                    key={file}
                    className="rounded-md border bg-background px-2.5 py-1 font-mono text-xs text-muted-foreground transition-transform duration-200 group-hover:-translate-y-0.5"
                  >
                    {file}
                  </li>
                ))}
              </ul>
            </div>
          </Cell>
          <Cell
            icon={<Users aria-hidden className="size-4" />}
            title="Family profiles"
            body={`Up to ${facts.maxProfiles} profiles. Each person gets ranges for their own age, sex and ancestry.`}
          >
            <ul className="flex flex-wrap gap-2">
              {people.map((person) => (
                <li
                  key={person}
                  className="rounded-full border bg-background px-3 py-1 text-xs font-medium transition-transform duration-200 group-hover:-translate-y-0.5"
                >
                  {person}
                </li>
              ))}
            </ul>
          </Cell>
          <Cell
            icon={<span className="font-mono text-sm">₹</span>}
            title="Cost per report"
            body={`${facts.firstPack.price} for one report. ${facts.cheapest.perReport} a report in the pack of ${facts.cheapest.credits}.`}
          >
            <p className="font-mono text-4xl tracking-tight">{facts.cheapest.perReport}</p>
          </Cell>
          <Cell
            className="md:col-span-2"
            icon={<HeartPulse aria-hidden className="size-4" />}
            title="Trends"
            body="See each marker across visits, with your optimal range as a band."
          >
            <svg viewBox="0 0 200 60" aria-hidden className="h-16 w-full">
              <rect x="0" y="18" width="200" height="22" className="fill-optimal-soft" />
              <polyline
                points="6,48 56,36 106,30 156,22 194,26"
                fill="none"
                strokeWidth="2"
                className="stroke-chart-1"
              />
              {[
                [6, 48],
                [56, 36],
                [106, 30],
                [156, 22],
                [194, 26],
              ].map(([x, y]) => (
                <circle
                  key={x}
                  cx={x}
                  cy={y}
                  r="3.5"
                  className="fill-card stroke-chart-1"
                  strokeWidth="2"
                />
              ))}
            </svg>
          </Cell>
          <Cell
            icon={<Printer aria-hidden className="size-4" />}
            title="A summary for your doctor"
            body="Print your results on one clean page, black on white, to take to your visit."
          />
          <Cell
            icon={<FileText aria-hidden className="size-4" />}
            title="ECG, ultrasound and X-ray reports"
            body="MediWise copies the printed words and values from each study. It does not read the scan images."
          />
        </ul>
      </div>
    </section>
  );
}
