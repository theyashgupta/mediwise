import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";
import { fieldControl } from "./input";

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(fieldControl, "field-sizing-content min-h-24 px-3 py-2.5", className)}
      {...props}
    />
  );
}
