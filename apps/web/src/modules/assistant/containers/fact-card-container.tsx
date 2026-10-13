import { useMarker } from "@/modules/markers";
import { FactCard } from "../components/fact-card";
import type { FactTarget } from "../types";

type FactCardContainerProps = { target: FactTarget };

export function FactCardContainer({ target }: FactCardContainerProps) {
  const marker = useMarker(target.reportId, target.markerKey);
  return <FactCard detail={marker.data} pending={marker.isPending} />;
}
