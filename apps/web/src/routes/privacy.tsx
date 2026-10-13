import { createFileRoute } from "@tanstack/react-router";
import { PolicyContainer } from "@/modules/payments";

export const Route = createFileRoute("/privacy")({
  component: () => <PolicyContainer page="privacy" />,
});
