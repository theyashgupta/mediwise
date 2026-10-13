import { createFileRoute } from "@tanstack/react-router";
import { validateYearReviewSearch, YearReviewContainer } from "@/modules/year-review";

export const Route = createFileRoute("/_app/year-review")({
  validateSearch: validateYearReviewSearch,
  component: YearReviewContainer,
});
