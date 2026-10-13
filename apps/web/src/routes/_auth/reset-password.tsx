import { createFileRoute } from "@tanstack/react-router";
import { ResetPasswordContainer } from "@/modules/auth";

export const Route = createFileRoute("/_auth/reset-password")({
  component: ResetPasswordContainer,
});
