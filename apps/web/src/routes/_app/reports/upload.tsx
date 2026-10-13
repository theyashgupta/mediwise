import { createFileRoute } from "@tanstack/react-router";
import { UploadReportContainer, validateUploadSearch } from "@/modules/reports";

export const Route = createFileRoute("/_app/reports/upload")({
  validateSearch: validateUploadSearch,
  component: UploadReportContainer,
});
