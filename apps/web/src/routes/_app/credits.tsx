import { createFileRoute } from "@tanstack/react-router";
import { CreditsContainer, validateCreditsSearch } from "@/modules/credits";

export const Route = createFileRoute("/_app/credits")({
  validateSearch: validateCreditsSearch,
  component: CreditsContainer,
});
