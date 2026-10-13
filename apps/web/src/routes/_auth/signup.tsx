import { createFileRoute } from "@tanstack/react-router";
import { redirectIfSession, SignupContainer } from "@/modules/auth";

export const Route = createFileRoute("/_auth/signup")({
  beforeLoad: redirectIfSession,
  component: SignupContainer,
});
