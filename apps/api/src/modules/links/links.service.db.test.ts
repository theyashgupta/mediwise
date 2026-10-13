import { randomUUID } from "node:crypto";
import { beforeAll, expect, test } from "vitest";
import { denseHistoryReports, insertDenseHistory } from "../../db/dense-history.js";
import { loadLaterVisits } from "./links.service.js";

const dense = denseHistoryReports("2026-10-13");
const moonLabs = dense.findIndex((report) => report.labName === "Moon Labs");
let profileId: string;
let ids: string[];

beforeAll(async () => {
  ({ profileId, reportIds: ids } = await insertDenseHistory(randomUUID(), dense));
});

test("the MEDI-71 repeat rule reads a typical gap of 7 days and the reports of the next 30 days, same-day twin included", async () => {
  const { later, typicalGap } = await loadLaterVisits(profileId, ids[moonLabs]!, "2026-09-15");

  expect(typicalGap).toBe(7);
  expect(later.map(({ reportId, date }) => `${ids.indexOf(reportId)} ${date}`)).toEqual([
    `${moonLabs + 1} 2026-09-15`,
    `${moonLabs + 2} 2026-09-22`,
    `${moonLabs + 3} 2026-09-29`,
    `${moonLabs + 4} 2026-10-06`,
    `${moonLabs + 5} 2026-10-13`,
  ]);
  expect(later.every(({ linked }) => !linked)).toBe(true);
});

test("the MEDI-71 repeat rule stops at 30 days after the report", async () => {
  const { later } = await loadLaterVisits(profileId, ids[1]!, "2026-08-11");

  expect(later.map(({ date }) => date)).toEqual([
    "2026-08-18",
    "2026-08-25",
    "2026-09-01",
    "2026-09-08",
  ]);
});
