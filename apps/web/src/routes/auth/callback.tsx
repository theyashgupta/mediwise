import { createFileRoute } from "@tanstack/react-router";
import { finishOAuth } from "@/modules/auth";

export const Route = createFileRoute("/auth/callback")({ beforeLoad: finishOAuth });
