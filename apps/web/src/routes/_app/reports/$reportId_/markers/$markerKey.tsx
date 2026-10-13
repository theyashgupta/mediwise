import { createFileRoute } from "@tanstack/react-router";
import { MarkerContainer } from "@/modules/markers";

export const Route = createFileRoute("/_app/reports/$reportId_/markers/$markerKey")({
  component: MarkerContainer,
});
