import { useT } from "@/common/hooks/use-locale";
import { Button } from "@/components/ui/button";
import type { TrendSort, Trends } from "../types";

type TrendControlsProps = {
  categories: Trends["categories"];
  category: string | null;
  sort: TrendSort;
  onCategoryChange: (category: string | null) => void;
  onSortChange: (sort: TrendSort) => void;
};

const sorts: TrendSort[] = ["change", "name"];

export function TrendControls({
  categories,
  category,
  sort,
  onCategoryChange,
  onSortChange,
}: TrendControlsProps) {
  const t = useT();
  const chips = [{ key: null, label: t.trends.controls.all }, ...categories];
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div role="group" aria-label={t.trends.controls.filter} className="flex flex-wrap gap-2">
        {chips.map(({ key, label }) => (
          <Button
            key={key ?? "all"}
            size="sm"
            variant={category === key ? "secondary" : "ghost"}
            aria-pressed={category === key}
            data-testid={`trend-category-${key ?? "all"}`}
            onClick={() => onCategoryChange(key)}
          >
            {label}
          </Button>
        ))}
      </div>
      <div
        role="group"
        aria-label={t.trends.controls.sort}
        className="flex shrink-0 items-center gap-2"
      >
        <span className="text-sm text-muted-foreground">{t.trends.controls.sortBy}</span>
        {sorts.map((value) => (
          <Button
            key={value}
            size="sm"
            variant={sort === value ? "secondary" : "ghost"}
            aria-pressed={sort === value}
            data-testid={`trend-sort-${value}`}
            onClick={() => onSortChange(value)}
          >
            {t.trends.controls.sorts[value]}
          </Button>
        ))}
      </div>
    </div>
  );
}
