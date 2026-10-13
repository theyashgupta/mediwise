import { useQuery } from "@tanstack/react-query";
import { getFamily } from "../api/get-family";

export function useFamily() {
  return useQuery({ queryKey: ["dashboard", "family"], queryFn: getFamily });
}
