import { getRouteApi, Link } from "@tanstack/react-router";
import { CalendarRange, Printer, Upload } from "lucide-react";
import { EmptyState } from "@/common/components/empty-state";
import { ErrorState } from "@/common/components/error-state";
import { LoadingState } from "@/common/components/loading-state";
import { PageHeader } from "@/common/components/page-header";
import { Button } from "@/components/ui/button";
import { useActiveProfile } from "@/modules/profiles";
import { YearReviewView } from "../components/year-review-view";
import { formatReviewDate } from "../config/year-review";
import { useYearReview } from "../hooks/use-year-review";

const route = getRouteApi("/_app/year-review");

export function YearReviewContainer() {
  const search = route.useSearch();
  const { profile: active, profiles } = useActiveProfile();
  const profile = profiles.find((p) => p.id === search.profileId) ?? active;
  const review = useYearReview(profile?.id);
  const data = review.data;

  return (
    <>
      <PageHeader
        title="Year in review"
        description={
          data && profile
            ? `${profile.name} · ${formatReviewDate(data.from)} to ${formatReviewDate(data.to)}`
            : profile?.name
        }
        actions={
          data && (
            <Button variant="outline" className="print:hidden" onClick={() => window.print()}>
              <Printer aria-hidden />
              Print
            </Button>
          )
        }
      />
      {(!profile || review.isPending) && <LoadingState variant="list" />}
      {review.isError && (
        <ErrorState
          message="We could not load the year in review."
          onRetry={() => review.refetch()}
        />
      )}
      {data === null && (
        <EmptyState
          icon={CalendarRange}
          title="No year in review yet"
          body="A year in review needs two reports from one year. Upload a second report to see what changed."
          action={
            <Button asChild>
              <Link to="/reports/upload">
                <Upload aria-hidden />
                Upload a report
              </Link>
            </Button>
          }
        />
      )}
      {data && <YearReviewView review={data} />}
    </>
  );
}
