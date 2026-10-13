import { Badge } from "@/components/ui/badge";
import { useT } from "@/common/hooks/use-locale";
import { Section } from "@/common/components/section";
import { chipClass } from "../config/report";
import type { ReportDetail } from "../types";
import { MarkerChip } from "./marker-chip";

type ReportNarrativeProps = {
  reportId: string;
  narrative: NonNullable<ReportDetail["narrative"]>;
  detail: ReportDetail;
};

export function ReportNarrative({ reportId, narrative, detail }: ReportNarrativeProps) {
  const t = useT();
  const markerNames = new Map(
    [...detail.categories.flatMap((category) => category.markers), ...detail.derived].map(
      (marker) => [marker.markerKey, marker.name],
    ),
  );
  const patternNames = new Map(detail.patterns.map((pattern) => [pattern.key, pattern.name]));

  function chip(key: string) {
    const markerName = markerNames.get(key);
    if (markerName) {
      return (
        <MarkerChip key={key} reportId={reportId} markerKey={key}>
          {markerName}
        </MarkerChip>
      );
    }
    const patternName = patternNames.get(key);
    return (
      patternName && (
        <Badge key={key} asChild variant="outline" className={chipClass}>
          <a href={`#pattern-${key}`}>{patternName}</a>
        </Badge>
      )
    );
  }

  return (
    <Section id="narrative" title={t.report.narrative.title}>
      <div className="space-y-6 rounded-xl border bg-card p-6 sm:p-8">
        {narrative.sections
          .filter((section) => section.sentences.length > 0)
          .map((section) => (
            <div key={section.heading} className="max-w-measure space-y-1.5">
              <h3 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
                {t.report.narrative.headings[section.heading]}
              </h3>
              <p className="leading-7">
                {section.sentences.map((sentence, index) => (
                  <span key={index}>
                    {sentence.text}
                    {sentence.markerKeys.length > 0 && (
                      <span className="mx-1 inline-flex flex-wrap gap-1 align-middle">
                        {sentence.markerKeys.map(chip)}
                      </span>
                    )}{" "}
                  </span>
                ))}
              </p>
            </div>
          ))}
      </div>
    </Section>
  );
}
