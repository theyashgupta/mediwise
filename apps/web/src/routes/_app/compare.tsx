import { createFileRoute } from "@tanstack/react-router";
import { CompareContainer, validateCompareSearch } from "@/modules/trends";

export const Route = createFileRoute("/_app/compare")({
  validateSearch: validateCompareSearch,
  component: CompareContainer,
});
