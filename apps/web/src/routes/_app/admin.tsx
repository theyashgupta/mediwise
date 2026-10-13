import { createFileRoute } from "@tanstack/react-router";
import { AdminContainer, requireAdmin } from "@/modules/admin";

export const Route = createFileRoute("/_app/admin")({
  loader: requireAdmin,
  component: AdminContainer,
});
