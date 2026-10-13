import { createFileRoute } from "@tanstack/react-router";
import { ForgotPasswordContainer, redirectIfSession } from "@/modules/auth";

export const Route = createFileRoute("/_auth/forgot-password")({
  beforeLoad: redirectIfSession,
  component: ForgotPasswordContainer,
});
