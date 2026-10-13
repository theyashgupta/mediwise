import { createFileRoute } from "@tanstack/react-router";
import { TrendsContainer } from "@/modules/trends";

export const Route = createFileRoute("/_app/trends/")({ component: TrendsContainer });
