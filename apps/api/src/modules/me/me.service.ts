import type { UpdateMeInput } from "@mediwise/shared";
import { createHash } from "node:crypto";
import { AppError } from "../../common/errors.js";
import { createSignedDownloadUrls, remove } from "../../lib/storage.js";
import { supabase } from "../../lib/supabase.js";
import { env } from "../../config/env.js";
import { isReviewRequired } from "../assistant/index.js";
import { hasConsent } from "../consents/index.js";
import { getCreditBalance, getQuestionsLeft, getQuestionState } from "../credits/index.js";
import { ensureSelfProfile } from "../profiles/index.js";
import * as repo from "./me.repo.js";

const removeBatchSize = 1000;

export async function getMe(userId: string, email: string, googleName?: string) {
  await ensureSelfProfile(userId, email, googleName);
  const enabled = env.ASSISTANT_ENABLED;
  const reviewRequired = isReviewRequired();
  const [name, credits, { questionsLeft, nextStep }, consented] = await Promise.all([
    repo.findSelfName(userId),
    getCreditBalance(userId),
    enabled
      ? getQuestionState(userId)
      : getQuestionsLeft(userId).then((left) => ({ questionsLeft: left, nextStep: null })),
    reviewRequired ? hasConsent(userId, "assistant_review") : false,
  ]);
  return {
    userId,
    email,
    name: name ?? userId,
    credits,
    questionsLeft,
    assistant: { enabled, outOfQuestions: nextStep, reviewRequired, consented },
  };
}

export async function updateMe(userId: string, email: string, input: UpdateMeInput) {
  await ensureSelfProfile(userId, email);
  return { userId, email, name: (await repo.updateSelfName(userId, input.name)) ?? input.name };
}

/**
 * Deletes every profile, report, stored file and job of the user, and logs the deletion.
 *
 * @remarks
 * Files go first, in the batches of 1000 that Supabase Storage allows, so a failed call leaves the rows to retry from.
 * The Supabase auth user goes last, so the user can still sign in and retry when an earlier step fails.
 */
export async function deleteMe(userId: string) {
  const paths = await repo.listStoragePathsByOwner(userId);
  for (let i = 0; i < paths.length; i += removeBatchSize) {
    await remove(paths.slice(i, i + removeBatchSize));
  }
  await repo.deleteAllByOwner(userId, { userIdHash: hashUserId(userId), files: paths.length });
  const { error } = await supabase.auth.admin.deleteUser(userId);
  if (error) throw new AppError(502, "We deleted your data but not your sign-in. Try again.");
}

/** SHA-256 of the user id, the only trace of the user that the deletion log keeps. */
const hashUserId = (userId: string) => createHash("sha256").update(userId).digest("hex");

/**
 * Returns a 5-minute download URL for every original file the user still has.
 *
 * @remarks
 * A file with no stored name, from before file names were kept, is saved under its storage name.
 */
async function signFiles(userId: string) {
  const rows = await repo.listFilesByOwner(userId);
  const signed = await createSignedDownloadUrls(
    rows.map((row) => ({ ...row, name: row.name ?? row.path.split("/").at(-1)! })),
  );
  return signed.map(({ reportId, name, url }) => ({ reportId, name, url }));
}

export async function exportMe(userId: string, withFiles = false) {
  const [data, files] = await Promise.all([
    repo.exportByOwner(userId),
    withFiles ? signFiles(userId) : undefined,
  ]);
  return { exportedAt: new Date().toISOString(), ...data, ...(files && { files }) };
}
