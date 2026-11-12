import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export const fieldControl =
  "w-full min-w-0 rounded-lg border border-input bg-field text-base text-foreground outline-none transition-[color,border-color] duration-(--duration-fast) ease-standard placeholder:text-muted-foreground hover:border-foreground/60 focus-visible:border-ring focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring focus-visible:outline-solid disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive md:text-sm motion-reduce:transition-none";

const inputSizes = {
  sm: "h-8 px-2.5",
  md: "h-10 px-3",
  lg: "h-12 px-3.5",
} as const;

type InputProps = Omit<ComponentProps<"input">, "size"> & { size?: keyof typeof inputSizes };

export function Input({ className, size = "md", ...props }: InputProps) {
  return (
    <input
      data-slot="input"
      className={cn(
        fieldControl,
        inputSizes[size],
        "file:me-3 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
        className,
      )}
      {...props}
    />
  );
}
