import type { ConsentKind } from "@mediwise/shared";
import { asc, eq } from "drizzle-orm";
import { db } from "../../db/client.js";
import { consentRecords } from "../../db/schema.js";

export function listConsentsByUser(userId: string) {
  return db
    .select({
      kind: consentRecords.kind,
      policyVersion: consentRecords.policyVersion,
      acceptedAt: consentRecords.acceptedAt,
      withdrawnAt: consentRecords.withdrawnAt,
      userAgentHash: consentRecords.userAgentHash,
    })
    .from(consentRecords)
    .where(eq(consentRecords.userId, userId))
    .orderBy(asc(consentRecords.acceptedAt));
}

export async function insertConsents(
  userId: string,
  kinds: ConsentKind[],
  policyVersion: string,
  userAgentHash: string | null,
) {
  await db
    .insert(consentRecords)
    .values(kinds.map((kind) => ({ userId, kind, policyVersion, userAgentHash })))
    .onConflictDoNothing();
}
