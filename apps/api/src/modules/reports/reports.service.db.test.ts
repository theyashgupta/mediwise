import { randomUUID } from "node:crypto";
import { beforeAll, expect, test } from "vitest";
import { denseHistoryReports, insertDenseHistory } from "../../db/dense-history.js";
import { getMarkerDetail } from "./reports.service.js";

const dense = denseHistoryReports("2026-10-13");
const moonLabs = dense.findIndex((report) => report.labName === "Moon Labs");
const userId = randomUUID();
let ids: string[];

beforeAll(async () => {
  ({ reportIds: ids } = await insertDenseHistory(userId, dense));
});

test("audit row 16: on a date with two reports, the marker page history keeps the point of the open report", async () => {
  const pointOn15Sep = async (reportId: string) => {
    const { history } = await getMarkerDetail(userId, reportId, "glucose_fasting");
    expect(history).toHaveLength(11);
    return history.find(({ collectedAt }) => collectedAt === "2026-09-15");
  };

  expect(await pointOn15Sep(ids[moonLabs]!)).toMatchObject({ reportId: ids[moonLabs], value: 95 });
  expect(await pointOn15Sep(ids[moonLabs + 1]!)).toMatchObject({
    reportId: ids[moonLabs + 1],
    value: 98,
  });
});
