import { createFileRoute } from "@tanstack/react-router";
import { TrendsContainer, validateTrendsSearch } from "@/modules/trends";

export const Route = createFileRoute("/_app/trends/")({
  validateSearch: validateTrendsSearch,
  component: TrendsContainer,
});
