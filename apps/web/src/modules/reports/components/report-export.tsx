import { FileDown, Printer } from "lucide-react";
import { type ReactNode, useEffect, useId } from "react";
import { Logo } from "@/common/components/brand/logo";
import { Disclaimer } from "@/common/components/disclaimer";
import { IconAction } from "@/common/components/icon-action";
import { useT } from "@/common/hooks/use-locale";
import { formatPlainDate } from "@/common/utils/date";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  changeMark,
  dateOptions,
  earlierSource,
  pdfFileName,
  rangeText,
  unitText,
  valueText,
} from "../config/export";
import { conditionValue, formatReportDate } from "../config/report";
import { printedLines, studyTitle } from "../config/studies";
import { PagedExport } from "./paged-export";
import { SequenceSteps } from "./sequence-steps";
import type { EarlierValue, ExportDetail, ExportReport, MarkerRow } from "../types";

type Previous = { values: Map<string, EarlierValue>; dated: boolean };

type ReportExportProps = {
  report: ExportReport;
  earlier?: EarlierValue[];
  person: ExportDetail[];
  generatedOn: string;
  firstName?: string;
  onPrint: () => void;
  onPaged?: () => void;
  actions?: ReactNode;
};

type MarkerGroup = { key: string; label?: string; rows: MarkerRow[] };

const cell = "border-b py-1 pr-3 align-top break-words paged:py-px";
const columns = [
  { key: "marker", width: "w-[32%]" },
  { key: "value", width: "w-[12%]" },
  { key: "unit", width: "w-[11%]" },
  { key: "labRange", width: "w-[16%]" },
  { key: "calibratedRange", width: "w-[17%]" },
  { key: "status", width: "w-[12%]" },
] as const;
const columnsWithPrevious = [
  { key: "marker", width: "w-[26%]" },
  { key: "value", width: "w-[11%]" },
  { key: "previous", width: "w-[13%]" },
  { key: "unit", width: "w-[10%]" },
  { key: "labRange", width: "w-[14%]" },
  { key: "calibratedRange", width: "w-[15%]" },
  { key: "status", width: "w-[11%]" },
] as const;

type PreviousCellProps = { row: MarkerRow; earlier: EarlierValue | undefined; dated: boolean };

function PreviousCell({ row, earlier, dated }: PreviousCellProps) {
  const value = earlier?.value;
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
      {earlier && dated && (
        <span className="block text-muted-foreground">
          {formatReportDate(earlier.collectedAt, earlier.createdAt)}
        </span>
      )}
    </td>
  );
}

type MarkerTableProps = { groups: MarkerGroup[]; numbered?: boolean; previous?: Previous };

function MarkerTable({ groups, numbered = false, previous }: MarkerTableProps) {
  const t = useT();
  const shown = previous ? columnsWithPrevious : columns;
  return (
    <div data-group className="overflow-x-auto paged:overflow-visible">
      <table className="w-full min-w-[42rem] table-fixed border-collapse text-left paged:min-w-0 paged:leading-tight">
        <thead>
          <tr className="text-muted-foreground">
            {shown.map(({ key, width }) => (
              <th key={key} scope="col" className={cn(cell, "font-medium", width)}>
                {t.reports.export.columns[key]}
              </th>
            ))}
          </tr>
        </thead>
        {groups.map((group) => (
          <tbody key={group.key} data-group>
            {group.label && (
              <tr data-atom data-keep-next className="break-inside-avoid break-after-avoid">
                <th
                  colSpan={shown.length}
                  scope="colgroup"
                  className={cn(cell, "pt-3 font-semibold paged:pt-1.5")}
                >
                  {group.label}
                </th>
              </tr>
            )}
            {group.rows.map((row, index) => (
              <tr key={row.markerKey} data-atom className="break-inside-avoid">
                <th scope="row" className={cn(cell, "font-normal")}>
                  {numbered && `${index + 1}. `}
                  {row.name}
                </th>
                <td className={cn(cell, "tabular-nums break-words")}>
                  {valueText(row.value, row.valueText, row.precision)}
                </td>
                {previous && (
                  <PreviousCell
                    row={row}
                    earlier={previous.values.get(row.markerKey)}
                    dated={previous.dated}
                  />
                )}
                <td className={cell}>{unitText(row.unit)}</td>
                <td className={cn(cell, "tabular-nums")}>{rangeText(row.labRange)}</td>
                <td className={cn(cell, "tabular-nums")}>{rangeText(row.calibratedRange)}</td>
                <td
                  className={cn(
                    cell,
                    (row.status === "watch" || row.status === "risk") && "font-semibold",
                  )}
                >
                  {t.common.status[row.status]}
                </td>
              </tr>
            ))}
          </tbody>
        ))}
      </table>
    </div>
  );
}

type ExportBodyProps = Pick<ReportExportProps, "report" | "earlier" | "person" | "actions"> & {
  onPrint?: () => void;
};

function ExportBody({ report, earlier = [], person, actions, onPrint }: ExportBodyProps) {
  const t = useT();
  const text = t.reports.export;
  const id = useId();
  const { header } = report;
  const details: ExportDetail[] = [
    ...person,
    [text.report, header.title],
    [text.labs, report.labs.join(", ")],
    [text.collectedOn, header.collectedAt && formatPlainDate(header.collectedAt, dateOptions)],
    [text.reportedOn, header.reportedAt && formatPlainDate(header.reportedAt, dateOptions)],
  ];
  const sequences = [
    ...report.findings.flatMap(({ title, sequence }) => (sequence ? [{ title, ...sequence }] : [])),
    ...report.settled,
  ];
  const source = earlierSource(earlier);
  const previous =
    earlier.length > 0
      ? { values: new Map(earlier.map((item) => [item.markerKey, item])), dated: !source }
      : undefined;
  const severalLabs = new Set(report.categories.flatMap(({ labNames }) => labNames)).size > 1;
  const groups: MarkerGroup[] = [
    ...report.categories.map(({ key, label, labNames, markers }) => ({
      key,
      label: severalLabs && labNames.length > 0 ? `${label} · ${labNames.join(", ")}` : label,
      rows: markers,
    })),
    ...(report.derived.length > 0
      ? [{ key: "ratios", label: text.ratios, rows: report.derived }]
      : []),
  ];

  return (
    <>
      <header data-atom className="flex items-start justify-between gap-4 border-b pb-4 paged:pb-2">
        <div>
          <Logo className="mb-1" />
          <h1 className="text-xl font-semibold paged:text-[14pt]">{text.title}</h1>
        </div>
        {onPrint && (
          <div className="space-y-1">
            <div className="flex flex-wrap justify-end gap-2">
              {actions}
              <IconAction label={text.print} onClick={onPrint} data-testid="export-print">
                <Printer aria-hidden />
              </IconAction>
              <Button onClick={onPrint} data-testid="export-download-pdf">
                <FileDown aria-hidden />
                {text.downloadPdf}
              </Button>
            </div>
            <p className="text-right text-xs text-muted-foreground">{text.pdfHint}</p>
          </div>
        )}
      </header>

      <div data-group className="space-y-2">
        <dl data-atom className="grid grid-cols-2 gap-x-6 gap-y-1 sm:grid-cols-3">
          {details.map(([term, detail]) => (
            <div key={term}>
              <dt className="text-muted-foreground">{term}</dt>
              <dd className="font-medium">{detail || "-"}</dd>
            </div>
          ))}
        </dl>
        {report.note && (
          <div data-atom className="break-inside-avoid">
            <p className="text-muted-foreground">{text.note}</p>
            <p className="whitespace-pre-line">{report.note}</p>
          </div>
        )}
        {source && (
          <p data-atom>
            {text.previousFrom(
              [source.labName, formatReportDate(source.collectedAt, source.createdAt)]
                .filter(Boolean)
                .join(", "),
            )}
          </p>
        )}
      </div>

      {report.moveFirst.length > 0 && (
        <section data-group aria-labelledby={`${id}export-move-first`} className="space-y-2">
          <h2
            data-atom
            data-keep-next
            id={`${id}export-move-first`}
            className="text-base font-semibold paged:text-[11pt]"
          >
            {text.moveFirst}
          </h2>
          <MarkerTable
            groups={[{ key: "move-first", rows: report.moveFirst }]}
            numbered
            previous={previous}
          />
        </section>
      )}

      {report.patterns.length > 0 && (
        <section data-group aria-labelledby={`${id}export-patterns`} className="space-y-2">
          <h2
            data-atom
            data-keep-next
            id={`${id}export-patterns`}
            className="text-base font-semibold paged:text-[11pt]"
          >
            {text.patterns}
          </h2>
          <ul data-group className="space-y-2 paged:space-y-1">
            {report.patterns.map((pattern) => (
              <li key={pattern.key} data-atom className="break-inside-avoid">
                <p className="font-medium">
                  {pattern.name} ({t.common.status[pattern.severity]})
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
        <section data-group aria-labelledby={`${id}export-findings`} className="space-y-2">
          <h2
            data-atom
            data-keep-next
            id={`${id}export-findings`}
            className="text-base font-semibold paged:text-[11pt]"
          >
            {text.findings}
          </h2>
          <ul data-group className="space-y-2 paged:space-y-1">
            {report.findings.map((finding) => (
              <li key={finding.title} data-atom className="break-inside-avoid">
                <p className="font-medium">
                  {finding.title} ({t.common.status[finding.severity]})
                </p>
                <p>{finding.body}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {sequences.length > 0 && (
        <section data-group aria-labelledby={`${id}export-sequences`} className="space-y-2">
          <h2
            data-atom
            data-keep-next
            id={`${id}export-sequences`}
            className="text-base font-semibold paged:text-[11pt]"
          >
            {text.sequences}
          </h2>
          <p data-atom data-keep-next className="text-muted-foreground">
            {text.sequencesNote}
          </p>
          <ul data-group className="space-y-3 paged:space-y-2">
            {sequences.map((item) => (
              <li key={item.title} data-atom className="break-inside-avoid space-y-1">
                <p className="font-medium">{item.title}</p>
                <SequenceSteps sequence={item} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {report.doctorQuestions.length > 0 && (
        <section data-group aria-labelledby={`${id}export-questions`} className="space-y-2">
          <h2
            data-atom
            data-keep-next
            id={`${id}export-questions`}
            className="text-base font-semibold paged:text-[11pt]"
          >
            {text.questions}
          </h2>
          <ol data-group className="list-decimal space-y-1 pl-5">
            {report.doctorQuestions.map((question, index) => (
              <li key={question} value={index + 1} data-atom className="break-inside-avoid">
                {question}
              </li>
            ))}
          </ol>
        </section>
      )}

      <section data-group aria-labelledby={`${id}export-markers`} className="space-y-2">
        <h2
          data-atom
          data-keep-next
          id={`${id}export-markers`}
          className="text-base font-semibold paged:text-[11pt]"
        >
          {text.markers}
        </h2>
        <MarkerTable groups={groups} previous={previous} />
      </section>

      {(report.studies.length > 0 || report.files.images.length > 0) && (
        <section data-group aria-labelledby={`${id}export-studies`} className="space-y-2">
          <h2
            data-atom
            data-keep-next
            id={`${id}export-studies`}
            className="text-base font-semibold paged:text-[11pt]"
          >
            {text.studies}
          </h2>
          <p data-atom data-keep-next className="text-muted-foreground">
            {text.studiesNote}
          </p>
          <ul data-group className="space-y-3 paged:space-y-2">
            {report.studies.map((study) => (
              <li key={study.id} data-atom className="break-inside-avoid space-y-1">
                <p className="font-medium">
                  {studyTitle(study)}
                  {study.performedAt && `, ${formatPlainDate(study.performedAt, dateOptions)}`}
                  {study.labName && `, ${study.labName}`}
                  {study.signedBy && `, ${text.signedBy(study.signedBy)}`}
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
                            : `(${t.common.status[measurement.status]})`,
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
                  <p className="text-muted-foreground">{text.familyHistory(study.familyHistory)}</p>
                )}
              </li>
            ))}
            {report.files.images.map((name) => (
              <li key={name} data-atom className="break-inside-avoid">
                {text.imageNotRead(name)}
              </li>
            ))}
          </ul>
        </section>
      )}

      {report.unmapped.length > 0 && (
        <section data-group aria-labelledby={`${id}export-appendix`} className="space-y-2">
          <h2
            data-atom
            data-keep-next
            id={`${id}export-appendix`}
            className="text-base font-semibold paged:text-[11pt]"
          >
            {text.appendix}
          </h2>
          <p data-atom data-keep-next className="text-muted-foreground">
            {text.appendixNote}
          </p>
          <table data-group className="w-full border-collapse text-left paged:leading-tight">
            <thead>
              <tr className="text-muted-foreground">
                {[text.columns.rawName, text.columns.value, text.columns.unit].map((title) => (
                  <th key={title} scope="col" className={cn(cell, "font-medium")}>
                    {title}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {report.unmapped.map((item, index) => (
                <tr key={index} data-atom className="break-inside-avoid">
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
    </>
  );
}

/**
 * Sets the page title to the PDF file name while the export is open, and puts the old title back after.
 *
 * @remarks
 * Chrome and Safari name a PDF saved from the print window after the page title, so this sets the file name.
 */
function usePdfTitle(fileName: string) {
  useEffect(() => {
    const previous = document.title;
    document.title = fileName.replace(/\.pdf$/, "");
    return () => {
      document.title = previous;
    };
  }, [fileName]);
}

export function ReportExport({
  report,
  earlier,
  person,
  generatedOn,
  firstName,
  onPrint,
  onPaged,
  actions,
}: ReportExportProps) {
  const text = useT().reports.export;
  usePdfTitle(pdfFileName(firstName, report.header.title));

  return (
    <>
      <article className="space-y-6 text-sm print:hidden" data-testid="report-export">
        <ExportBody
          report={report}
          earlier={earlier}
          person={person}
          actions={actions}
          onPrint={onPrint}
        />
        <footer className="space-y-1 border-t pt-4">
          <Disclaimer />
          <p className="text-muted-foreground">{text.generated(generatedOn)}</p>
        </footer>
      </article>
      <PagedExport
        onPaged={onPaged}
        footer={
          <footer className="mt-auto space-y-0.5 border-t pt-1.5 text-muted-foreground [&_p]:text-[7.5pt]">
            <Disclaimer />
            <p>{text.pageLabs(report.labs.join(", "))}</p>
            <p>{text.generated(generatedOn)}</p>
          </footer>
        }
      >
        <ExportBody report={report} earlier={earlier} person={person} />
      </PagedExport>
    </>
  );
}
