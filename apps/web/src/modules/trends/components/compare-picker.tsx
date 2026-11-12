import { Field } from "@/common/components/controls/field";
import { Select, SelectItem } from "@/common/components/controls/select";
import { useT } from "@/common/hooks/use-locale";
import { reportLabels } from "../config/trends";
import type { ReportHeader } from "../types";

type ComparePickerProps = {
  reports: ReportHeader[];
  a: string | undefined;
  b: string | undefined;
  onChange: (next: { a: string | undefined; b: string | undefined }) => void;
};

export function ComparePicker({ reports, a, b, onChange }: ComparePickerProps) {
  const t = useT();
  const labels = reportLabels(reports);
  const pickers = [
    {
      id: "report-a",
      label: t.trends.compare.reportA,
      value: a,
      other: b,
      set: (id: string) => onChange({ a: id, b }),
    },
    {
      id: "report-b",
      label: t.trends.compare.reportB,
      value: b,
      other: a,
      set: (id: string) => onChange({ a, b: id }),
    },
  ];
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {pickers.map((picker) => (
        <Field key={picker.id} label={picker.label} className="min-w-0">
          <Select
            id={picker.id}
            value={picker.value ?? ""}
            onValueChange={picker.set}
            placeholder={t.trends.compare.select}
            className="w-full"
            data-testid={picker.id}
          >
            {reports.toReversed().map((report) => (
              <SelectItem
                key={report.id}
                value={report.id}
                disabled={report.id === picker.other}
                data-testid={`${picker.id}-option`}
              >
                {labels.get(report.id)}
              </SelectItem>
            ))}
          </Select>
        </Field>
      ))}
    </div>
  );
}
