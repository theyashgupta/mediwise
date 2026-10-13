import type { ProfileInput, ProfileUpdate } from "@mediwise/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { downloadFile } from "@/common/utils/download";
import { createProfile } from "../api/create-profile";
import { deleteProfile } from "../api/delete-profile";
import { exportProfileCsv } from "../api/export-profile-csv";
import { getProfiles } from "../api/get-profiles";
import { updateProfile } from "../api/update-profile";
import type { Profile } from "../types";

export function useProfiles() {
  return useQuery({ queryKey: ["profiles"], queryFn: getProfiles });
}

/**
 * Create, update and delete mutations that refresh the profile list on success.
 *
 * @remarks
 * Also refreshes `me`, whose name is the self profile's name shown in the shell.
 */
export function useProfileMutations() {
  const queryClient = useQueryClient();
  const onSuccess = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ["profiles"] }),
      queryClient.invalidateQueries({ queryKey: ["me"] }),
    ]);
  return {
    create: useMutation({ mutationFn: (input: ProfileInput) => createProfile(input), onSuccess }),
    update: useMutation({
      mutationFn: ({ id, input }: { id: string; input: ProfileUpdate }) => updateProfile(id, input),
      onSuccess,
    }),
    remove: useMutation({ mutationFn: (id: string) => deleteProfile(id), onSuccess }),
  };
}

/** Downloads a profile's values as a CSV file named after the profile and today's date. */
export function useProfileCsv() {
  return useMutation({
    mutationFn: (profile: Pick<Profile, "id" | "name">) => exportProfileCsv(profile.id),
    onSuccess: (blob, profile) =>
      downloadFile(
        blob,
        `mediwise-${profile.name}-values-${new Date().toISOString().slice(0, 10)}.csv`,
      ),
  });
}

/**
 * Records the permission and guardian ticks of several family profiles in one go.
 *
 * @remarks
 * The Home prompt confirms every pending profile at once, so one pending state covers all the updates.
 */
export function useConfirmConsent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (updates: { id: string; input: ProfileUpdate }[]) =>
      Promise.all(updates.map(({ id, input }) => updateProfile(id, input))),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["profiles"] }),
  });
}
