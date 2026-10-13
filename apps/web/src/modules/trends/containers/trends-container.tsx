import { Link } from "@tanstack/react-router";
import { GitCompareArrows, TrendingUp, Upload } from "lucide-react";
import { useState } from "react";
import { EmptyState } from "@/common/components/empty-state";
import { ErrorState } from "@/common/components/error-state";
import { LoadingState } from "@/common/components/loading-state";
import { PageHeader } from "@/common/components/page-header";
import { useT } from "@/common/hooks/use-locale";
import { Button } from "@/components/ui/button";
import { useActiveProfile } from "@/modules/profiles";
import { TrendControls } from "../components/trend-controls";
import { TrendList } from "../components/trend-list";
import { sortTrends } from "../config/trends";
import { useTrends } from "../hooks/use-trends";
import type { TrendSort } from "../types";

function Content() {
  const { profile } = useActiveProfile();
  const trends = useTrends(profile?.id);
  const [category, setCategory] = useState<string | null>(null);
  const [sort, setSort] = useState<TrendSort>("change");
  const t = useT();

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

  const visible = trends.data.markers.filter(
    (item) => category === null || item.category === category,
  );
  return (
    <div className="space-y-6">
      <TrendControls
        categories={trends.data.categories}
        category={category}
        sort={sort}
        onCategoryChange={setCategory}
        onSortChange={setSort}
      />
      <TrendList items={sortTrends(visible, sort)} />
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
