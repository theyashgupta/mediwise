import { createFileRoute } from "@tanstack/react-router";
import { DashboardContainer } from "@/modules/dashboard";

export const Route = createFileRoute("/_app/")({ component: DashboardContainer });
