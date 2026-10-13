import { FileImage } from "lucide-react";
import { useT } from "@/common/hooks/use-locale";
import { formatPlainDate } from "@/common/utils/date";
import { Section } from "@/common/components/section";
import { StatusBadge } from "@/common/components/status-badge";
import { printedLines, studyTitle } from "../config/studies";
import type { Study } from "../types";
import { MarkerValue } from "./marker-value";

type StudyListProps = {
  studies: Study[];
  images: string[];
};

const dateOptions = { day: "numeric", month: "short", year: "numeric" } as const;

function StudyCard({ study }: { study: Study }) {
  const t = useT();
  const impressionLabels: Partial<Record<Study["kind"], string>> =
    t.report.studies.impressionLabels;
  const impression = printedLines(study.impression);
  const findings = printedLines(study.findings);
  const familyHistory = printedLines(study.familyHistory);
  const pathology = [
    { label: t.report.studies.result, value: study.result },
    { label: t.report.studies.specimen, value: study.specimen },
    { label: t.report.studies.adequacy, value: study.adequacy },
  ].filter((row) => row.value);
  const source = [
    study.performedAt && formatPlainDate(study.performedAt, dateOptions),
    study.signedBy && t.report.studies.signedBy(study.signedBy),
    study.fileName && t.report.studies.page(study.fileName, study.page),
  ].filter(Boolean);
  return (
    <article className="flex h-full flex-col gap-4 rounded-xl border bg-card p-5">
      <div className="space-y-1.5">
        <h3 className="text-sm font-medium text-muted-foreground">
          {studyTitle(study)}
          <span> · {impressionLabels[study.kind] ?? t.report.studies.impression}</span>
        </h3>
        {impression.length > 0 ? (
          impression.map((line) => (
            <p key={line} className="text-lg font-semibold text-balance">
              {line}
            </p>
          ))
        ) : (
          <p className="text-muted-foreground">{t.report.studies.noImpression}</p>
        )}
      </div>
      {pathology.length > 0 && (
        <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-1.5 text-sm">
          {pathology.map((row) => (
            <div key={row.label} className="contents">
              <dt className="text-muted-foreground">{row.label}</dt>
              <dd>{row.value}</dd>
            </div>
          ))}
        </dl>
      )}
      {study.measurements.length > 0 && (
        <ul className="divide-y rounded-lg border" aria-label={t.report.studies.measurements}>
          {study.measurements.map((measurement) => (
            <li
              key={measurement.key}
              className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-3 py-2"
            >
              <span className="flex flex-wrap items-center gap-2 text-sm">
                {measurement.name}
                {measurement.status !== "unknown" && <StatusBadge status={measurement.status} />}
              </span>
              <MarkerValue
                value={measurement.valueText ? null : measurement.value}
                valueText={measurement.valueText}
                unit={measurement.unit}
                precision={measurement.precision}
                className="text-sm"
              />
            </li>
          ))}
        </ul>
      )}
      {findings.length > 0 && (
        <details className="text-sm">
          <summary className="cursor-pointer text-muted-foreground">
            {t.report.studies.findings}
          </summary>
          <ul className="space-y-1 pt-2">
            {findings.map((line, index) => (
              <li key={index}>{line}</li>
            ))}
          </ul>
        </details>
      )}
      {familyHistory.length > 0 && (
        <details className="text-sm">
          <summary className="cursor-pointer text-muted-foreground">
            {t.report.studies.familyHistory}
          </summary>
          <ul className="space-y-1 pt-2">
            {familyHistory.map((line, index) => (
              <li key={index}>{line}</li>
            ))}
          </ul>
        </details>
      )}
      {study.filmName && (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <FileImage className="size-4 shrink-0" aria-hidden />
          {t.report.studies.image(study.filmName)}
        </p>
      )}
      {source.length > 0 && (
        <p className="mt-auto border-t pt-3 text-xs text-muted-foreground">{source.join(" · ")}</p>
      )}
    </article>
  );
}

export function StudyList({ studies, images }: StudyListProps) {
  const t = useT();
  if (studies.length === 0 && images.length === 0) return null;
  return (
    <Section id="studies" title={t.report.studies.title} description={t.report.studies.description}>
      <ul className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
        {studies.map((study) => (
          <li key={study.id} id={`study-${study.id}`} className="scroll-mt-20">
            <StudyCard study={study} />
          </li>
        ))}
        {images.map((name) => (
          <li key={name}>
            <article className="flex h-full flex-col gap-2 rounded-xl border border-dashed bg-card p-5">
              <h3 className="flex items-center gap-2 font-semibold">
                <FileImage className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                <span className="min-w-0 truncate">{name}</span>
              </h3>
              <p className="text-sm text-muted-foreground">{t.report.studies.imageOnly}</p>
            </article>
          </li>
        ))}
      </ul>
    </Section>
  );
}
