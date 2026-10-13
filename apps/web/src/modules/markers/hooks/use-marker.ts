import { useQuery } from "@tanstack/react-query";
import { getMarker } from "../api/get-marker";

export function useMarker(reportId: string, markerKey: string) {
  return useQuery({
    queryKey: ["markers", reportId, markerKey],
    queryFn: () => getMarker(reportId, markerKey),
  });
}
