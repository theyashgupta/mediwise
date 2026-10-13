import { derived, markers, studyMarkers } from "@mediwise/engine";
import {
  guardianMessage,
  isMinor,
  maxProfilesPerUser,
  type ProfileInput,
  type ProfileUpdate,
} from "@mediwise/shared";
import { AppError } from "../../common/errors.js";
import { isVital } from "../studies/index.js";
import * as repo from "./profiles.repo.js";

/**
 * Creates the self profile on the user's first call, for email and Google accounts alike.
 *
 * @remarks
 * The Google profile name wins. Otherwise the part of the email before the at sign is a placeholder until the user sets one in Settings.
 */
export async function ensureSelfProfile(userId: string, email: string, name?: string) {
  await repo.insertSelfProfileIfMissing(userId, name || email.split("@")[0] || userId);
}

/**
 * Lists the user's profiles, self first.
 *
 * @remarks
 * Ensures the self profile too, so a first page load that calls this before `/me` still sees it.
 */
export async function listProfiles(userId: string, email: string, name?: string) {
  await ensureSelfProfile(userId, email, name);
  return repo.listProfilesByOwner(userId);
}

/**
 * Adds a family member.
 *
 * @remarks
 * The count and insert are not atomic, so two parallel requests at 7 profiles can reach 9; acceptable for a plan limit.
 */
export async function createProfile(userId: string, input: ProfileInput) {
  if (input.relation === "self") throw new AppError(409, "You already have a self profile");
  if ((await repo.countProfilesByOwner(userId)) >= maxProfilesPerUser) {
    throw new AppError(409, `You can have up to ${maxProfilesPerUser} profiles`);
  }
  const { permissionConfirmed, guardianConfirmed, ...fields } = input;
  const now = new Date();
  return repo.insertProfile(userId, {
    ...fields,
    permissionConfirmedAt: permissionConfirmed ? now : null,
    guardianConfirmedAt: guardianConfirmed && isMinor(fields.dateOfBirth) ? now : null,
  });
}

/**
 * Updates a profile the user owns.
 *
 * @remarks
 * A saved date of birth is one the user set, so it clears the approximate flag the report reader left.
 */
export async function updateProfile(userId: string, id: string, input: ProfileUpdate) {
  const profile = await getOwnedProfile(userId, id);
  if (input.relation && (input.relation === "self") !== profile.isSelf) {
    throw new AppError(409, "The self relation cannot change");
  }
  const { permissionConfirmed, guardianConfirmed, ...fields } = input;
  const changes: Partial<repo.ProfileValues> = { ...fields };
  if (fields.dateOfBirth) changes.dateOfBirthApproximate = false;
  if (!profile.isSelf) {
    const consent = { dateOfBirth: fields.dateOfBirth, permissionConfirmed, guardianConfirmed };
    Object.assign(changes, consentChanges(profile, consent));
  }
  if (Object.keys(changes).length === 0) return profile;
  const updated = await repo.updateProfile(userId, id, changes);
  if (!updated) throw new AppError(404, "We could not find this profile");
  return updated;
}

/**
 * Dates the permission and guardian ticks of a family member the first time each is given.
 *
 * @remarks
 * Only a new date of birth under 18 demands the guardian tick, so a permission-only update for an older child profile still saves.
 */
function consentChanges(
  profile: {
    dateOfBirth: string | null;
    permissionConfirmedAt: Date | null;
    guardianConfirmedAt: Date | null;
  },
  input: Pick<ProfileUpdate, "dateOfBirth" | "permissionConfirmed" | "guardianConfirmed">,
) {
  const dateOfBirth = input.dateOfBirth ?? profile.dateOfBirth;
  const minor = dateOfBirth !== null && isMinor(dateOfBirth);
  if (input.dateOfBirth && minor && !profile.guardianConfirmedAt && !input.guardianConfirmed) {
    throw new AppError(400, guardianMessage);
  }
  const now = new Date();
  return {
    ...(input.permissionConfirmed &&
      !profile.permissionConfirmedAt && { permissionConfirmedAt: now }),
    ...(minor &&
      input.guardianConfirmed &&
      !profile.guardianConfirmedAt && { guardianConfirmedAt: now }),
  };
}

export async function deleteProfile(userId: string, id: string) {
  const profile = await getOwnedProfile(userId, id);
  if (profile.isSelf) throw new AppError(409, "You cannot remove the self profile");
  await repo.deleteProfile(userId, id);
}

/**
 * Loads a profile the user owns.
 *
 * @remarks
 * Another user's profile answers 404, not 403, so ids cannot be probed.
 */
export async function getOwnedProfile(userId: string, id: string) {
  const profile = await repo.findProfileById(userId, id);
  if (!profile) throw new AppError(404, "We could not find this profile");
  return profile;
}

const csvHeader = [
  "Type",
  "Report date",
  "Lab",
  "Marker key",
  "Marker name",
  "Value",
  "Unit",
  "Status",
  "Printed range",
  "Calibrated range",
  "Visit ID",
  "Report ID",
];
const catalogNames = new Map(
  [...markers, ...derived, ...studyMarkers].map((entry) => [entry.key, entry.name]),
);

type Cell = string | number | null | undefined;
type ExportReport = {
  reportId: string;
  reportDate: string;
  collectedAt: string | null;
  labName: string | null;
};

/**
 * Writes one RFC 4180 field.
 *
 * @remarks
 * Report text comes from uploaded files, so a text cell that starts like a formula gets a leading quote mark. Excel and
 * Numbers then show it as text and never run it.
 */
function csvField(cell: Cell) {
  if (cell === null || cell === undefined) return "";
  let text = String(cell);
  if (typeof cell === "string" && /^[=+\-@\t\r]/.test(text) && Number.isNaN(Number(text))) {
    text = `'${text}`;
  }
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function rangeText(low: number | null, high: number | null) {
  if (low !== null && high !== null) return `${low} to ${high}`;
  if (low !== null) return `> ${low}`;
  if (high !== null) return `< ${high}`;
  return null;
}

/** Gives the report columns of one export row: date, lab and the visit id the web groups reports by. */
function reportCells(report: ExportReport) {
  return {
    reportDate: report.reportDate,
    lab: report.labName,
    visitId: report.collectedAt ? `visit-${report.collectedAt}` : report.reportId,
    reportId: report.reportId,
  };
}

/**
 * Writes a profile's stored values as a CSV file: UTF-8 with a BOM, CRLF line ends, one row per value.
 *
 * @remarks
 * The file is built in memory. A profile holds a few thousand values at most, so a stream would add code and save nothing.
 */
export async function exportProfileCsv(userId: string, id: string) {
  await getOwnedProfile(userId, id);
  const { markerRows, studyRows, measurementRows } = await repo.listExportRows(userId, id);
  const rows = [
    ...markerRows.map((row) => ({
      ...reportCells(row),
      type: row.markerKey && isVital(row.markerKey) ? "vital" : "marker",
      key: row.markerKey,
      name: (row.markerKey && catalogNames.get(row.markerKey)) || row.rawName,
      value: row.value ?? row.valueText,
      unit: row.unit,
      status: row.status,
      printedRange: rangeText(row.labRangeLow, row.labRangeHigh),
      calibratedRange: rangeText(row.calibratedLow, row.calibratedHigh),
    })),
    ...studyRows.map((row) => ({
      ...reportCells(row),
      type: "study",
      key: row.kind,
      name: row.bodyRegion,
      value: row.impressionText ?? row.resultText ?? row.findingsText,
      unit: null,
      status: null,
      printedRange: null,
      calibratedRange: null,
    })),
    ...measurementRows.map((row) => ({
      ...reportCells(row),
      type: "study measurement",
      key: row.key,
      name: catalogNames.get(row.key) ?? row.key,
      value: row.value ?? row.valueText,
      unit: row.unit,
      status: row.status,
      printedRange: row.printedRange,
      calibratedRange: null,
    })),
  ].sort(
    (a, b) => a.reportDate.localeCompare(b.reportDate) || a.reportId.localeCompare(b.reportId),
  );
  const lines = [
    csvHeader,
    ...rows.map((row) => [
      row.type,
      row.reportDate,
      row.lab,
      row.key,
      row.name,
      row.value,
      row.unit,
      row.status,
      row.printedRange,
      row.calibratedRange,
      row.visitId,
      row.reportId,
    ]),
  ];
  return `\uFEFF${lines.map((cells) => cells.map(csvField).join(",")).join("\r\n")}\r\n`;
}
