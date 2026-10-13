import { createFileRoute } from "@tanstack/react-router";
import { UploadReportContainer } from "@/modules/reports";

export const Route = createFileRoute("/_app/reports/upload")({ component: UploadReportContainer });
