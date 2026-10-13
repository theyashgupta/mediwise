import { daysBetween } from "@mediwise/engine";
import { eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { beforeAll, expect, test } from "vitest";
import { db } from "../../db/client.js";
import { denseHistoryReports, insertDenseHistory } from "../../db/dense-history.js";
import { reports } from "../../db/schema.js";
import { compareReports, getTrend, listEarlierValues } from "./trends.service.js";

const lastDate = "2026-10-13";
const dense = denseHistoryReports(lastDate);
const moonLabs = dense.findIndex((report) => report.labName === "Moon Labs");
const sameDayTwin = moonLabs + 1;
const userId = randomUUID();
let profileId: string;
let ids: string[];

beforeAll(async () => {
  ({ profileId, reportIds: ids } = await insertDenseHistory(userId, dense));
});

async function glucose(owner = userId, profile = profileId) {
  return getTrend(owner, profile, "glucose_fasting");
}

async function earlierByKey(reportId: string) {
  return new Map((await listEarlierValues(userId, reportId)).map((item) => [item.markerKey, item]));
}

test("audit row 11: two reports of one date give one glucose point, and the other value rides along", async () => {
  const { points, change } = await glucose();

  expect(points).toHaveLength(11);
  expect(points.find(({ collectedAt }) => collectedAt === "2026-09-15")).toMatchObject({
    reportId: ids[sameDayTwin],
    value: 98,
    sameDay: [{ reportId: ids[moonLabs], value: 95, labName: "Moon Labs" }],
  });
  expect(change).toEqual({ absolute: -3, percent: -3.2 });
});

test("the bucket-by-day rule picks the latest upload of a day, not the first row of the date", async () => {
  const owner = randomUUID();
  const seeded = await insertDenseHistory(owner, dense);
  await db
    .update(reports)
    .set({ createdAt: new Date(`${dense[moonLabs]!.collectedAt}T23:00:00Z`) })
    .where(eq(reports.id, seeded.reportIds[moonLabs]!));

  const { points } = await glucose(owner, seeded.profileId);

  expect(points.find(({ collectedAt }) => collectedAt === "2026-09-15")).toMatchObject({
    reportId: seeded.reportIds[moonLabs],
    value: 95,
    sameDay: [{ reportId: seeded.reportIds[sameDayTwin], value: 98 }],
  });
});

test("audit row 15: the 90-day zoom holds the weekly points and leaves out a panel from a year before", async () => {
  const owner = randomUUID();
  const yearBefore = denseHistoryReports("2025-10-13")[0]!;
  const seeded = await insertDenseHistory(owner, [yearBefore, ...dense]);

  const { points } = await glucose(owner, seeded.profileId);
  const days = points.map(({ collectedAt }) => collectedAt!);
  const recent = days.filter((day) => daysBetween(day, lastDate) <= 90);

  expect(days[0]).toBe("2025-08-04");
  expect(recent).toHaveLength(11);
  expect(recent[0]).toBe("2026-08-04");
  expect(recent.at(-1)).toBe(lastDate);
});

test("the newest earlier value with no same-day pair is each marker's own last value", async () => {
  const earlier = await earlierByKey(ids[4]!);

  expect(earlier.get("glucose_fasting")).toMatchObject({ value: 99, collectedAt: "2026-08-25" });
  expect(earlier.get("hba1c")).toMatchObject({ value: 6.1, collectedAt: "2026-08-04" });
});

test("the newest earlier value skips the same-day twin, and a later report takes the newest upload of that day", async () => {
  const twin = await earlierByKey(ids[sameDayTwin]!);
  const weekAfter = await earlierByKey(ids[sameDayTwin + 1]!);

  expect(twin.get("glucose_fasting")).toMatchObject({ value: 96, collectedAt: "2026-09-08" });
  expect(weekAfter.get("glucose_fasting")).toMatchObject({
    value: 98,
    reportId: ids[sameDayTwin],
    collectedAt: "2026-09-15",
  });
});

test("audit row 22: the second full panel takes each marker's newest earlier value, even six reports back", async () => {
  const earlier = await earlierByKey(ids[moonLabs]!);

  expect(earlier.get("glucose_fasting")).toMatchObject({ collectedAt: "2026-09-08" });
  expect(earlier.get("hba1c")).toMatchObject({ collectedAt: "2026-09-01" });
  expect(earlier.get("ldl_cholesterol")).toMatchObject({
    reportId: ids[0],
    collectedAt: "2026-08-04",
    labName: "Sunrise Diagnostics",
  });
});

test("audit row 17: compare with b alone skips the report of the same date as b", async () => {
  const { a, b } = await compareReports(userId, { b: ids[sameDayTwin]! });

  expect(a?.id).toBe(ids[moonLabs - 1]);
  expect(b?.id).toBe(ids[sameDayTwin]);
});

test("audit row 18: compare puts the older report first when the pair is picked newest first", async () => {
  const { a, b } = await compareReports(userId, { a: ids.at(-1)!, b: ids[0]! });

  expect([a?.id, b?.id]).toEqual([ids[0], ids.at(-1)]);
});

test("audit row 19: compare picks any two reports, also two narrow ones or a same-day pair", async () => {
  const glucoseRow = async (a: string, b: string) => {
    const { groups } = await compareReports(userId, { a, b });
    return groups.flatMap(({ rows }) => rows).find((row) => row.markerKey === "glucose_fasting");
  };

  expect(await glucoseRow(ids[1]!, ids.at(-2)!)).toMatchObject({ valueA: 104, valueB: 94 });
  expect(await glucoseRow(ids[sameDayTwin]!, ids[moonLabs]!)).toMatchObject({
    valueA: 95,
    valueB: 98,
  });
});

test("the MEDI-71 repeat rule links only rechecks of a watch glucose value in a weekly history", async () => {
  const { points } = await glucose();

  expect(points.map(({ status, linked }) => `${status}:${linked}`)).toEqual([
    "watch:true",
    "watch:true",
    "watch:true",
    "optimal:true",
    ...Array<string>(7).fill("optimal:false"),
  ]);
});

test("the MEDI-71 repeat rule links a weekly recheck of a risk value", async () => {
  const owner = randomUUID();
  const seeded = denseHistoryReports(lastDate);
  seeded.at(-2)!.markers.find(({ markerKey }) => markerKey === "glucose_fasting")!.status = "risk";
  const { profileId: profile } = await insertDenseHistory(owner, seeded);

  const { points } = await glucose(owner, profile);

  expect(points.slice(-3).map(({ status, linked }) => `${status}:${linked}`)).toEqual([
    "optimal:false",
    "risk:true",
    "optimal:true",
  ]);
});

test("the MEDI-71 repeat rule links an optimal recheck when the profile has only two report dates", async () => {
  const owner = randomUUID();
  const { profileId: profile } = await insertDenseHistory(owner, dense.slice(3, 5));

  const { points } = await glucose(owner, profile);

  expect(points.map(({ status, linked }) => `${status}:${linked}`)).toEqual([
    "optimal:true",
    "optimal:true",
  ]);
});
