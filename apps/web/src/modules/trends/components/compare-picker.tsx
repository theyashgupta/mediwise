import { useT } from "@/common/hooks/use-locale";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatReportDate } from "@/modules/reports";
import type { ReportHeader } from "../types";

type ComparePickerProps = {
  reports: ReportHeader[];
  a: string | undefined;
  b: string | undefined;
  onChange: (next: { a: string | undefined; b: string | undefined }) => void;
};

function reportLabel(report: ReportHeader) {
  const date = formatReportDate(report.collectedAt, report.createdAt);
  return report.labName ? `${date}, ${report.labName}` : date;
}

export function ComparePicker({ reports, a, b, onChange }: ComparePickerProps) {
  const t = useT();
  const pickers = [
    {
      id: "report-a",
      label: t.trends.compare.reportA,
      value: a,
      set: (id: string) => onChange({ a: id, b }),
    },
    {
      id: "report-b",
      label: t.trends.compare.reportB,
      value: b,
      set: (id: string) => onChange({ a, b: id }),
    },
  ];
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {pickers.map((picker) => (
        <div key={picker.id} className="min-w-0 space-y-2">
          <Label htmlFor={picker.id}>{picker.label}</Label>
          <Select value={picker.value ?? ""} onValueChange={picker.set}>
            <SelectTrigger id={picker.id} className="w-full">
              <SelectValue placeholder={t.trends.compare.select} />
            </SelectTrigger>
            <SelectContent>
              {reports.toReversed().map((report) => (
                <SelectItem key={report.id} value={report.id}>
                  {reportLabel(report)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ))}
    </div>
  );
}
