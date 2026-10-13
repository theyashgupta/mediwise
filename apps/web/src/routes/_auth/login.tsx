import { createFileRoute } from "@tanstack/react-router";
import { LoginContainer, loginSearchSchema, redirectIfSession } from "@/modules/auth";

export const Route = createFileRoute("/_auth/login")({
  validateSearch: loginSearchSchema,
  beforeLoad: redirectIfSession,
  component: LoginContainer,
});
