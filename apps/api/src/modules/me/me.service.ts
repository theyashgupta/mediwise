import type { UpdateMeInput } from "@mediwise/shared";
import { createHash } from "node:crypto";
import { AppError } from "../../common/errors.js";
import { remove } from "../../lib/storage.js";
import { supabase } from "../../lib/supabase.js";
import { getCreditBalance, getQuestionsLeft } from "../credits/index.js";
import { ensureSelfProfile } from "../profiles/index.js";
import * as repo from "./me.repo.js";

const removeBatchSize = 1000;

export async function getMe(userId: string, email: string, googleName?: string) {
  await ensureSelfProfile(userId, email, googleName);
  const [name, credits, questionsLeft] = await Promise.all([
    repo.findSelfName(userId),
    getCreditBalance(userId),
    getQuestionsLeft(userId),
  ]);
  return { userId, email, name: name ?? userId, credits, questionsLeft };
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

export async function exportMe(userId: string) {
  return { exportedAt: new Date().toISOString(), ...(await repo.exportByOwner(userId)) };
}
