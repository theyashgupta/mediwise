import { createFileRoute } from "@tanstack/react-router";
import { ReportContainer, validateReportSearch } from "@/modules/reports";

export const Route = createFileRoute("/_app/reports/$reportId")({
  validateSearch: validateReportSearch,
  component: ReportContainer,
});
