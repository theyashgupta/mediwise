import { YearReviewCard } from "../components/year-review-card";
import { useYearReview } from "../hooks/use-year-review";

type YearReviewCardContainerProps = {
  profileId: string | undefined;
};

export function YearReviewCardContainer({ profileId }: YearReviewCardContainerProps) {
  const review = useYearReview(profileId);
  if (!profileId || !review.data) return null;
  return <YearReviewCard review={review.data} profileId={profileId} />;
}
