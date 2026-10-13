import { randomUUID } from "node:crypto";
import { beforeAll, expect, test } from "vitest";
import { denseHistoryReports, insertDenseHistory } from "../../db/dense-history.js";
import { findEarlierVisits } from "./findings.repo.js";

const dense = denseHistoryReports("2026-10-13");
const moonLabs = dense.findIndex((report) => report.labName === "Moon Labs");
let profileId: string;
let ids: string[];

beforeAll(async () => {
  ({ profileId, reportIds: ids } = await insertDenseHistory(randomUUID(), dense));
});

test("audit row 3: the second full panel loads the first full panel as an earlier visit, six reports back", async () => {
  const earlier = await findEarlierVisits(profileId, ids[moonLabs]!, "2026-09-15");

  expect(earlier.map(({ date }) => date)).toEqual([
    "2026-09-08",
    "2026-09-01",
    "2026-08-25",
    "2026-08-18",
    "2026-08-11",
    "2026-08-04",
  ]);
  expect(earlier.at(-1)?.markers.map(({ markerKey }) => markerKey)).toContain("ldl_cholesterol");
});

test("audit row 3: earlier visits put the newest upload of a date first", async () => {
  const earlier = await findEarlierVisits(profileId, ids.at(-1)!, "2026-10-13");

  expect(earlier).toHaveLength(11);
  expect(earlier.slice(3, 5).map(({ date, labName }) => `${date} ${labName}`)).toEqual([
    "2026-09-15 Lakeview Lab",
    "2026-09-15 Moon Labs",
  ]);
});
