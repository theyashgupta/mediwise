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
