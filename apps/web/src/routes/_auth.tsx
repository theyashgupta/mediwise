import { createFileRoute } from "@tanstack/react-router";
import { AuthLayout } from "@/layouts/auth-layout";

export const Route = createFileRoute("/_auth")({ component: AuthLayout });
