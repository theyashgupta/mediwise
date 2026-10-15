import type { ReactNode } from "react";
import { useT } from "@/common/hooks/use-locale";
import { Button } from "@/components/ui/button";
import { trendDirections, trendStatuses } from "../config/trends";
import type { TrendSearch, TrendSort, Trends } from "../types";

type TrendControlsProps = {
  categories: Trends["categories"];
  search: TrendSearch;
  onSearchChange: (patch: TrendSearch) => void;
};

type ChipProps = {
  pressed: boolean;
  testId: string;
  onClick: () => void;
  children: ReactNode;
};

const sorts: TrendSort[] = ["change", "name"];

function Chip({ pressed, testId, onClick, children }: ChipProps) {
  return (
    <Button
      size="sm"
      variant={pressed ? "secondary" : "ghost"}
      aria-pressed={pressed}
      data-testid={testId}
      onClick={onClick}
    >
      {children}
    </Button>
  );
}

export function TrendControls({ categories, search, onSearchChange }: TrendControlsProps) {
  const t = useT();
  const category = search.category ?? null;
  const sort = search.sort ?? "change";
  const chips = [{ key: null, label: t.trends.controls.all }, ...categories];
  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div role="group" aria-label={t.trends.controls.filter} className="flex flex-wrap gap-2">
          {chips.map(({ key, label }) => (
            <Chip
              key={key ?? "all"}
              pressed={category === key}
              testId={`trend-category-${key ?? "all"}`}
              onClick={() => onSearchChange({ category: key ?? undefined })}
            >
              {label}
            </Chip>
          ))}
        </div>
        <div
          role="group"
          aria-label={t.trends.controls.sort}
          className="flex shrink-0 items-center gap-2"
        >
          <span className="text-sm text-muted-foreground">{t.trends.controls.sortBy}</span>
          {sorts.map((value) => (
            <Chip
              key={value}
              pressed={sort === value}
              testId={`trend-sort-${value}`}
              onClick={() => onSearchChange({ sort: value === "name" ? "name" : undefined })}
            >
              {t.trends.controls.sorts[value]}
            </Chip>
          ))}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <div
          role="group"
          aria-label={t.trends.controls.direction}
          className="flex flex-wrap items-center gap-2"
        >
          <span className="text-sm text-muted-foreground">{t.trends.controls.direction}</span>
          {trendDirections.map((value) => (
            <Chip
              key={value}
              pressed={search.direction === value}
              testId={`trend-direction-${value}`}
              onClick={() =>
                onSearchChange({ direction: search.direction === value ? undefined : value })
              }
            >
              {t.trends.direction[value]}
            </Chip>
          ))}
        </div>
        <div
          role="group"
          aria-label={t.trends.controls.status}
          className="flex flex-wrap items-center gap-2"
        >
          <span className="text-sm text-muted-foreground">{t.trends.controls.status}</span>
          {trendStatuses.map((value) => (
            <Chip
              key={value}
              pressed={search.status === value}
              testId={`trend-status-${value}`}
              onClick={() =>
                onSearchChange({ status: search.status === value ? undefined : value })
              }
            >
              {t.common.status[value]}
            </Chip>
          ))}
        </div>
      </div>
    </div>
  );
}
