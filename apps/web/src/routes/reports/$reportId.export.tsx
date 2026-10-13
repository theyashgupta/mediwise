import { createFileRoute } from "@tanstack/react-router";
import { requireSession } from "@/modules/auth";
import { ReportExportContainer } from "@/modules/reports";

export const Route = createFileRoute("/reports/$reportId/export")({
  beforeLoad: requireSession,
  component: ReportExportContainer,
});
