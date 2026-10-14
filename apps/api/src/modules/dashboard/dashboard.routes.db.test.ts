import { Hono } from "hono";
import { testClient } from "hono/testing";
import { randomUUID } from "node:crypto";
import { expect, test } from "vitest";
import { handleError } from "../../common/problem.js";
import { db } from "../../db/client.js";
import * as schema from "../../db/schema.js";
import type { AuthEnv } from "../../middleware/auth.js";
import { dashboardRoutes } from "./dashboard.routes.js";

const userId = randomUUID();
const app = new Hono<AuthEnv>()
  .use(async (c, next) => {
    c.set("userId", userId);
    await next();
  })
  .route("/dashboard", dashboardRoutes);
app.onError(handleError);

const fullPanel = [
  "hba1c",
  "ldl",
  "hdl",
  "triglycerides",
  "tsh",
  "vitamin_d",
  "vitamin_b12",
  "hemoglobin",
  "creatinine",
  "alt",
];

/** Writes a done report with one pelvis ultrasound, and a full panel when `markerKeys` are given. */
async function doneReport(
  profileId: string,
  date: string,
  study: { bodyRegion: string; impressionText: string },
  markerKeys: string[] = [],
) {
  const [report] = await db
    .insert(schema.reports)
    .values({
      profileId,
      sourceKind: "pdf",
      status: "done",
      collectedAt: date,
      labName: "Lakeview Imaging Centre",
      score: markerKeys.length > 0 ? 80 : null,
      coverage: markerKeys.length > 0 ? 100 : null,
    })
    .returning({ id: schema.reports.id });
  const [file] = await db
    .insert(schema.reportFiles)
    .values({ reportId: report!.id, storagePath: "x.pdf", mime: "application/pdf", size: 1 })
    .returning({ id: schema.reportFiles.id });
  const [stored] = await db
    .insert(schema.studies)
    .values({
      reportId: report!.id,
      kind: "ultrasound",
      performedAt: date,
      reportFileId: file!.id,
      pageIndex: 0,
      ...study,
    })
    .returning({ id: schema.studies.id });
  if (markerKeys.length > 0)
    await db.insert(schema.reportMarkers).values(
      markerKeys.map((markerKey) => ({
        reportId: report!.id,
        markerKey,
        rawName: markerKey,
        value: 1,
        status: "optimal" as const,
      })),
    );
  return { reportId: report!.id, studyId: stored!.id };
}

test("the newest finding drops a study alert that a confirmed link to a later report settled", async () => {
  const [profile] = await db
    .insert(schema.profiles)
    .values({ ownerUserId: userId, name: "Asha Testcase", relation: "self", ancestry: "unknown" })
    .returning({ id: schema.profiles.id });
  const earlier = await doneReport(
    profile!.id,
    "2025-03-18",
    { bodyRegion: "Pelvis", impressionText: "A 4.2 x 3.1 cm complex mass in the right adnexa." },
    fullPanel,
  );
  const later = await doneReport(profile!.id, "2025-03-22", {
    bodyRegion: "Abdomen and pelvis",
    impressionText: "No adnexal mass.",
  });
  await db.insert(schema.findings).values({
    reportId: earlier.reportId,
    kind: "study_alert",
    severity: "risk",
    title: "The ultrasound shows a mass in the right adnexa",
    body: "Body.",
    citedKeys: [],
    citedStudyIds: [earlier.studyId],
    rank: 1,
  });
  const newestFinding = async () => {
    const res = await testClient(app).dashboard.$get({ query: { profileId: profile!.id } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.json()).newestFinding;
  };

  expect(await newestFinding()).toEqual({
    reportId: earlier.reportId,
    title: "The ultrasound shows a mass in the right adnexa",
  });

  await db.insert(schema.reportLinks).values({
    earlierReportId: earlier.reportId,
    laterReportId: later.reportId,
    kind: "repeat",
    createdBy: "user",
    state: "confirmed",
  });
  expect(await newestFinding()).toBeNull();
});
