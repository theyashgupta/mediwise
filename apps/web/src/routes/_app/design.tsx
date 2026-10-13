import { createFileRoute, notFound } from "@tanstack/react-router";
import { DesignSystem } from "@/modules/design-system";

export const Route = createFileRoute("/_app/design")({
  beforeLoad: () => {
    if (!import.meta.env.DEV) throw notFound();
  },
  component: DesignSystem,
});
