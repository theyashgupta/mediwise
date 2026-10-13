import { createFileRoute, notFound } from "@tanstack/react-router";
import { KitchenSink } from "@/modules/kitchen-sink";

export const Route = createFileRoute("/_app/dev/kitchen-sink")({
  beforeLoad: () => {
    if (!import.meta.env.DEV) throw notFound();
  },
  component: KitchenSink,
});
