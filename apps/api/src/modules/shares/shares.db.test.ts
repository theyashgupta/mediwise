import { createHash, randomUUID } from "node:crypto";
import { Hono } from "hono";
import { expect, test } from "vitest";
import { handleError } from "../../common/problem.js";
import { db } from "../../db/client.js";
import { profiles, reportMarkers, reports } from "../../db/schema.js";
import { cipherFor } from "../../db/user-keys.js";
import { sharedExportRoutes } from "./shares.routes.js";
import { createShare, endShare } from "./shares.service.js";

const appWithoutSession = new Hono().route("/share", sharedExportRoutes);
appWithoutSession.onError(handleError);

/** Writes a done report with one unmapped marker for a new profile of the user, its text encrypted as the API stores it. */
async function doneReport(userId: string, name: string, markerName: string) {
  const cipher = await cipherFor(userId);
  const [profile] = await db
    .insert(profiles)
    .values({
      ownerUserId: userId,
      name: cipher.encrypt(name),
      relation: "self",
      ancestry: "unknown",
    })
    .returning({ id: profiles.id });
  const [report] = await db
    .insert(reports)
    .values({
      profileId: profile!.id,
      sourceKind: "pdf",
      status: "done",
      collectedAt: "2025-03-01",
      title: cipher.encrypt(`${markerName} title`),
      note: cipher.encrypt(`${markerName} note`),
      doctorQuestions: cipher.encryptJson([`${markerName} question?`]),
    })
    .returning({ id: reports.id });
  await db
    .insert(reportMarkers)
    .values({ reportId: report!.id, rawName: markerName, value: 12.5, unit: "mg/L" });
  return { profileId: profile!.id, reportId: report!.id };
}

test("an anonymous request with an open token reads the shared report only", async () => {
  const owner = randomUUID();
  const shared = await doneReport(owner, "Asha Testcase", "Shared marker");
  const otherProfile = await doneReport(owner, "Ravi Testcase", "Other profile marker");
  const stranger = randomUUID();
  const strangerReport = await doneReport(stranger, "Mira Testcase", "Stranger marker");
  const { token } = await createShare(owner, shared.reportId, 7);

  const response = await appWithoutSession.request(`/share/${token}`);

  expect(response.status).toBe(200);
  const body = await response.text();
  expect(body).toContain("Shared marker");
  expect(JSON.parse(body).person).toEqual({ firstName: "Asha", age: null });
  expect(JSON.parse(body).report).toMatchObject({
    header: { title: "Shared marker title" },
    note: "Shared marker note",
    doctorQuestions: ["Shared marker question?"],
  });
  expect(body).not.toContain("v1:");
  for (const hidden of [
    "Testcase",
    owner,
    shared.profileId,
    shared.reportId,
    otherProfile.reportId,
    "Other profile marker",
    stranger,
    strangerReport.reportId,
    "Stranger marker",
    token,
    createHash("sha256").update(token).digest("hex"),
  ]) {
    expect(body).not.toContain(hidden);
  }
});

test("a wrong or ended token reads nothing", async () => {
  const owner = randomUUID();
  const { reportId } = await doneReport(owner, "Asha Testcase", "Shared marker");
  const share = await createShare(owner, reportId, 7);
  await endShare(owner, reportId, share.id);

  for (const token of [share.token, randomUUID()]) {
    const response = await appWithoutSession.request(`/share/${token}`);
    expect(response.status).toBe(404);
    expect(await response.text()).not.toContain("Shared marker");
  }
});
