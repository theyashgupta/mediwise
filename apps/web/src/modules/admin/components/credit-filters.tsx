import { X } from "lucide-react";
import { Button } from "@/common/components/controls/button";
import { Field } from "@/common/components/controls/field";
import { Input } from "@/common/components/controls/input";
import type { CreditFilter } from "../types";

type CreditFiltersProps = {
  filter: CreditFilter;
  onChange: (filter: CreditFilter) => void;
};

export function CreditFilters({ filter, onChange }: CreditFiltersProps) {
  const set = (key: "from" | "to", value: string) =>
    onChange({ ...filter, [key]: value || undefined });
  return (
    <div className="flex flex-wrap items-end gap-3" data-testid="admin-filters">
      <Field label="From">
        <Input
          id="admin-from"
          type="date"
          className="w-40"
          max={filter.to}
          value={filter.from ?? ""}
          onChange={(event) => set("from", event.target.value)}
        />
      </Field>
      <Field label="To">
        <Input
          id="admin-to"
          type="date"
          className="w-40"
          min={filter.from}
          value={filter.to ?? ""}
          onChange={(event) => set("to", event.target.value)}
        />
      </Field>
      {filter.userId && (
        <Button
          variant="outline"
          onClick={() => onChange({ ...filter, userId: undefined })}
          data-testid="admin-user-filter"
        >
          User <span className="font-mono">{filter.userId.slice(0, 8)}</span>
          <X aria-label="Show all users" />
        </Button>
      )}
    </div>
  );
}
