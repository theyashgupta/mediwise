import { randomUUID } from "node:crypto";
import { expect, test } from "vitest";
import { denseHistoryReports, insertDenseHistory } from "../../db/dense-history.js";
import { listSeries } from "../trends/index.js";
import { buildYearReview } from "./year-review.service.js";

test("audit row 20: the year in review score compares the two full panels, not the last glucose-only report", async () => {
  const userId = randomUUID();
  const { profileId } = await insertDenseHistory(userId, denseHistoryReports("2026-10-13"));
  const { reports, series } = await listSeries(userId, profileId);

  expect(buildYearReview(reports, series)).toMatchObject({
    from: "2026-08-04",
    to: "2026-10-13",
    reportCount: 12,
    labCount: 3,
    score: { from: 81, to: 86 },
  });
});
