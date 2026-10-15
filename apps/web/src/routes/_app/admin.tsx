import { createFileRoute } from "@tanstack/react-router";
import { AdminContainer, NotFoundState, requireAdmin } from "@/modules/admin";

export const Route = createFileRoute("/_app/admin")({
  codeSplitGroupings: [["loader", "component", "notFoundComponent"]],
  loader: requireAdmin,
  component: AdminContainer,
  notFoundComponent: NotFoundState,
});
