import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/layouts/app-shell";
import { requireSession } from "@/modules/auth";

export const Route = createFileRoute("/_app")({ beforeLoad: requireSession, component: AppShell });
