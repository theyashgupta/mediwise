import { type ConsentKind, policyVersion, requiredConsentKinds } from "@mediwise/shared";
import { createHash } from "node:crypto";
import { AppError } from "../../common/errors.js";
import * as repo from "./consents.repo.js";

type ConsentRow = Awaited<ReturnType<typeof repo.listConsentsByUser>>[number];

/**
 * Tells whether the rows hold a consent of this kind that still counts.
 *
 * @remarks
 * Health data consent counts only for the current policy version, so a policy change asks for it again. Terms and assistant review consent count once given.
 */
function isGiven(rows: ConsentRow[], kind: ConsentKind) {
  return rows.some(
    (row) =>
      row.kind === kind &&
      !row.withdrawnAt &&
      (kind !== "health_data" || row.policyVersion === policyVersion),
  );
}

export async function getConsents(userId: string) {
  const consents = await repo.listConsentsByUser(userId);
  return {
    policyVersion,
    consents,
    missing: requiredConsentKinds.filter((kind) => !isGiven(consents, kind)),
  };
}

/** Stores one row per kind that does not count yet, with the current policy version and the SHA-256 of the user agent. */
export async function giveConsents(userId: string, kinds: ConsentKind[], userAgent?: string) {
  const rows = await repo.listConsentsByUser(userId);
  const fresh = [...new Set(kinds)].filter((kind) => !isGiven(rows, kind));
  if (fresh.length > 0) {
    const userAgentHash = userAgent ? createHash("sha256").update(userAgent).digest("hex") : null;
    await repo.insertConsents(userId, fresh, policyVersion, userAgentHash);
  }
  return getConsents(userId);
}

export async function hasConsent(userId: string, kind: ConsentKind) {
  return isGiven(await repo.listConsentsByUser(userId), kind);
}

/** Refuses work that sends report content to Claude when the user has no health data consent for the current policy. */
export async function assertHealthDataConsent(userId: string) {
  if (!(await hasConsent(userId, "health_data"))) {
    throw new AppError(403, "Accept the health data consent before MediWise reads a report.", {
      missingConsent: "health_data",
    });
  }
}
