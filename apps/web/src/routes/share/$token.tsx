import { createFileRoute } from "@tanstack/react-router";
import { SharedReportContainer } from "@/modules/reports";

export const Route = createFileRoute("/share/$token")({ component: SharedReportContainer });
