import { createFileRoute } from "@tanstack/react-router";
import { PolicyContainer } from "@/modules/payments";

export const Route = createFileRoute("/refunds")({
  component: () => <PolicyContainer page="refunds" />,
});
