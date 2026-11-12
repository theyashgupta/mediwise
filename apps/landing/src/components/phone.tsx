import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type ScreenName =
  "report" | "upload" | "marker" | "trends" | "alert" | "findings" | "move-first";

export function Phone({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("phone relative aspect-[433/882] w-full", className)}>
      <div className="phone-bezel">
        <div className="relative size-full overflow-hidden rounded-[14%/6.6%] bg-background">
          {children}
        </div>
        <div className="phone-island" />
      </div>
    </div>
  );
}

export function Screen({
  name,
  alt,
  priority = false,
  loading = priority ? "eager" : "lazy",
  className,
}: {
  name: ScreenName;
  alt: string;
  priority?: boolean;
  loading?: "eager" | "lazy";
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
        loading={loading}
        fetchPriority={priority ? "high" : "auto"}
        decoding={priority ? undefined : "async"}
        className={cn("absolute inset-x-0 top-[5.5%] h-auto w-full", className)}
      />
    </picture>
  );
}
