import { createFileRoute } from "@tanstack/react-router";
import { TrendContainer } from "@/modules/trends";

export const Route = createFileRoute("/_app/trends/$markerKey")({ component: TrendContainer });
