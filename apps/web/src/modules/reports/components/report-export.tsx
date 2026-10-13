import { Printer } from "lucide-react";
import type { ReactNode } from "react";
import { Logo } from "@/common/components/brand/logo";
import { Disclaimer } from "@/common/components/disclaimer";
import { formatPlainDate } from "@/common/utils/date";
import { statusStyles } from "@/common/utils/status";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { changeMark, dateOptions, rangeText, unitText, valueText } from "../config/export";
import { conditionValue, formatReportDate } from "../config/report";
import { printedLines, studyTitle } from "../config/studies";
import type { ExportDetail, ExportReport, MarkerRow } from "../types";

type PreviousValues = Map<string, number | string>;

type ReportExportProps = {
  report: ExportReport;
  previous?: {
    report: { labName: string | null; collectedAt: string | null; createdAt: string };
    values: PreviousValues;
  };
  person: ExportDetail[];
  generatedOn: string;
  onPrint: () => void;
  actions?: ReactNode;
};

type MarkerGroup = { key: string; label?: string; rows: MarkerRow[] };

const cell = "border-b py-1 pr-3 align-top break-words print:py-px";
const columns = [
  { title: "Marker", width: "w-[32%]" },
  { title: "Value", width: "w-[12%]" },
  { title: "Unit", width: "w-[11%]" },
  { title: "Lab range", width: "w-[16%]" },
  { title: "Calibrated range", width: "w-[17%]" },
  { title: "Status", width: "w-[12%]" },
];
const columnsWithPrevious = [
  { title: "Marker", width: "w-[26%]" },
  { title: "Value", width: "w-[11%]" },
  { title: "Previous", width: "w-[13%]" },
  { title: "Unit", width: "w-[10%]" },
  { title: "Lab range", width: "w-[14%]" },
  { title: "Calibrated range", width: "w-[15%]" },
  { title: "Status", width: "w-[11%]" },
];

function PreviousCell({ row, value }: { row: MarkerRow; value: number | string | undefined }) {
  const mark =
    typeof value === "number" && row.value !== null
      ? changeMark(value, row.value, row.precision)
      : undefined;
  return (
    <td className={cn(cell, "tabular-nums")}>
      {value !== undefined &&
        valueText(
          typeof value === "number" ? value : null,
          typeof value === "string" ? value : null,
          row.precision,
        )}
      {mark && (
        <>
          {" "}
          <span aria-hidden>{mark.symbol}</span>
          <span className="sr-only">{mark.label}</span>
        </>
      )}
    </td>
  );
}

type MarkerTableProps = { groups: MarkerGroup[]; numbered?: boolean; previous?: PreviousValues };

function MarkerTable({ groups, numbered = false, previous }: MarkerTableProps) {
  const shown = previous ? columnsWithPrevious : columns;
  return (
    <div className="overflow-x-auto print:overflow-visible">
      <table className="w-full min-w-[42rem] table-fixed border-collapse text-left print:min-w-0 print:leading-tight">
        <thead>
          <tr className="text-muted-foreground">
            {shown.map(({ title, width }) => (
              <th key={title} scope="col" className={cn(cell, "font-medium", width)}>
                {title}
              </th>
            ))}
          </tr>
        </thead>
        {groups.map((group) => (
          <tbody key={group.key}>
            {group.label && (
              <tr className="break-inside-avoid break-after-avoid">
                <th
                  colSpan={shown.length}
                  scope="colgroup"
                  className={cn(cell, "pt-3 font-semibold print:pt-1.5")}
                >
                  {group.label}
                </th>
              </tr>
            )}
            {group.rows.map((row, index) => (
              <tr key={row.markerKey} className="break-inside-avoid">
                <th scope="row" className={cn(cell, "font-normal")}>
                  {numbered && `${index + 1}. `}
                  {row.name}
                </th>
                <td className={cn(cell, "tabular-nums break-words")}>
                  {valueText(row.value, row.valueText, row.precision)}
                </td>
                {previous && <PreviousCell row={row} value={previous.get(row.markerKey)} />}
                <td className={cell}>{unitText(row.unit)}</td>
                <td className={cn(cell, "tabular-nums")}>{rangeText(row.labRange)}</td>
                <td className={cn(cell, "tabular-nums")}>{rangeText(row.calibratedRange)}</td>
                <td
                  className={cn(
                    cell,
                    (row.status === "watch" || row.status === "risk") && "font-semibold",
                  )}
                >
                  {statusStyles[row.status].label}
                </td>
              </tr>
            ))}
          </tbody>
        ))}
      </table>
    </div>
  );
}

export function ReportExport({
  report,
  previous,
  person,
  generatedOn,
  onPrint,
  actions,
}: ReportExportProps) {
  const { header } = report;
  const details: ExportDetail[] = [
    ...person,
    ["Lab", header.labName],
    ["Collected on", header.collectedAt && formatPlainDate(header.collectedAt, dateOptions)],
    ["Reported on", header.reportedAt && formatPlainDate(header.reportedAt, dateOptions)],
  ];
  const groups: MarkerGroup[] = [
    ...report.categories.map(({ key, label, markers }) => ({ key, label, rows: markers })),
    ...(report.derived.length > 0
      ? [{ key: "ratios", label: "Ratios", rows: report.derived }]
      : []),
  ];

  return (
    <article className="space-y-6 text-sm print:space-y-4 print:text-[9pt]">
      <header className="flex items-start justify-between gap-4 border-b pb-4 print:pb-2">
        <div>
          <Logo className="mb-1" />
          <h1 className="text-xl font-semibold print:text-[14pt]">Report summary</h1>
        </div>
        <div className="flex flex-wrap justify-end gap-2 print:hidden">
          {actions}
          <Button variant="outline" onClick={onPrint}>
            <Printer aria-hidden />
            Print
          </Button>
        </div>
      </header>

      <div className="space-y-2">
        <dl className="grid grid-cols-2 gap-x-6 gap-y-1 sm:grid-cols-3">
          {details.map(([term, detail]) => (
            <div key={term}>
              <dt className="text-muted-foreground">{term}</dt>
              <dd className="font-medium">{detail || "-"}</dd>
            </div>
          ))}
        </dl>
        {previous && (
          <p>
            Previous values are from{" "}
            {[
              previous.report.labName,
              formatReportDate(previous.report.collectedAt, previous.report.createdAt),
            ]
              .filter(Boolean)
              .join(", ")}
            .
          </p>
        )}
      </div>

      {report.moveFirst.length > 0 && (
        <section aria-labelledby="export-move-first" className="space-y-2">
          <h2 id="export-move-first" className="text-base font-semibold print:text-[11pt]">
            Move first
          </h2>
          <MarkerTable
            groups={[{ key: "move-first", rows: report.moveFirst }]}
            numbered
            previous={previous?.values}
          />
        </section>
      )}

      {report.patterns.length > 0 && (
        <section aria-labelledby="export-patterns" className="space-y-2">
          <h2 id="export-patterns" className="text-base font-semibold print:text-[11pt]">
            Patterns
          </h2>
          <ul className="space-y-2 print:space-y-1">
            {report.patterns.map((pattern) => (
              <li key={pattern.key} className="break-inside-avoid">
                <p className="font-medium">
                  {pattern.name} ({statusStyles[pattern.severity].label})
                </p>
                <p className="text-muted-foreground">
                  {pattern.matched
                    .map((item) => `${item.name} ${conditionValue(item.value, item.unit)}`)
                    .join(", ")}
                </p>
                <p>{pattern.whatItSuggests}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {report.findings.length > 0 && (
        <section aria-labelledby="export-findings" className="space-y-2">
          <h2 id="export-findings" className="text-base font-semibold print:text-[11pt]">
            Findings
          </h2>
          <ul className="space-y-2 print:space-y-1">
            {report.findings.map((finding) => (
              <li key={finding.title} className="break-inside-avoid">
                <p className="font-medium">
                  {finding.title} ({statusStyles[finding.severity].label})
                </p>
                <p>{finding.body}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {report.doctorQuestions.length > 0 && (
        <section aria-labelledby="export-questions" className="space-y-2">
          <h2 id="export-questions" className="text-base font-semibold print:text-[11pt]">
            Questions for the doctor
          </h2>
          <ol className="list-decimal space-y-1 pl-5">
            {report.doctorQuestions.map((question) => (
              <li key={question} className="break-inside-avoid">
                {question}
              </li>
            ))}
          </ol>
        </section>
      )}

      <section aria-labelledby="export-markers" className="space-y-2">
        <h2 id="export-markers" className="text-base font-semibold print:text-[11pt]">
          Markers
        </h2>
        <MarkerTable groups={groups} previous={previous?.values} />
      </section>

      {(report.studies.length > 0 || report.files.images.length > 0) && (
        <section aria-labelledby="export-studies" className="space-y-2">
          <h2 id="export-studies" className="text-base font-semibold print:text-[11pt]">
            Studies
          </h2>
          <p className="text-muted-foreground">
            Copied from the printed reports. MediWise does not read scan images or ECG traces.
          </p>
          <ul className="space-y-3 print:space-y-2">
            {report.studies.map((study) => (
              <li key={study.id} className="break-inside-avoid space-y-1">
                <p className="font-medium">
                  {studyTitle(study)}
                  {study.performedAt && `, ${formatPlainDate(study.performedAt, dateOptions)}`}
                  {study.signedBy && `, signed by ${study.signedBy}`}
                </p>
                {printedLines(study.impression).map((line) => (
                  <p key={line} className="font-semibold">
                    {line}
                  </p>
                ))}
                {study.measurements.length > 0 && (
                  <p>
                    {study.measurements
                      .map((measurement) =>
                        [
                          measurement.name,
                          valueText(
                            measurement.valueText ? null : measurement.value,
                            measurement.valueText,
                            measurement.precision,
                          ),
                          unitText(measurement.unit),
                          measurement.status === "unknown"
                            ? ""
                            : `(${statusStyles[measurement.status].label})`,
                        ]
                          .filter((part) => part && part !== "-")
                          .join(" "),
                      )
                      .join(", ")}
                  </p>
                )}
                {printedLines(study.findings).map((line, index) => (
                  <p key={index} className="text-muted-foreground">
                    {line}
                  </p>
                ))}
                {study.familyHistory && (
                  <p className="text-muted-foreground">Family history: {study.familyHistory}</p>
                )}
              </li>
            ))}
            {report.files.images.map((name) => (
              <li key={name} className="break-inside-avoid">
                {name}: an image without a report. MediWise did not read it.
              </li>
            ))}
          </ul>
        </section>
      )}

      {report.unmapped.length > 0 && (
        <section aria-labelledby="export-appendix" className="space-y-2">
          <h2 id="export-appendix" className="text-base font-semibold print:text-[11pt]">
            Appendix: markers we could not match
          </h2>
          <p className="text-muted-foreground">
            The lab printed these values. MediWise did not score them.
          </p>
          <table className="w-full border-collapse text-left print:leading-tight">
            <thead>
              <tr className="text-muted-foreground">
                {["Name on the report", "Value", "Unit"].map((title) => (
                  <th key={title} scope="col" className={cn(cell, "font-medium")}>
                    {title}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {report.unmapped.map((item, index) => (
                <tr key={index} className="break-inside-avoid">
                  <th scope="row" className={cn(cell, "font-normal")}>
                    {item.rawName}
                  </th>
                  <td className={cn(cell, "tabular-nums")}>
                    {valueText(item.value, item.valueText)}
                  </td>
                  <td className={cell}>{unitText(item.unit)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      <footer className="space-y-1 border-t pt-4 print:break-inside-avoid print:pt-2">
        <Disclaimer />
        <p className="text-muted-foreground">Generated by MediWise on {generatedOn}</p>
      </footer>
    </article>
  );
}
