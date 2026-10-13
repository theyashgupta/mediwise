import Anthropic from "@anthropic-ai/sdk";
import type { Visit } from "@mediwise/engine";
import type { ExtractedReport } from "@mediwise/shared";
import { createHash } from "node:crypto";
import sharp from "sharp";
import { beforeEach, expect, test, vi } from "vitest";
import { pdfPageTexts } from "../lib/poppler.js";
import { reportUsage } from "../modules/extraction/index.js";
import { processReport } from "../modules/reports/index.js";
import { failProcessReport, handleProcessReport } from "./process-report.job.js";

const reportId = "0b8f7a52-2a4e-4f3c-9d5e-6f1a2b3c4d5e";
/** Builds a valid PDF with one Courier text line per entry, one page per array, so poppler reads it like a lab PDF. */
function textPdf(pages: string[][]) {
  const objects = [
    "<</Type/Catalog/Pages 2 0 R>>",
    `<</Type/Pages/Kids[${pages.map((_, i) => `${4 + i * 2} 0 R`).join(" ")}]/Count ${pages.length}>>`,
    "<</Type/Font/Subtype/Type1/BaseFont/Courier>>",
  ];
  for (const lines of pages) {
    const stream = `BT /F1 9 Tf 30 800 Td 11 TL ${lines.map((line) => `(${line}) Tj T*`).join(" ")} ET`;
    objects.push(
      `<</Type/Page/Parent 2 0 R/MediaBox[0 0 595 842]/Resources<</Font<</F1 3 0 R>>>>/Contents ${objects.length + 2} 0 R>>`,
      `<</Length ${stream.length}>>\nstream\n${stream}\nendstream`,
    );
  }
  let pdf = "%PDF-1.4\n";
  const offsets = objects.map((object, i) => {
    const at = pdf.length;
    pdf += `${i + 1} 0 obj\n${object}\nendobj\n`;
    return at;
  });
  const xref = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  pdf += offsets.map((at) => `${String(at).padStart(10, "0")} 00000 n \n`).join("");
  pdf += `trailer\n<</Size ${objects.length + 1}/Root 1 0 R>>\nstartxref\n${xref}\n%%EOF\n`;
  return Buffer.from(pdf);
}

const labPage = [
  "  Test Name                       Result     Unit      Bio.Ref.Range",
  "  HIGH SENSITIVITY C-REACTIVE     0.78       mg/L      0.1-10 mg/l",
  "  PROTEIN (HS-CRP)                                     < 1 mg/L = Low risk",
  "  Haemoglobin                     13.47      g/dL      12-15",
  "  TSH levels in infants and children",
  "  Cord blood         2.2 to 10.7",
];
const idPage = [
  "UNIQUE IDENTIFICATION AUTHORITY OF INDIA   Government of India   Aadhaar   1234 5678 9012",
  "This card is proof of identity of the card holder named above, not of citizenship.",
];
const labPdf = textPdf([labPage]);

const extraction: ExtractedReport = {
  lab: { name: "Sunrise Diagnostics", location: "Pune" },
  patient: { name: "Asha Verma", ageYears: 37, sex: "F" },
  collectedAt: "2024-03-10",
  reportedAt: "2024-03-11",
  markers: [
    {
      rawName: "Haemoglobin",
      value: 13.47,
      unit: "g/dL",
      referenceText: "12 - 15",
      pageIndex: 0,
    },
    { rawName: "Sugar (F)", value: 92.5, unit: "mg/dL", pageIndex: 0 },
    { rawName: "TSH Ultra 3rd Gen", value: 2.13, unit: "mg/dL", pageIndex: 1 },
    { rawName: "Mystery Factor", value: 7.77, unit: "U", pageIndex: 1 },
    { rawName: "Urine Glucose", value: "Negative", pageIndex: 2 },
    { rawName: "Hemoglobin", value: 13.47, unit: "g/dL", pageIndex: 2 },
    {
      rawName: "Total Cholesterol",
      value: 5.21,
      unit: "mmol/L",
      referenceText: "< 5.17",
      pageIndex: 1,
    },
    { rawName: "Protein", value: "Absent", pageIndex: 2 },
  ],
};

type StoredFile = {
  id: string;
  storagePath: string;
  mime: string;
  sha256: string | null;
  pageClasses: string[] | null;
  skipReason: string | null;
};

const edge = vi.hoisted(() => ({
  create: vi.fn(),
  logs: [] as string[],
  saved: [] as unknown[][],
  statuses: [] as unknown[][],
  objects: new Map<string, Buffer>(),
  files: [] as StoredFile[],
  hashes: [] as string[],
  fileUpdates: [] as unknown[][],
  uploads: [] as [string, Buffer][],
  removed: [] as string[],
  credits: { balance: 1, held: 0 },
  dateOfBirth: "1986-05-20" as string | null,
  filledBirths: [] as unknown[][],
  previous: undefined as Visit | undefined,
  note: null as string | null,
}));

vi.mock("../lib/anthropic.js", () => ({ anthropic: { messages: { create: edge.create } } }));
vi.mock("../lib/storage.js", () => ({
  download: async (path: string) => {
    const data = edge.objects.get(path);
    if (!data) throw new Error(`No object at ${path}`);
    return data;
  },
  upload: async (path: string, data: Buffer) => {
    edge.uploads.push([path, data]);
    edge.objects.set(path, data);
  },
  remove: async (paths: string[]) => {
    edge.removed.push(...paths);
    paths.forEach((path) => edge.objects.delete(path));
  },
}));
vi.mock("../middleware/logger.js", () => ({
  log: {
    info: (...args: unknown[]) => edge.logs.push(args.join(" ")),
    error: (...args: unknown[]) => edge.logs.push(args.join(" ")),
  },
}));
vi.mock("../modules/credits/credits.repo.js", () => ({
  debitReportCredit: async () => {
    if (edge.credits.held < 0) return true;
    if (edge.credits.balance < 1) return false;
    edge.credits.balance--;
    edge.credits.held--;
    return true;
  },
  refundReportCredit: async () => {
    if (edge.credits.held >= 0) return;
    edge.credits.balance++;
    edge.credits.held++;
  },
}));
vi.mock("../modules/reports/reports.repo.js", () => ({
  findReportForProcessing: async (id: string) => ({
    id,
    profileId: "profile-1",
    createdAt: new Date("2024-03-12T10:00:00Z"),
    dateOfBirth: edge.dateOfBirth,
    sex: "female",
    ancestry: "south_asian",
    note: edge.note,
    files: edge.files,
  }),
  listProfileFileHashes: async () => edge.hashes,
  updateReportFile: async (...args: unknown[]) => edge.fileUpdates.push(args),
  updateReportStatus: async (...args: unknown[]) => edge.statuses.push(args),
  saveReportResult: async (...args: unknown[]) => edge.saved.push(args),
  fillDateOfBirth: async (...args: unknown[]) => edge.filledBirths.push(args),
}));

vi.mock("../modules/findings/findings.repo.js", () => ({
  findPreviousVisit: async () => edge.previous,
}));

/** Writes a report in the compact shape the record_extraction tool returns. */
function compact({ lab, patient, collectedAt, reportedAt, markers }: ExtractedReport) {
  const panels: { name: string | null; rows: unknown[][] }[] = [];
  for (const marker of markers) {
    const name = marker.panel ?? null;
    if (panels.at(-1)?.name !== name) panels.push({ name, rows: [] });
    panels
      .at(-1)
      ?.rows.push([
        marker.rawName,
        marker.value,
        marker.unit ?? null,
        marker.referenceText ?? null,
        marker.pageIndex + 1,
      ]);
  }
  return { labName: lab?.name, age: patient?.ageYears, collectedAt, reportedAt, panels };
}

const read = (usage = reportUsage()) => handleProcessReport({ reportId }, usage);

function toolUse(name: string, input: unknown) {
  return {
    content: [{ type: "tool_use", id: "toolu_1", name, input }],
    stop_reason: "tool_use",
    usage: { input_tokens: 1000, output_tokens: 200, cache_read_input_tokens: 50 },
  };
}

const mappings = {
  mappings: [
    { index: 1, markerKey: "glucose_fasting" },
    { index: 2, markerKey: "tsh" },
    { index: 3, markerKey: null },
    { index: 7, markerKey: "urine_protein" },
  ],
};

const narrative = {
  sections: [
    { heading: "The headline", sentences: [{ text: "Most markers are optimal.", markerKeys: [] }] },
    {
      heading: "What stands out",
      sentences: [{ text: "Total cholesterol is above range.", markerKeys: ["total_cholesterol"] }],
    },
    {
      heading: "What looks good",
      sentences: [{ text: "Haemoglobin is optimal.", markerKeys: ["hemoglobin"] }],
    },
    {
      heading: "What to do next",
      sentences: [{ text: "Retest cholesterol in 3 months.", markerKeys: ["total_cholesterol"] }],
    },
  ],
};

/** Stores a file of the report in the storage fake and returns its row. */
function addFile(index: number, data: Buffer, mime = "application/pdf") {
  const storagePath = `alice/${reportId}/${index}.${mime === "application/pdf" ? "pdf" : "jpg"}`;
  edge.objects.set(storagePath, data);
  const file = {
    id: `file-${index}`,
    storagePath,
    mime,
    sha256: null,
    pageClasses: null,
    skipReason: null,
  };
  edge.files.push(file);
  return file;
}

const classified = (...pages: string[]) => toolUse("classify_pages", { pages });

const draft = {
  sentences: narrative.sections.flatMap(({ heading, sentences }) =>
    sentences.map(({ text, markerKeys }) => ({ section: heading, text, citedKeys: markerKeys })),
  ),
};

beforeEach(() => {
  edge.create.mockReset();
  edge.logs.length = 0;
  edge.saved.length = 0;
  edge.statuses.length = 0;
  edge.objects.clear();
  edge.files.length = 0;
  edge.hashes.length = 0;
  edge.fileUpdates.length = 0;
  edge.uploads.length = 0;
  edge.removed.length = 0;
  edge.credits = { balance: 1, held: 0 };
  edge.dateOfBirth = "1986-05-20";
  edge.filledBirths.length = 0;
  edge.previous = undefined;
  edge.note = null;
  addFile(0, labPdf);
});

test("a report is extracted, mapped, scored, narrated and written in one save", async () => {
  edge.create
    .mockResolvedValueOnce(classified("lab_panel"))
    .mockResolvedValueOnce(toolUse("record_extraction", compact(extraction)))
    .mockResolvedValueOnce(toolUse("map_markers", mappings))
    .mockResolvedValueOnce(toolUse("write_narrative", draft));

  const usage = reportUsage();
  await read(usage);

  expect(usage.extract).toMatchObject({
    model: "claude-haiku-5-5",
    inputTokens: 1000,
    cachedInputTokens: 50,
    outputTokens: 200,
  });
  expect(usage.map).toMatchObject({ model: "claude-sonnet-5-5", inputTokens: 1000 });
  expect(usage.narrative).toMatchObject({
    model: "claude-haiku-5-5",
    inputTokens: 1000,
    cachedInputTokens: 50,
    outputTokens: 200,
  });
  expect(usage.classify).toMatchObject({ model: "claude-haiku-5-5", inputTokens: 1000 });
  const [, extractCall, mapCall, narrativeCall] = edge.create.mock.calls.map(
    ([request]) => request as { model: string; thinking: unknown; system: unknown[] },
  );
  expect(extractCall).toMatchObject({ model: "claude-haiku-5-5", thinking: { type: "disabled" } });
  expect(extractCall?.system).toMatchObject([{ cache_control: { type: "ephemeral" } }]);
  expect(mapCall).toMatchObject({ model: "claude-sonnet-5-5" });
  expect(narrativeCall).toMatchObject({
    model: "claude-haiku-5-5",
    thinking: { type: "disabled" },
  });
  expect(edge.statuses).toEqual([[reportId, "processing"]]);
  const [[id, report, markers, suggestions, followUps]] = edge.saved as [
    [string, Record<string, unknown>, Record<string, unknown>[], unknown[], unknown[]],
  ];
  expect(id).toBe(reportId);
  expect(report).toMatchObject({
    labName: "Sunrise Diagnostics",
    collectedAt: "2024-03-10",
    reportedAt: "2024-03-11",
    tier: expect.any(String),
    verdict: expect.any(String),
    patterns: expect.any(Array),
    doctorQuestions: expect.any(Array),
    narrative,
    narrativeStatus: "done",
  });
  expect(Number.isInteger(report.score)).toBe(true);
  expect(markers.map((row) => [row.rawName, row.markerKey])).toEqual([
    ["Haemoglobin", "hemoglobin"],
    ["Sugar (F)", "glucose_fasting"],
    ["TSH Ultra 3rd Gen", null],
    ["Mystery Factor", null],
    ["Urine Glucose", "urine_glucose"],
    ["Hemoglobin", "hemoglobin"],
    ["Total Cholesterol", "total_cholesterol"],
    ["Protein", "urine_protein"],
  ]);
  expect(markers[0]).toMatchObject({ value: 13.47, labRangeLow: 12, labRangeHigh: 15 });
  expect(markers[0]?.status).not.toBeNull();
  expect(markers[4]).toMatchObject({ value: null, valueText: "Negative", status: null });
  expect(markers[5]).toMatchObject({ value: 13.47, status: null });
  expect(markers[6]).toMatchObject({ value: 201, unit: "mg/dL" });
  expect(suggestions).toEqual([
    {
      reportMarkerId: markers[1]?.id,
      rawName: "Sugar (F)",
      unit: "mg/dL",
      suggestedMarkerKey: "glucose_fasting",
    },
    {
      reportMarkerId: markers[7]?.id,
      rawName: "Protein",
      unit: null,
      suggestedMarkerKey: "urine_protein",
    },
  ]);
  const mapRequest = edge.create.mock.calls[2]?.[0] as {
    messages: { content: { text: string }[] }[];
  };
  const printed = mapRequest.messages[0]?.content[0]?.text ?? "";
  expect(printed).toContain('"rawName":"Mystery Factor"');
  expect(printed).not.toContain("Haemoglobin");
  expect(printed).not.toContain("7.77");
  expect(followUps.length).toBeGreaterThan(0);
  expect(followUps[0]).toMatchObject({ reportId, rank: expect.any(Number) });
});

/** Reads the report with the printed age and collection date given, and returns the age the engine scored with. */
async function readWithAge(age: string, collectedAt: string) {
  edge.create
    .mockResolvedValueOnce(classified("lab_panel"))
    .mockResolvedValueOnce(
      toolUse("record_extraction", { ...compact(extraction), age, collectedAt }),
    )
    .mockResolvedValueOnce(toolUse("map_markers", mappings))
    .mockResolvedValueOnce(toolUse("write_narrative", draft));
  await read();
  return /Person: (\d+) years/.exec(JSON.stringify(edge.create.mock.calls[3]?.[0]))?.[1];
}

test("a profile without a date of birth gets the collection date minus the printed years, months and days", async () => {
  edge.dateOfBirth = null;

  const engineAge = await readWithAge("24 Y 8 M 21 D /M", "2024-01-13");

  expect(edge.filledBirths).toEqual([["profile-1", "1999-04-22", false]]);
  expect(engineAge).toBe("24");
});

test("a report that prints only years fills an approximate date of birth, clamped to the month end", async () => {
  edge.dateOfBirth = null;

  const engineAge = await readWithAge("47 Y /F", "2024-02-29");

  expect(edge.filledBirths).toEqual([["profile-1", "1977-02-28", true]]);
  expect(engineAge).toBe("47");
});

test("a date of birth already on the profile is kept and scores the report", async () => {
  edge.dateOfBirth = "1999-08-21";

  const engineAge = await readWithAge("24 Y 8 M 21 D /M", "2024-01-13");

  expect(edge.filledBirths).toEqual([]);
  expect(engineAge).toBe("24");
});

test("a narrative rejected twice leaves the report done with narrative status failed", async () => {
  const unknownKey = structuredClone(draft);
  unknownKey.sentences[1]!.citedKeys = ["ldl_cholesterol"];
  edge.create
    .mockResolvedValueOnce(classified("lab_panel"))
    .mockResolvedValueOnce(toolUse("record_extraction", compact(extraction)))
    .mockResolvedValueOnce(toolUse("map_markers", mappings))
    .mockResolvedValue(toolUse("write_narrative", unknownKey));

  await read();

  expect(edge.create).toHaveBeenCalledTimes(5);
  const [[, report]] = edge.saved as [[string, Record<string, unknown>]];
  expect(report).toMatchObject({ narrative: null, narrativeStatus: "failed" });
});

test("a narrative call that throws leaves the report done without a narrative", async () => {
  edge.create
    .mockResolvedValueOnce(classified("lab_panel"))
    .mockResolvedValueOnce(toolUse("record_extraction", compact(extraction)))
    .mockResolvedValueOnce(toolUse("map_markers", mappings))
    .mockRejectedValueOnce(new Error("overloaded"));

  await read();

  const [[, report]] = edge.saved as [[string, Record<string, unknown>]];
  expect(report).toMatchObject({ narrative: null, narrativeStatus: "failed" });
});

test("a marker that moved status since the previous visit is stored as a change finding", async () => {
  edge.previous = {
    date: "2023-02-01",
    labName: "Lakeview Lab",
    markers: [
      {
        markerKey: "hemoglobin",
        value: 10.2,
        valueText: null,
        unit: "g/dL",
        status: "risk",
        calibratedLow: 12,
        calibratedHigh: 15.5,
      },
    ],
    studies: [],
  };
  edge.create
    .mockResolvedValueOnce(classified("lab_panel"))
    .mockResolvedValueOnce(toolUse("record_extraction", compact(extraction)))
    .mockResolvedValueOnce(toolUse("map_markers", mappings))
    .mockResolvedValueOnce(toolUse("write_narrative", draft))
    .mockImplementationOnce(async (request: { messages: { content: { text: string }[] }[] }) => {
      const facts = request.messages[0]!.content[0]!.text;
      const cites = [...facts.matchAll(/^Cite list: (\S+?)(,|$)/gm)].map((match) => match[1]);
      return toolUse("write_findings", {
        findings: cites.map((key, i) => ({ number: i + 1, body: "It moved.", citedKeys: [key] })),
      });
    });

  await read();

  const [[, report, , , , , findings]] = edge.saved as [
    [string, { doctorQuestions: string[] }, ...unknown[]],
  ];
  expect(findings).toContainEqual({
    reportId,
    kind: "change",
    severity: "optimal",
    title: "Hemoglobin improving: 10.2 g/dL in Feb 2023, 13.47 g/dL in Mar 2024",
    body: "It moved. Different labs measured these values, so the method may differ. Compare them with care.",
    citedKeys: ["hemoglobin"],
    citedStudyIds: [],
    rank: expect.any(Number),
  });
  expect(report.doctorQuestions.length).toBeLessThanOrEqual(6);
});

test("the visit note never reaches any Claude prompt, narrative and findings included", async () => {
  const note = "Zorbel note: tired for two weeks, started walking daily";
  edge.note = note;
  edge.previous = {
    date: "2023-02-01",
    labName: "Lakeview Lab",
    note,
    markers: [
      {
        markerKey: "hemoglobin",
        value: 10.2,
        valueText: null,
        unit: "g/dL",
        status: "risk",
        calibratedLow: 12,
        calibratedHigh: 15.5,
      },
    ],
    studies: [],
  } as Visit;
  edge.create
    .mockResolvedValueOnce(classified("lab_panel"))
    .mockResolvedValueOnce(toolUse("record_extraction", compact(extraction)))
    .mockResolvedValueOnce(toolUse("map_markers", mappings))
    .mockResolvedValueOnce(toolUse("write_narrative", draft))
    .mockResolvedValueOnce(
      toolUse("write_findings", {
        findings: [{ number: 1, body: "It moved.", citedKeys: ["hemoglobin"] }],
      }),
    );

  await read();

  const tools = edge.create.mock.calls.map(
    ([request]) => (request as { tools: { name: string }[] }).tools[0]?.name,
  );
  expect(tools).toEqual([
    "classify_pages",
    "record_extraction",
    "map_markers",
    "write_narrative",
    "write_findings",
  ]);
  const prompts = JSON.stringify(edge.create.mock.calls);
  expect(prompts).toContain("10.2");
  expect(prompts).not.toContain("Zorbel");
});

test("a urine panel line never stores a blood marker, by alias or by Claude", async () => {
  const urine = "Urine Routine And Microscopy*";
  const panels: ExtractedReport = {
    collectedAt: "2024-03-10",
    markers: [
      {
        rawName: "RBC Count",
        panel: "Complete Haemogram, Peripheral Smear and ESR,EDTA",
        value: 5.53,
        unit: "mill/µL",
        pageIndex: 0,
      },
      {
        rawName: "Bilirubin (Total)",
        panel: "Liver Function Test (LFT)*, Serum",
        value: 0.913,
        unit: "mg/dL",
        pageIndex: 1,
      },
      { rawName: "Bilirubin", panel: urine, value: "ABSENT", pageIndex: 2 },
      { rawName: "Red Blood Cells (RBC)", panel: urine, value: "ABSENT", pageIndex: 2 },
      { rawName: "Yeast Cells", panel: urine, value: "ABSENT", pageIndex: 2 },
    ],
  };
  edge.create
    .mockResolvedValueOnce(classified("lab_panel"))
    .mockResolvedValueOnce(toolUse("record_extraction", compact(panels)))
    .mockResolvedValueOnce(
      toolUse("map_markers", { mappings: [{ index: 4, markerKey: "rbc_count" }] }),
    );

  await read();

  const [[, , markers, suggestions]] = edge.saved as [
    [string, unknown, Record<string, unknown>[], unknown[]],
  ];
  expect(markers.filter((row) => !row.derived).map((row) => [row.rawName, row.markerKey])).toEqual([
    ["RBC Count", "rbc_count"],
    ["Bilirubin (Total)", "bilirubin_total"],
    ["Bilirubin", "urine_bilirubin"],
    ["Red Blood Cells (RBC)", "urine_rbc"],
    ["Yeast Cells", null],
  ]);
  expect(suggestions).toEqual([]);
  const mapCall = edge.create.mock.calls[2]?.[0] as { messages: { content: { text: string }[] }[] };
  expect(mapCall.messages[0]?.content[0]?.text).toContain(`"panel":"${urine}"`);
});

test("no log line carries a marker value, a test name or the patient name", async () => {
  edge.create
    .mockResolvedValueOnce(classified("lab_panel"))
    .mockResolvedValueOnce(toolUse("record_extraction", compact(extraction)))
    .mockResolvedValueOnce(toolUse("map_markers", mappings));

  await read();

  expect(edge.logs.length).toBeGreaterThanOrEqual(6);
  const secrets = ["Asha", "Verma", "13.47", "92.5", "5.21", "Negative", "Haemoglobin", "Sugar"];
  for (const line of edge.logs) {
    for (const secret of secrets) expect(line).not.toContain(secret);
  }
});

test("an invalid extraction is retried once with the validation errors in the prompt", async () => {
  edge.create
    .mockResolvedValueOnce(classified("lab_panel"))
    .mockResolvedValueOnce(toolUse("record_extraction", { markers: [{ rawName: "Haemoglobin" }] }))
    .mockResolvedValueOnce(toolUse("record_extraction", compact(extraction)))
    .mockResolvedValueOnce(toolUse("map_markers", mappings));

  await read();

  const retry = edge.create.mock.calls[2]?.[0] as { messages: { content: { text?: string }[] }[] };
  expect(retry.messages[0]?.content.at(-1)?.text).toContain("failed validation");
  expect(edge.saved).toHaveLength(1);
});

test("a second invalid extraction fails with a message the user can read", async () => {
  edge.create
    .mockResolvedValueOnce(classified("lab_panel"))
    .mockResolvedValue(toolUse("record_extraction", { markers: "none" }));

  const error = await read().catch((e: unknown) => e);
  await failProcessReport({ reportId }, error);

  expect(edge.create).toHaveBeenCalledTimes(3);
  expect(edge.saved).toEqual([]);
  expect(edge.statuses.at(-1)).toEqual([
    reportId,
    "failed",
    "We could not read the values in this report. Upload clearer photos or a PDF.",
  ]);
});

test("a file with no test results fails without asking about the profile", async () => {
  edge.create
    .mockResolvedValueOnce(classified("lab_panel"))
    .mockResolvedValueOnce(toolUse("record_extraction", { panels: [] }));

  const error = await read().catch((e: unknown) => e);
  await failProcessReport({ reportId }, error);

  expect(edge.create).toHaveBeenCalledTimes(2);
  expect(edge.statuses.at(-1)).toEqual([
    reportId,
    "failed",
    "We found no lab values in this file. Upload a lab report.",
  ]);
});

test("a file that is not a PDF fails before Claude is called, with a readable error", async () => {
  edge.objects.set(edge.files[0]?.storagePath ?? "", Buffer.from("PK\u0003\u0004 not a pdf"));

  const error = await read().catch((e: unknown) => e);
  await failProcessReport({ reportId }, error);

  expect(edge.create).not.toHaveBeenCalled();
  expect(edge.statuses.at(-1)).toEqual([
    reportId,
    "failed",
    "This file is damaged or is not a PDF. Upload the report again.",
  ]);
});

test("a provider error such as a billing 400 does not blame the user's file", async () => {
  const error = new Anthropic.BadRequestError(
    400,
    {},
    "Your credit balance is too low to access the Anthropic API.",
    new Headers(),
  );

  await failProcessReport({ reportId }, error);

  expect(edge.statuses).toEqual([
    [reportId, "failed", "We could not read this report. Try again in a few minutes."],
  ]);
});

test("a read debits one credit, and a retry of the same report does not debit again", async () => {
  edge.create.mockRejectedValueOnce(new Error("overloaded"));
  await expect(read()).rejects.toThrow("overloaded");
  edge.create
    .mockResolvedValueOnce(classified("lab_panel"))
    .mockResolvedValueOnce(toolUse("record_extraction", compact(extraction)))
    .mockResolvedValueOnce(toolUse("map_markers", mappings))
    .mockResolvedValueOnce(toolUse("write_narrative", draft));

  await read();

  expect(edge.credits).toEqual({ balance: 0, held: -1 });
});

test("a read that fails after a Claude call still reports the tokens it spent", async () => {
  edge.create
    .mockResolvedValueOnce(classified("lab_panel"))
    .mockResolvedValueOnce(toolUse("record_extraction", compact(extraction)))
    .mockRejectedValueOnce(new Error("overloaded"));
  const usage = reportUsage();

  await expect(read(usage)).rejects.toThrow("overloaded");

  expect(usage.extract).toMatchObject({ inputTokens: 1000, outputTokens: 200 });
  expect(usage.map).toMatchObject({ inputTokens: 0 });
});

test("a read without a credit fails with 402 before any Claude call", async () => {
  edge.credits = { balance: 0, held: 0 };
  const error = await read().catch((caught: unknown) => caught);
  await failProcessReport({ reportId }, error);

  expect(edge.create).not.toHaveBeenCalled();
  expect(edge.statuses.at(-1)).toEqual([reportId, "failed", "You have no report credits left."]);
  expect(edge.credits).toEqual({ balance: 0, held: 0 });
});

test("a damaged PDF fails the read and gives the credit back", async () => {
  edge.objects.set(edge.files[0]?.storagePath ?? "", Buffer.from("not a pdf"));
  const error = await read().catch((caught: unknown) => caught);
  expect(edge.credits).toEqual({ balance: 0, held: -1 });

  await failProcessReport({ reportId }, error);

  expect(edge.create).not.toHaveBeenCalled();
  expect(edge.statuses.at(-1)?.[1]).toBe("failed");
  expect(edge.credits).toEqual({ balance: 1, held: 0 });
});

const sha256 = (data: Buffer) => createHash("sha256").update(data).digest("hex");

test("a second copy of a file in the same upload is skipped and removed, and the first is read", async () => {
  addFile(1, Buffer.from(labPdf));
  edge.create
    .mockResolvedValueOnce(classified("lab_panel"))
    .mockResolvedValueOnce(toolUse("record_extraction", compact(extraction)))
    .mockResolvedValueOnce(toolUse("map_markers", mappings));

  await read();

  expect(edge.fileUpdates).toEqual([
    ["file-0", { sha256: sha256(labPdf), pageClasses: ["lab_panel"] }],
    ["file-1", { sha256: sha256(labPdf), skipReason: "duplicate" }],
  ]);
  expect(edge.removed).toEqual([`alice/${reportId}/1.pdf`]);
  expect(edge.saved).toHaveLength(1);
});

test("a file already in another report of the profile fails with the duplicate message and no Claude call", async () => {
  edge.hashes.push(sha256(labPdf));

  const error = await read().catch((caught: unknown) => caught);
  await failProcessReport({ reportId }, error);

  expect(edge.create).not.toHaveBeenCalled();
  expect(edge.removed).toEqual([`alice/${reportId}/0.pdf`]);
  expect(edge.statuses.at(-1)).toEqual([
    reportId,
    "failed",
    "This file is already in your reports.",
  ]);
  expect(edge.credits).toEqual({ balance: 1, held: 0 });
});

test("an identity page is cut from the stored PDF and never reaches extraction", async () => {
  edge.files.length = 0;
  addFile(0, textPdf([labPage, idPage]));
  edge.create
    .mockResolvedValueOnce(classified("lab_panel", "identity_document"))
    .mockResolvedValueOnce(toolUse("record_extraction", compact(extraction)))
    .mockResolvedValueOnce(toolUse("map_markers", mappings));

  await read();

  const [[path, stored]] = edge.uploads as [[string, Buffer]];
  expect(path).toBe(`alice/${reportId}/0.pdf`);
  const pages = await pdfPageTexts(stored);
  expect(pages).toHaveLength(1);
  expect(pages?.join("")).not.toContain("Aadhaar");
  const extractCall = edge.create.mock.calls[1]?.[0] as { messages: unknown[] };
  expect(JSON.stringify(extractCall.messages)).toContain("Haemoglobin");
  expect(JSON.stringify(extractCall.messages)).not.toContain("Aadhaar");
  expect(edge.fileUpdates).toEqual([
    ["file-0", { sha256: expect.any(String), pageClasses: ["lab_panel", "identity_document"] }],
  ]);
});

test("an identity photo is deleted from storage and the lab file is still read", async () => {
  const photo = await sharp({
    create: { width: 40, height: 25, channels: 3, background: "#ffffff" },
  })
    .jpeg()
    .toBuffer();
  addFile(1, photo, "image/jpeg");
  edge.create
    .mockResolvedValueOnce(classified("lab_panel"))
    .mockResolvedValueOnce(classified("identity_document"))
    .mockResolvedValueOnce(toolUse("record_extraction", compact(extraction)))
    .mockResolvedValueOnce(toolUse("map_markers", mappings));

  await read();

  expect(edge.removed).toEqual([`alice/${reportId}/1.jpg`]);
  expect(edge.fileUpdates.at(-1)).toEqual([
    "file-1",
    { sha256: sha256(photo), pageClasses: ["identity_document"], skipReason: "identity" },
  ]);
  const extractCall = edge.create.mock.calls[2]?.[0] as { messages: { content: unknown[] }[] };
  expect(JSON.stringify(extractCall.messages)).not.toContain(photo.toString("base64"));
  expect(edge.saved).toHaveLength(1);
});

test("reference table rows are dropped and a name printed over two lines maps as hs-CRP", async () => {
  edge.create.mockResolvedValueOnce(classified("lab_panel")).mockResolvedValueOnce(
    toolUse(
      "record_extraction",
      compact({
        collectedAt: "2025-02-01",
        markers: [
          { rawName: "HIGH SENSITIVITY C-REACTIVE", value: 0.78, unit: "mg/L", pageIndex: 0 },
          { rawName: "Haemoglobin", value: 13.47, unit: "g/dL", pageIndex: 0 },
          { rawName: "Cord blood", value: "2.2 to 10.7", pageIndex: 0 },
          { rawName: "1 to 4 days", value: "2.7 to 26.5", pageIndex: 0 },
        ],
      }),
    ),
  );

  await read();

  const [[, , markers]] = edge.saved as [[string, unknown, Record<string, unknown>[]]];
  expect(markers.filter((row) => !row.derived).map((row) => [row.rawName, row.markerKey])).toEqual([
    ["HIGH SENSITIVITY C-REACTIVE PROTEIN (HS-CRP)", "hs_crp"],
    ["Haemoglobin", "hemoglobin"],
  ]);
});

const xrayPage = [
  "  X-RAY CHEST PA   Both lung fields are clear. Heart size is normal. No bony injury seen.",
  "  IMPRESSION: No Abnormality Detected",
];
const xrayStudy = {
  page: 1,
  kind: "xray",
  bodyRegion: "Chest PA",
  performedAt: "2025-02-01",
  signedBy: "Dr. P K Sen",
  findings: "Lungs: Bilateral lung fields are clear.",
  impression: "No Abnormality Detected",
  familyHistory: null,
  measurements: [],
};
const examStudy = {
  page: 1,
  kind: "examination",
  bodyRegion: null,
  performedAt: null,
  signedBy: "Dr. R Patil",
  findings: "Distant vision: 6/6, 6/5",
  impression: "Fit",
  familyHistory: "Mother is a k/c/o thyroid disorder.",
  measurements: [
    ["height", 166, null, null],
    ["weight", 73, null, null],
    ["systolic_bp", 107, "mmHg", null],
    ["diastolic_bp", 67, "mmHg", null],
    ["pulse", 83, "bpm", null],
  ],
};
const ecgStudy = {
  page: 1,
  kind: "ecg",
  bodyRegion: null,
  performedAt: "2025-02-01",
  signedBy: null,
  findings: null,
  impression: "Sinus rhythm\nOtherwise normal ECG\nUnconfirmed report",
  familyHistory: null,
  measurements: [
    ["heart_rate", 70, "bpm", null],
    ["qtc_interval", 433, "ms", null],
    ["right_kidney_length", "90 x 44", "mm", null],
  ],
};
const studies = (...items: object[]) => toolUse("record_studies", { ageYears: 25, studies: items });
const photo = () =>
  sharp({ create: { width: 40, height: 25, channels: 3, background: "#ffffff" } })
    .jpeg()
    .toBuffer();

type SavedStudy = { study: Record<string, unknown>; measurements: Record<string, unknown>[] };
type Saved = [
  string,
  Record<string, unknown>,
  Record<string, unknown>[],
  unknown[],
  unknown[],
  SavedStudy[],
];

test("an imaging page goes to the study reader, never to lab extraction, and its film sits with it", async () => {
  edge.files.length = 0;
  addFile(0, textPdf([labPage, xrayPage]));
  addFile(1, await photo(), "image/jpeg");
  edge.create
    .mockResolvedValueOnce(classified("lab_panel", "imaging_report"))
    .mockResolvedValueOnce(classified("raw_image"))
    .mockResolvedValueOnce(studies(xrayStudy))
    .mockResolvedValueOnce(toolUse("record_extraction", compact(extraction)))
    .mockResolvedValueOnce(toolUse("map_markers", mappings));

  await read();

  expect(edge.uploads).toEqual([]);
  const [studiesCall, extractCall] = edge.create.mock.calls
    .slice(2)
    .map(([request]) => request as { system: { text: string }[]; messages: unknown[] });
  expect(studiesCall).toMatchObject({ model: "claude-haiku-5-5" });
  expect(JSON.stringify(studiesCall?.messages)).toContain("X-RAY");
  expect(JSON.stringify(studiesCall?.messages)).not.toContain("Haemoglobin");
  expect(JSON.stringify(studiesCall?.messages)).not.toContain('"type":"image"');
  expect(studiesCall?.system[0]?.text).toContain(
    "Never read an X-ray film, a scan image or an ECG trace.",
  );
  expect(JSON.stringify(extractCall?.messages)).toContain("Haemoglobin");
  expect(JSON.stringify(extractCall?.messages)).not.toContain("X-RAY");
  const [[, report, , , , stored]] = edge.saved as [Saved];
  expect(report).toMatchObject({ score: expect.any(Number), verdict: expect.any(String) });
  expect(stored).toEqual([
    {
      study: expect.objectContaining({
        kind: "xray",
        impressionText: "No Abnormality Detected",
        reportFileId: "file-0",
        pageIndex: 1,
        filmFileId: "file-1",
      }),
      measurements: [],
    },
  ]);
});

test("examination form vitals become markers with a BMI and leave the lab score alone", async () => {
  edge.create
    .mockResolvedValueOnce(classified("lab_panel"))
    .mockResolvedValueOnce(toolUse("record_extraction", compact(extraction)))
    .mockResolvedValueOnce(toolUse("map_markers", mappings));
  await read();
  const [[, labOnly]] = edge.saved as [Saved];
  edge.saved.length = 0;
  edge.files.length = 0;
  addFile(0, labPdf);
  addFile(1, await photo(), "image/jpeg");
  edge.create
    .mockReset()
    .mockResolvedValueOnce(classified("lab_panel"))
    .mockResolvedValueOnce(classified("examination_form"))
    .mockResolvedValueOnce(studies(examStudy))
    .mockResolvedValueOnce(toolUse("record_extraction", compact(extraction)))
    .mockResolvedValueOnce(toolUse("map_markers", mappings));

  await read();

  const [[, report, markers, , , stored]] = edge.saved as [Saved];
  expect(report.score).toBe(labOnly.score);
  expect(report.verdict).toBe(labOnly.verdict);
  const row = (key: string) => markers.find((marker) => marker.markerKey === key);
  expect(row("height")).toMatchObject({ value: 166, unit: "cm", status: null });
  expect(row("systolic_bp")).toMatchObject({ value: 107, status: "optimal" });
  expect(row("pulse")).toMatchObject({ value: 83, status: "optimal" });
  expect(row("bmi")).toMatchObject({ value: 26.5, derived: true, status: "watch" });
  expect(stored).toEqual([
    {
      study: expect.objectContaining({
        kind: "examination",
        impressionText: "Fit",
        familyHistory: "Mother is a k/c/o thyroid disorder.",
      }),
      measurements: [],
    },
  ]);
});

test("a report with only an ECG is done with no score, and its values get a status from the catalog", async () => {
  edge.files.length = 0;
  addFile(0, await photo(), "image/jpeg");
  edge.create
    .mockResolvedValueOnce(classified("ecg_printout"))
    .mockResolvedValueOnce(studies(ecgStudy));

  await read();

  expect(edge.create).toHaveBeenCalledTimes(2);
  expect(edge.create.mock.calls[1]?.[0]).toMatchObject({ model: "claude-sonnet-5-5" });
  const [[, report, markers, , followUps, stored]] = edge.saved as [Saved];
  expect(report).toMatchObject({
    score: null,
    tier: null,
    verdict: null,
    collectedAt: "2025-02-01",
    narrativeStatus: null,
  });
  expect(markers).toEqual([]);
  expect(followUps).toEqual([]);
  expect(stored[0]?.measurements).toEqual([
    expect.objectContaining({ key: "heart_rate", value: 70, status: "optimal" }),
    expect.objectContaining({ key: "qtc_interval", value: 433, status: "optimal" }),
    expect.objectContaining({
      key: "right_kidney_length",
      value: 90,
      valueText: "90 x 44",
      status: null,
    }),
  ]);
});

test("a film uploaded alone is kept with no study and the report is done", async () => {
  edge.files.length = 0;
  addFile(0, await photo(), "image/jpeg");
  edge.create.mockResolvedValueOnce(classified("raw_image"));

  await read();

  expect(edge.create).toHaveBeenCalledTimes(1);
  expect(edge.removed).toEqual([]);
  const [[, report, , , , stored]] = edge.saved as [Saved];
  expect(report).toMatchObject({ score: null });
  expect(stored).toEqual([]);
});

const papPage = [
  "  CYTOLOGY   Specimen type   Cervical smear",
  "  General consideration   Negative for Intraepithelial Lesion or Malignancy",
  "  Impression   Atrophy with inflammation",
];
const papStudy = {
  page: 1,
  kind: "pathology",
  bodyRegion: null,
  performedAt: "2025-02-01",
  signedBy: "Dr. Kiran Joshi",
  findings: "Smear studied shows few superficial and intermediate squamous cells.",
  impression: "Atrophy with inflammation",
  familyHistory: null,
  specimen: "Cervical smear",
  adequacy: "Smear is satisfactory for evaluation.",
  result: "Negative for Intraepithelial Lesion or Malignancy",
  measurements: [],
};
const pelvisUsgStudy = {
  page: 1,
  kind: "ultrasound",
  bodyRegion: "Abdomen & Pelvis",
  performedAt: "2025-02-01",
  signedBy: "Dr. Neha Kulkarni",
  findings: "Liver: No focal mass lesions seen.",
  impression: [
    "Grade I fatty liver.",
    "Heterogenous, solid, round to oval mass lesion in left adnexa. On color doppler, it shows vascularity.",
    "Left ovary could not be seen separate from it.",
    "Mild fluid in POD.",
  ].join("\n"),
  familyHistory: null,
  measurements: [],
};

test("a PAP smear page is a pathology study with its result and impression, never marker rows", async () => {
  edge.files.length = 0;
  addFile(0, textPdf([labPage, papPage]));
  edge.create
    .mockResolvedValueOnce(classified("lab_panel", "pathology_report"))
    .mockResolvedValueOnce(studies(papStudy))
    .mockResolvedValueOnce(toolUse("record_extraction", compact(extraction)))
    .mockResolvedValueOnce(toolUse("map_markers", mappings));

  await read();

  const [studiesCall, extractCall] = edge.create.mock.calls
    .slice(1)
    .map(([request]) => request as { messages: unknown[] });
  expect(JSON.stringify(studiesCall?.messages)).toContain("a pathology report");
  expect(JSON.stringify(extractCall?.messages)).not.toContain("CYTOLOGY");
  const [[, , markers, , , stored]] = edge.saved as [Saved];
  expect(markers.map((row) => row.rawName)).not.toContain("Specimen type");
  expect(stored).toEqual([
    {
      study: expect.objectContaining({
        kind: "pathology",
        specimen: "Cervical smear",
        adequacy: "Smear is satisfactory for evaluation.",
        resultText: "Negative for Intraepithelial Lesion or Malignancy",
        impressionText: "Atrophy with inflammation",
      }),
      measurements: [],
    },
  ]);
});

test("a re-read classifies stored pages again, so a PAP smear stored as lab_panel becomes a pathology study", async () => {
  edge.files.length = 0;
  const pdf = textPdf([labPage, papPage]);
  Object.assign(addFile(0, pdf), {
    sha256: sha256(pdf),
    pageClasses: ["identity_document", "lab_panel", "lab_panel"],
  });
  edge.create
    .mockResolvedValueOnce(classified("lab_panel", "pathology_report"))
    .mockResolvedValueOnce(studies(papStudy))
    .mockResolvedValueOnce(toolUse("record_extraction", compact(extraction)))
    .mockResolvedValueOnce(toolUse("map_markers", mappings));

  await processReport(reportId, reportUsage(), true);

  expect(edge.fileUpdates).toEqual([
    [
      "file-0",
      { sha256: sha256(pdf), pageClasses: ["identity_document", "lab_panel", "pathology_report"] },
    ],
  ]);
  expect(edge.uploads).toEqual([]);
  const extractCall = edge.create.mock.calls[2]?.[0] as { messages: unknown[] };
  expect(JSON.stringify(extractCall.messages)).not.toContain("CYTOLOGY");
  const [[, , markers, , , stored]] = edge.saved as [Saved];
  expect(markers.map((row) => row.rawName)).not.toContain("Specimen type");
  expect(stored).toEqual([
    {
      study: expect.objectContaining({
        kind: "pathology",
        pageIndex: 2,
        resultText: "Negative for Intraepithelial Lesion or Malignancy",
        impressionText: "Atrophy with inflammation",
      }),
      measurements: [],
    },
  ]);
});

test("a re-read that keeps the stored classes makes no classify call", async () => {
  edge.files[0]!.pageClasses = ["lab_panel"];
  edge.create
    .mockResolvedValueOnce(toolUse("record_extraction", compact(extraction)))
    .mockResolvedValueOnce(toolUse("map_markers", mappings));

  await processReport(reportId, reportUsage());

  expect(edge.create.mock.calls[0]?.[0]).toMatchObject({
    tools: [{ name: "record_extraction" }],
  });
  expect(edge.fileUpdates).toEqual([]);
});

test("An adnexal mass line is the first finding, a doctor question and the first headline sentence", async () => {
  edge.files.length = 0;
  addFile(0, textPdf([labPage, xrayPage]));
  edge.create
    .mockResolvedValueOnce(classified("lab_panel", "imaging_report"))
    .mockResolvedValueOnce(studies(pelvisUsgStudy))
    .mockResolvedValueOnce(toolUse("record_extraction", compact(extraction)))
    .mockResolvedValueOnce(toolUse("map_markers", mappings))
    .mockResolvedValueOnce(toolUse("write_narrative", draft))
    .mockRejectedValueOnce(new Error("overloaded"));

  await read();

  const line = "Heterogenous, solid, round to oval mass lesion in left adnexa.";
  const [[, report, , , , , findings]] = edge.saved as [
    [string, { doctorQuestions: string[]; narrative: typeof narrative }, ...unknown[]],
  ];
  expect(findings).toEqual([
    expect.objectContaining({
      kind: "study_alert",
      severity: "risk",
      title: `Your ultrasound report says: "${line}"`,
      body: "Your ultrasound report prints this line. Ask your doctor about this line of the report.",
    }),
  ]);
  expect(report.doctorQuestions[0]).toBe(
    `My ultrasound report says: "${line}" What does this line mean for me?`,
  );
  expect(report.narrative.sections[0]?.sentences.map(({ text }) => text)).toEqual([
    "Ask your doctor about a line in your ultrasound report.",
    "Most markers are optimal.",
  ]);
});
