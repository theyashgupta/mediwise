import { daysBetween } from "@mediwise/engine";
import { randomUUID } from "node:crypto";
import { expect, test } from "vitest";
import { denseHistoryReports, insertDenseHistory } from "../../db/dense-history.js";
import { getDashboard, getFamily } from "./dashboard.service.js";

const lastDate = "2026-10-13";
const dense = denseHistoryReports(lastDate);

/** Seeds the history up to the glucose-only report before the last, so the newest HbA1c is the watch value of 15 Sep. */
async function seedWithoutLastReport() {
  const userId = randomUUID();
  const { profileId } = await insertDenseHistory(userId, dense.slice(0, -1));
  return { userId, profileId, today: dense.at(-2)!.collectedAt };
}

test("audit row 4: Home compares the newest full panel with the previous full panel, not a glucose-only report", async () => {
  const userId = randomUUID();
  const { profileId, reportIds } = await insertDenseHistory(userId, dense);

  const { latest, newSince } = await getDashboard(userId, profileId);

  expect(latest).toMatchObject({
    id: reportIds[dense.findIndex((report) => report.labName === "Moon Labs")],
    deltaSincePrevious: { score: 5, since: "2026-08-04" },
  });
  expect(newSince.map(({ date }) => date)).toEqual(["2026-10-13", "2026-10-06", "2026-09-29"]);
});

test("audit row 7: a marker the latest report did not measure keeps the retest date of its last value", async () => {
  const { userId, profileId } = await seedWithoutLastReport();

  const { retests } = await getDashboard(userId, profileId);

  expect(retests).toEqual([
    { markerKey: "hba1c", name: "HbA1c", dueOn: "2027-09-14", measuredOn: "2026-09-15" },
  ]);
});

test("audit row 8: the retest rule sees the HbA1c of 15 Sep as measured in the last 30 days", async () => {
  const { userId, profileId, today } = await seedWithoutLastReport();

  const { retests } = await getDashboard(userId, profileId);

  expect(retests.map(({ measuredOn }) => daysBetween(measuredOn, today))).toEqual([21]);
});

test("audit row 9: the retest names the day the marker was measured, not the day of the latest report", async () => {
  const { userId, profileId, today } = await seedWithoutLastReport();

  const { recent, retests } = await getDashboard(userId, profileId);

  expect(recent[0]?.date).toBe(today);
  expect(retests[0]?.measuredOn).toBe("2026-09-15");
});

test("audit row 10: a profile with weekly reports has a typical gap of 7 days", async () => {
  const userId = randomUUID();
  await insertDenseHistory(userId, dense);

  const [profile] = await getFamily(userId);

  expect(profile).toMatchObject({ typicalGapDays: 7, latest: { date: lastDate } });
});
