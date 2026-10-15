import type { ReactNode } from "react";
import { FormControl, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

type CheckboxFieldProps = {
  checked?: boolean;
  onChange: (checked: boolean) => void;
  label: ReactNode;
  testId: string;
};

export function CheckboxField({ checked, onChange, label, testId }: CheckboxFieldProps) {
  return (
    <FormItem className="flex items-start gap-3">
      <FormControl>
        <input
          type="checkbox"
          className="mt-0.5 size-4 shrink-0 accent-primary"
          data-testid={testId}
          checked={checked ?? false}
          onChange={(event) => onChange(event.target.checked)}
        />
      </FormControl>
      <div className="grid gap-1">
        <FormLabel className="font-normal leading-snug">{label}</FormLabel>
        <FormMessage />
      </div>
    </FormItem>
  );
}
