import { cn } from "@/lib/utils";

const markPath =
  "M10 0s-7 7.6-7 13a7 7 0 0 0 14 0c0-5.4-7-13-7-13ZM6.25 11.25h7.5a1.25 1.25 0 0 1 0 2.5h-7.5a1.25 1.25 0 0 1 0-2.5Z";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden
      className={cn("size-6 shrink-0 text-primary", className)}
    >
      <path fillRule="evenodd" d={markPath} />
    </svg>
  );
}

export function Wordmark({ className }: { className?: string }) {
  return <span className={cn("font-semibold tracking-tight", className)}>MediWise</span>;
}

type LogoProps = {
  size?: "default" | "large";
  className?: string;
};

export function Logo({ size = "default", className }: LogoProps) {
  const large = size === "large";
  return (
    <span
      className={cn(
        "flex items-center",
        large ? "gap-2.5 text-xl md:gap-4 md:text-3xl" : "gap-2 text-base",
        className,
      )}
    >
      <LogoMark className={cn(large && "size-8 md:size-12")} />
      <Wordmark />
    </span>
  );
}
