import { FileText } from "lucide-react";
import { useT } from "@/common/hooks/use-locale";
import { Section } from "@/common/components/section";
import { StatusBadge } from "@/common/components/status-badge";
import { Badge } from "@/components/ui/badge";
import { findingChips, maxFindingCards } from "../config/findings";
import { chipClass } from "../config/report";
import type { ReportDetail } from "../types";
import { InsightCard } from "./insight-card";
import { MarkerChip } from "./marker-chip";
import { SequenceSteps } from "./sequence-steps";

type FindingListProps = {
  reportId: string;
  detail: ReportDetail;
};

export function FindingList({ reportId, detail }: FindingListProps) {
  const t = useT();
  if (detail.findings.length === 0) return null;
  return (
    <Section
      id="findings"
      title={t.report.findings.title}
      description={t.report.findings.description}
    >
      <ul className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
        {detail.findings.slice(0, maxFindingCards).map((finding) => {
          const chips = findingChips(finding, detail);
          return (
            <li key={finding.title} data-testid={`finding-${finding.kind}`}>
              <InsightCard title={finding.title} badge={<StatusBadge status={finding.severity} />}>
                <p className="text-sm">{finding.body}</p>
                {finding.sequence && <SequenceSteps sequence={finding.sequence} />}
                <ul className="mt-auto flex flex-wrap gap-1.5" aria-label={t.report.findings.cited}>
                  {chips.studies.map((study) => (
                    <li key={study.id}>
                      <Badge asChild variant="outline" className={chipClass}>
                        <a href={`#study-${study.id}`}>
                          <FileText aria-hidden />
                          {study.title}
                        </a>
                      </Badge>
                    </li>
                  ))}
                  {chips.markers.map((marker) => (
                    <li key={marker.key}>
                      <MarkerChip reportId={reportId} markerKey={marker.key}>
                        {marker.name}
                      </MarkerChip>
                    </li>
                  ))}
                </ul>
              </InsightCard>
            </li>
          );
        })}
      </ul>
    </Section>
  );
}
