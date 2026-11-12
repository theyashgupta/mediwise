import { ChevronDown } from "lucide-react";
import { Select as SelectPrimitive } from "radix-ui";
import type { ComponentProps, ReactNode } from "react";
import {
  Select as SelectRoot,
  SelectContent,
  SelectItem as ShadcnSelectItem,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { fieldControl } from "./input";

export { SelectGroup, SelectLabel, SelectSeparator } from "@/components/ui/select";

const triggerSizes = {
  sm: "h-8 pr-2 pl-2.5",
  md: "h-10 pr-2.5 pl-3",
} as const;

type TriggerProps = Pick<
  ComponentProps<typeof SelectPrimitive.Trigger>,
  "id" | "aria-label" | "aria-describedby" | "aria-invalid" | "className"
> & { "data-testid"?: string };

type SelectProps = ComponentProps<typeof SelectRoot> &
  TriggerProps & {
    placeholder?: ReactNode;
    size?: keyof typeof triggerSizes;
    children: ReactNode;
  };

export function Select({
  id,
  placeholder,
  size = "md",
  className,
  children,
  "aria-label": ariaLabel,
  "aria-describedby": describedBy,
  "aria-invalid": invalid,
  "data-testid": testId,
  ...root
}: SelectProps) {
  return (
    <SelectRoot {...root}>
      <SelectPrimitive.Trigger
        id={id}
        data-slot="select-trigger"
        aria-label={ariaLabel}
        aria-describedby={describedBy}
        aria-invalid={invalid}
        data-testid={testId}
        className={cn(
          fieldControl,
          triggerSizes[size],
          "flex items-center justify-between gap-2 whitespace-nowrap data-placeholder:text-muted-foreground *:data-[slot=select-value]:line-clamp-1 [&_svg]:pointer-events-none [&_svg]:shrink-0",
          className,
        )}
      >
        <SelectValue placeholder={placeholder} />
        <SelectPrimitive.Icon asChild>
          <ChevronDown aria-hidden className="size-4 text-muted-foreground" />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>
      <SelectContent className="rounded-xl">{children}</SelectContent>
    </SelectRoot>
  );
}

export function SelectItem({ className, ...props }: ComponentProps<typeof ShadcnSelectItem>) {
  return <ShadcnSelectItem className={cn("rounded-lg py-2", className)} {...props} />;
}
