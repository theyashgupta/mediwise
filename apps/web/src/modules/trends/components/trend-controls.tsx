import { Button } from "@/components/ui/button";
import type { TrendSort, Trends } from "../types";

type TrendControlsProps = {
  categories: Trends["categories"];
  category: string | null;
  sort: TrendSort;
  onCategoryChange: (category: string | null) => void;
  onSortChange: (sort: TrendSort) => void;
};

const sorts: { value: TrendSort; label: string }[] = [
  { value: "change", label: "Biggest change" },
  { value: "name", label: "Name" },
];

export function TrendControls({
  categories,
  category,
  sort,
  onCategoryChange,
  onSortChange,
}: TrendControlsProps) {
  const chips = [{ key: null, label: "All" }, ...categories];
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div role="group" aria-label="Filter by category" className="flex flex-wrap gap-2">
        {chips.map(({ key, label }) => (
          <Button
            key={key ?? "all"}
            size="sm"
            variant={category === key ? "secondary" : "ghost"}
            aria-pressed={category === key}
            onClick={() => onCategoryChange(key)}
          >
            {label}
          </Button>
        ))}
      </div>
      <div role="group" aria-label="Sort" className="flex shrink-0 items-center gap-2">
        <span className="text-sm text-muted-foreground">Sort by</span>
        {sorts.map(({ value, label }) => (
          <Button
            key={value}
            size="sm"
            variant={sort === value ? "secondary" : "ghost"}
            aria-pressed={sort === value}
            onClick={() => onSortChange(value)}
          >
            {label}
          </Button>
        ))}
      </div>
    </div>
  );
}
