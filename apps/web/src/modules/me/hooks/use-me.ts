import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { downloadFile } from "@/common/utils/download";
import { deleteMe } from "../api/delete-me";
import { exportMe } from "../api/export-me";
import { getMe } from "../api/get-me";
import { updateMe } from "../api/update-me";

export function useMe() {
  return useQuery({ queryKey: ["me"], queryFn: getMe });
}

/**
 * Account mutations: rename, download the data export, delete everything.
 *
 * @remarks
 * The download saves the JSON without the file links, which stop working after 5 minutes.
 * A rename refreshes `profiles` too because the name is the self profile's name. A delete refetches nothing, because a refetch would create a new self profile for the deleted user.
 */
export function useMeMutations() {
  const queryClient = useQueryClient();
  return {
    update: useMutation({
      mutationFn: updateMe,
      onSuccess: () =>
        Promise.all([
          queryClient.invalidateQueries({ queryKey: ["me"] }),
          queryClient.invalidateQueries({ queryKey: ["profiles"] }),
        ]),
    }),
    download: useMutation({
      mutationFn: exportMe,
      onSuccess: (data) =>
        downloadFile(
          new Blob([JSON.stringify({ ...data, files: undefined }, null, 2)], {
            type: "application/json",
          }),
          `mediwise-export-${new Date().toISOString().slice(0, 10)}.json`,
        ),
    }),
    remove: useMutation({ mutationFn: deleteMe }),
  };
}
