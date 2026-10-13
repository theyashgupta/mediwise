import { getRouteApi, Link } from "@tanstack/react-router";
import { CalendarRange, Printer, Upload } from "lucide-react";
import { EmptyState } from "@/common/components/empty-state";
import { ErrorState } from "@/common/components/error-state";
import { LoadingState } from "@/common/components/loading-state";
import { PageHeader } from "@/common/components/page-header";
import { useT } from "@/common/hooks/use-locale";
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
  const t = useT();

  return (
    <>
      <PageHeader
        title={t.yearReview.title}
        description={
          data && profile
            ? `${profile.name} · ${t.yearReview.period(formatReviewDate(data.from), formatReviewDate(data.to))}`
            : profile?.name
        }
        actions={
          data && (
            <Button variant="outline" className="print:hidden" onClick={() => window.print()}>
              <Printer aria-hidden />
              {t.yearReview.page.print}
            </Button>
          )
        }
      />
      {(!profile || review.isPending) && <LoadingState variant="list" />}
      {review.isError && (
        <ErrorState message={t.yearReview.page.loadError} onRetry={() => review.refetch()} />
      )}
      {data === null && (
        <EmptyState
          icon={CalendarRange}
          title={t.yearReview.page.emptyTitle}
          body={t.yearReview.page.emptyBody}
          action={
            <Button asChild>
              <Link to="/reports/upload">
                <Upload aria-hidden />
                {t.yearReview.page.upload}
              </Link>
            </Button>
          }
        />
      )}
      {data && <YearReviewView review={data} />}
    </>
  );
}
