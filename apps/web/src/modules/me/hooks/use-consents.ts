import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getConsents } from "../api/get-consents";
import { giveConsents } from "../api/give-consents";

const consentsKey = ["me", "consents"];

export function useConsents() {
  return useQuery({ queryKey: consentsKey, queryFn: getConsents });
}

/** Reloads the consents, so a 403 from an upload brings the consent gate back. */
export function useRefreshConsents() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: consentsKey });
}

export function useGiveConsents() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: giveConsents,
    onSuccess: (data) => queryClient.setQueryData(consentsKey, data),
  });
}
