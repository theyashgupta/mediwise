import { FileText, HeartPulse, Printer, Upload, Users } from "lucide-react";
import type { ReactNode } from "react";
import { SectionHeader } from "@/components/section-header";
import { messages, type Locale } from "@/config/messages";
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
export function Bento({ locale }: { locale: Locale }) {
  const t = messages[locale].bento;
  return (
    <section aria-labelledby="bento-title" className="border-t bg-sidebar">
      <div className="mx-auto max-w-content px-4 py-12 md:px-8 md:py-20">
        <SectionHeader id="bento-title" eyebrow={t.eyebrow} title={t.title} />
        <ul className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Cell
            className="md:col-span-2"
            icon={<Upload aria-hidden className="size-4" />}
            title={t.files.title(facts.maxFiles)}
            body={t.files.body(facts.maxFileMb, facts.maxTotalMb)}
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
            title={t.family.title}
            body={t.family.body(facts.maxProfiles)}
          >
            <ul className="flex flex-wrap gap-2">
              {t.family.people.map((person) => (
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
            title={t.cost.title}
            body={t.cost.body(
              facts.firstPack.price,
              facts.cheapest.perReport,
              facts.cheapest.credits,
            )}
          >
            <p className="font-mono text-4xl tracking-tight">{facts.cheapest.perReport}</p>
          </Cell>
          <Cell
            className="md:col-span-2"
            icon={<HeartPulse aria-hidden className="size-4" />}
            title={t.trends.title}
            body={t.trends.body}
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
            title={t.doctor.title}
            body={t.doctor.body}
          />
          <Cell
            icon={<FileText aria-hidden className="size-4" />}
            title={t.studies.title}
            body={t.studies.body}
          />
        </ul>
      </div>
    </section>
  );
}
