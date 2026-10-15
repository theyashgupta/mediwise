import { getRouteApi, Link } from "@tanstack/react-router";
import { GitCompareArrows, ListFilter, TrendingUp, Upload } from "lucide-react";
import { useDeferredValue, useMemo } from "react";
import { EmptyState } from "@/common/components/empty-state";
import { ErrorState } from "@/common/components/error-state";
import { LoadingState } from "@/common/components/loading-state";
import { PageHeader } from "@/common/components/page-header";
import { useT } from "@/common/hooks/use-locale";
import { Button } from "@/components/ui/button";
import { useActiveProfile } from "@/modules/profiles";
import { TrendControls } from "../components/trend-controls";
import { TrendList } from "../components/trend-list";
import { WatchList } from "../components/watch-list";
import { matchesTrend, sortTrends } from "../config/trends";
import { useTrends } from "../hooks/use-trends";
import type { TrendSearch } from "../types";

const route = getRouteApi("/_app/trends/");

function Content() {
  const { profile } = useActiveProfile();
  const trends = useTrends(profile?.id);
  const search = route.useSearch();
  const listSearch = useDeferredValue(search);
  const navigate = route.useNavigate();
  const t = useT();
  const setSearch = (patch: TrendSearch) =>
    void navigate({ search: (prev) => ({ ...prev, ...patch }), replace: true });
  const markers = trends.data?.markers;
  const visible = useMemo(
    () =>
      sortTrends(
        (markers ?? []).filter((item) => matchesTrend(item, listSearch)),
        listSearch.sort ?? "change",
      ),
    [markers, listSearch],
  );

  if (!profile || trends.isPending) return <LoadingState variant="list" />;
  if (trends.isError) {
    return <ErrorState message={t.trends.list.loadError} onRetry={() => trends.refetch()} />;
  }
  if (trends.data.reportCount < 2) {
    return (
      <EmptyState
        icon={TrendingUp}
        title={t.trends.list.noTrendsTitle}
        body={t.trends.list.noTrendsBody}
        action={
          <Button asChild>
            <Link to="/reports/upload">
              <Upload aria-hidden />
              {t.trends.upload}
            </Link>
          </Button>
        }
      />
    );
  }
  if (trends.data.markers.length === 0) {
    return (
      <EmptyState
        icon={TrendingUp}
        title={t.trends.list.noSharedTitle}
        body={t.trends.list.noSharedBody}
      />
    );
  }

  return (
    <div className="space-y-8">
      <WatchList items={trends.data.attention} />
      <div className="space-y-6">
        <TrendControls
          categories={trends.data.categories}
          search={search}
          onSearchChange={setSearch}
        />
        {visible.length === 0 ? (
          <EmptyState
            icon={ListFilter}
            title={t.trends.list.noMatchTitle}
            body={t.trends.list.noMatchBody}
            action={
              <Button
                variant="outline"
                data-testid="trend-clear-filters"
                onClick={() =>
                  setSearch({ category: undefined, direction: undefined, status: undefined })
                }
              >
                {t.trends.list.clearFilters}
              </Button>
            }
          />
        ) : (
          <TrendList items={visible} />
        )}
      </div>
    </div>
  );
}

export function TrendsContainer() {
  const t = useT();
  return (
    <>
      <PageHeader
        title={t.trends.list.title}
        description={t.trends.list.description}
        actions={
          <Button asChild variant="outline">
            <Link to="/compare">
              <GitCompareArrows aria-hidden />
              {t.trends.list.compare}
            </Link>
          </Button>
        }
      />
      <Content />
    </>
  );
}
