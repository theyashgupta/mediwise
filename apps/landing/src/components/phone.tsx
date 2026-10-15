import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type ScreenName =
  "report" | "upload" | "marker" | "trends" | "alert" | "findings" | "move-first";

export function Phone({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "relative aspect-[433/882] w-full rounded-[18%/8.8%] bg-input p-[3.2%] ring-1 ring-border",
        className,
      )}
    >
      <div className="relative size-full overflow-hidden rounded-[14.5%/6.7%] bg-background">
        {children}
      </div>
      <div className="absolute top-[4%] left-1/2 h-[2.9%] w-[27%] -translate-x-1/2 rounded-full bg-neutral-950" />
    </div>
  );
}

export function Screen({
  name,
  alt,
  priority = false,
  className,
}: {
  name: ScreenName;
  alt: string;
  priority?: boolean;
  className?: string;
}) {
  return (
    <picture>
      <source srcSet={`/screens/${name}-dark.webp`} media="(prefers-color-scheme: dark)" />
      <img
        src={`/screens/${name}-light.webp`}
        alt={alt}
        width={600}
        height={1298}
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : "auto"}
        decoding={priority ? undefined : "async"}
        className={cn("absolute inset-x-0 top-[5.5%] h-auto w-full", className)}
      />
    </picture>
  );
}
