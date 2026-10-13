import { maxProfilesPerUser, type ProfileInput, type ProfileUpdate } from "@mediwise/shared";
import { AppError } from "../../common/errors.js";
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
  return repo.insertProfile(userId, input);
}

export async function updateProfile(userId: string, id: string, input: ProfileUpdate) {
  const profile = await getOwnedProfile(userId, id);
  if (input.relation && (input.relation === "self") !== profile.isSelf) {
    throw new AppError(409, "The self relation cannot change");
  }
  if (Object.keys(input).length === 0) return profile;
  const updated = await repo.updateProfile(userId, id, input);
  if (!updated) throw new AppError(404, "We could not find this profile");
  return updated;
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
