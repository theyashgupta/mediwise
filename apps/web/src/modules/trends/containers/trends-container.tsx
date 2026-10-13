import { Link } from "@tanstack/react-router";
import { GitCompareArrows, TrendingUp, Upload } from "lucide-react";
import { useState } from "react";
import { EmptyState } from "@/common/components/empty-state";
import { ErrorState } from "@/common/components/error-state";
import { LoadingState } from "@/common/components/loading-state";
import { PageHeader } from "@/common/components/page-header";
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

  if (!profile || trends.isPending) return <LoadingState variant="list" />;
  if (trends.isError) {
    return <ErrorState message="We could not load your trends." onRetry={() => trends.refetch()} />;
  }
  if (trends.data.reportCount < 2) {
    return (
      <EmptyState
        icon={TrendingUp}
        title="No trends yet"
        body="Upload a second report to see trends."
        action={
          <Button asChild>
            <Link to="/reports/upload">
              <Upload aria-hidden />
              Upload a report
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
        title="No shared markers yet"
        body="A trend needs one marker in two reports. Your reports do not share a marker."
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
  return (
    <>
      <PageHeader
        title="Trends"
        description="How each marker changes from one report to the next."
        actions={
          <Button asChild variant="outline">
            <Link to="/compare">
              <GitCompareArrows aria-hidden />
              Compare reports
            </Link>
          </Button>
        }
      />
      <Content />
    </>
  );
}
