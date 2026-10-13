import { createFileRoute } from "@tanstack/react-router";
import { ReportsContainer } from "@/modules/reports";

export const Route = createFileRoute("/_app/reports/")({ component: ReportsContainer });
