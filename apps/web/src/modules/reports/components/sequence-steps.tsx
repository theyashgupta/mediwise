import { useT } from "@/common/hooks/use-locale";
import { formatPlainDate } from "@/common/utils/date";
import { dateOptions } from "../config/export";
import type { FindingSequence } from "../types";

type SequenceStepsProps = { sequence: FindingSequence };

export function SequenceSteps({ sequence }: SequenceStepsProps) {
  const t = useT();
  const date = (value: string) => formatPlainDate(value, dateOptions);
  const later = date(sequence.later.date);
  return (
    <div className="space-y-1 text-sm">
      <ol aria-label={t.report.sequence.steps} className="space-y-1">
        {[sequence.earlier, sequence.later].map((step) => (
          <li key={step.reportId}>
            <span className="font-medium tabular-nums">{date(step.date)}</span>: {step.text}
          </li>
        ))}
      </ol>
      <p className="font-medium">
        {sequence.state === "settled"
          ? t.report.settled.settledBy(later)
          : t.report.sequence.confirmedBy(later)}
      </p>
    </div>
  );
}
