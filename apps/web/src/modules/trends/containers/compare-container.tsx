import { getRouteApi, Link, useNavigate } from "@tanstack/react-router";
import { GitCompareArrows, Upload } from "lucide-react";
import { useState } from "react";
import { EmptyState } from "@/common/components/empty-state";
import { ErrorState } from "@/common/components/error-state";
import { LoadingState } from "@/common/components/loading-state";
import { PageHeader } from "@/common/components/page-header";
import { Button } from "@/components/ui/button";
import { useActiveProfile } from "@/modules/profiles";
import { formatReportDate } from "@/modules/reports";
import { CompareGroups } from "../components/compare-groups";
import { ComparePicker } from "../components/compare-picker";
import { summaryLine } from "../config/trends";
import { useComparison } from "../hooks/use-comparison";

const route = getRouteApi("/_app/compare");

function Content() {
  const { a, b } = route.useSearch();
  const navigate = useNavigate();
  const { profile } = useActiveProfile();
  const comparison = useComparison({ a, b, profileId: b ? undefined : profile?.id });
  const [changedOnly, setChangedOnly] = useState(false);

  if (comparison.isPending) return <LoadingState variant="list" />;
  if (comparison.isError) {
    return (
      <ErrorState
        message="We could not compare these reports."
        onRetry={() => comparison.refetch()}
      />
    );
  }
  if (!comparison.data) {
    return (
      <EmptyState
        icon={GitCompareArrows}
        title="We could not find these reports"
        body="Select two reports of one profile."
        action={
          <Button asChild variant="outline">
            <Link to="/compare">Compare the latest two reports</Link>
          </Button>
        }
      />
    );
  }

  const data = comparison.data;
  if (data.reports.length < 2) {
    return (
      <EmptyState
        icon={GitCompareArrows}
        title="Nothing to compare yet"
        body="Upload a second report to compare two reports."
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

  const groups = changedOnly
    ? data.groups
        .map((group) => ({
          ...group,
          rows: group.rows.filter((row) => row.verdictChange !== "same"),
        }))
        .filter((group) => group.rows.length > 0)
    : data.groups;
  return (
    <div className="space-y-6">
      <ComparePicker
        reports={data.reports}
        a={data.a?.id}
        b={data.b?.id}
        onChange={(next) => void navigate({ to: "/compare", search: next, replace: true })}
      />
      {!data.a || !data.b ? (
        <p className="text-muted-foreground">
          This report is the first report for this profile. Select an earlier report as report A.
        </p>
      ) : (
        <>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="font-medium">{summaryLine(data.summary)}</p>
            <Button
              size="sm"
              variant={changedOnly ? "secondary" : "ghost"}
              aria-pressed={changedOnly}
              className="self-start"
              onClick={() => setChangedOnly(!changedOnly)}
            >
              Changed only
            </Button>
          </div>
          {groups.length === 0 ? (
            <p className="text-muted-foreground">No marker changed status between these reports.</p>
          ) : (
            <CompareGroups
              groups={groups}
              labelA={formatReportDate(data.a.collectedAt, data.a.createdAt)}
              labelB={formatReportDate(data.b.collectedAt, data.b.createdAt)}
            />
          )}
        </>
      )}
    </div>
  );
}

export function CompareContainer() {
  return (
    <>
      <PageHeader title="Compare reports" description="See what changed between two reports." />
      <Content />
    </>
  );
}
