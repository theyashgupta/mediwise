import { expect, test } from "vitest";
import { db } from "../../db/client.js";
import { reports } from "../../db/schema.js";
import { reportColumns } from "./reports.repo.js";

test("the marker count matches markers to the outer report, not to its own id", () => {
  const { sql } = db.select(reportColumns).from(reports).toSQL();
  expect(sql).toContain(`"report_markers"."report_id" = "reports"."id"`);
});
