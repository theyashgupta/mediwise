import { createHash, randomBytes } from "node:crypto";
import { AppError } from "../../common/errors.js";
import { getOwnedProfile } from "../profiles/index.js";
import { ageOn, getReport, getReportDetail } from "../reports/index.js";
import { compareReports } from "../trends/index.js";
import * as repo from "./shares.repo.js";

const dayMs = 24 * 60 * 60 * 1000;

const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

/**
 * Makes a link to a done report's export and returns its token, which is never stored or shown again.
 *
 * @remarks
 * The token is 32 random bytes in base64url, so it fits a URL with no escaping and cannot be guessed.
 */
export async function createShare(userId: string, reportId: string, days: number) {
  const report = await getReport(userId, reportId);
  if (report.status !== "done") {
    throw new AppError(409, "You can share a report only after MediWise reads it");
  }
  const token = randomBytes(32).toString("base64url");
  const share = await repo.insertShare({
    reportId,
    ownerUserId: userId,
    tokenHash: hashToken(token),
    expiresAt: new Date(Date.now() + days * dayMs),
  });
  return { ...share, token };
}

export async function listShares(userId: string, reportId: string) {
  await getReport(userId, reportId);
  return repo.listOpenShares(userId, reportId);
}

export async function endShare(userId: string, reportId: string, shareId: string) {
  if (!(await repo.endShare(userId, reportId, shareId))) {
    throw new AppError(404, "We could not find this link");
  }
}

type DatedReport = { collectedAt: string | null; createdAt: Date };

const visitDate = (report: DatedReport) =>
  report.collectedAt ?? report.createdAt.toISOString().slice(0, 10);

/**
 * Finds the values of the profile's report before this one, in this report's units.
 *
 * @remarks
 * Same rule as the doctor export in the web: a report from the same collection date is the same visit, so it is skipped.
 */
async function previousValues(ownerUserId: string, reportId: string) {
  const { reports, b } = await compareReports(ownerUserId, { b: reportId });
  const previous = b
    ? reports.filter((report) => visitDate(report) < visitDate(b)).at(-1)
    : undefined;
  if (!previous) return null;
  const { groups } = await compareReports(ownerUserId, { a: previous.id, b: reportId });
  return {
    labName: previous.labName,
    collectedAt: previous.collectedAt,
    createdAt: previous.createdAt,
    values: Object.fromEntries(
      groups.flatMap(({ rows }) =>
        rows.flatMap((row) =>
          row.statusA !== null && row.valueA !== null ? [[row.markerKey, row.valueA]] : [],
        ),
      ),
    ) as Record<string, number | string>,
  };
}

/**
 * Loads the export behind an open link and records the open.
 *
 * @remarks
 * The person is only a first name and an age, and file names are replaced, because a name in either could identify the patient.
 */
export async function getSharedExport(token: string) {
  const share = await repo.findOpenShare(hashToken(token));
  if (!share) throw new AppError(404, "This link has ended");
  const report = await getReportDetail(share.ownerUserId, share.reportId);
  const [profile, previous] = await Promise.all([
    getOwnedProfile(share.ownerUserId, report.profileId),
    previousValues(share.ownerUserId, share.reportId),
  ]);
  await repo.insertShareOpen(share.id);
  const { header } = report;
  return {
    expiresAt: share.expiresAt,
    person: {
      firstName: profile.name.trim().split(/\s+/)[0] ?? "",
      age: profile.dateOfBirth
        ? ageOn(profile.dateOfBirth, new Date().toISOString().slice(0, 10))
        : null,
    },
    report: {
      header: {
        labName: header.labName,
        collectedAt: header.collectedAt,
        reportedAt: header.reportedAt,
      },
      note: report.note,
      moveFirst: report.moveFirst,
      patterns: report.patterns,
      findings: report.findings,
      doctorQuestions: report.doctorQuestions,
      categories: report.categories,
      derived: report.derived,
      unmapped: report.unmapped,
      studies: report.studies.map((study) => ({ ...study, fileName: null, filmName: null })),
      files: { images: report.files.images.map((_name, index) => `Image ${index + 1}`) },
    },
    previous,
  };
}
