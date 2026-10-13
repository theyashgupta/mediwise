import { readFile } from "node:fs/promises";
import { expect, test, vi } from "vitest";

vi.stubEnv("CLAUDE_STUB", "true");
const { extractReport, mapMarkers, readPages, stepUsage } =
  await import("../modules/extraction/index.js");

const golden = (name: string) => new URL(`../../fixtures/golden/${name}`, import.meta.url);

test("the stubbed read of the 2025 sample returns its golden values and mapping", async () => {
  const want = JSON.parse(await readFile(golden("sample-2025.json"), "utf8")) as {
    mapped: number;
    markers: { rawName: string; value: number | null }[];
  };
  const pages = await readPages({
    mime: "application/pdf",
    data: await readFile(golden("sample-2025.pdf")),
  });

  const report = await extractReport(pages, stepUsage("stub"));
  const mapping = await mapMarkers(report.markers, stepUsage("stub"));

  expect(report.lab?.name).toBe("Sunrise Diagnostics");
  expect(report.collectedAt).toBe("2025-03-29");
  expect(report.markers.map(({ rawName, value }) => ({ rawName, value }))).toEqual(
    want.markers.map(({ rawName, value }) => ({ rawName, value: value ?? expect.anything() })),
  );
  expect(mapping.filter(({ markerKey }) => markerKey).length).toBe(want.mapped);
});

test("the stubbed read of a study fixture classifies its page and returns its study", async () => {
  const { classifyPages } = await import("../modules/classification/index.js");
  const { readStudies } = await import("../modules/studies/index.js");
  const pages = await readPages({
    mime: "application/pdf",
    data: await readFile(
      new URL("../../fixtures/studies/usg-pelvis-2025-03-18.pdf", import.meta.url),
    ),
  });

  const classes = await classifyPages(pages, stepUsage("stub"));
  const read = await readStudies(
    pages.map((page, pageIndex) => ({ page, pageClass: classes[pageIndex]!, pageIndex })),
    stepUsage("stub"),
  );

  expect(classes).toEqual(["imaging_report"]);
  expect(read.labName).toBe("Lakeview Imaging Centre");
  expect(read.studies).toMatchObject([
    {
      kind: "ultrasound",
      bodyRegion: "Pelvis",
      performedAt: "2025-03-18",
      impressionText: "A 4.2 x 3.1 cm complex mass in the right adnexa.",
    },
  ]);
});

test("the stub answers the assistant tool with one sentence that cites the oldest report", async () => {
  const { claudeStub } = await import("./anthropic-stub.js");
  const response = await claudeStub.messages.create({
    model: "claude-haiku-5-5",
    max_tokens: 100,
    tools: [{ name: "answer_question", input_schema: { type: "object" } }],
    messages: [{ role: "user", content: "New question: What was my HbA1c?" }],
  });

  expect(response.content).toEqual([
    expect.objectContaining({
      type: "tool_use",
      name: "answer_question",
      input: {
        kind: "answer",
        sentences: [{ text: "Your first report is in MediWise.", cites: ["R1"] }],
      },
    }),
  ]);
});
