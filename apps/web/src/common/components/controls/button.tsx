import { cva, type VariantProps } from "class-variance-authority";
import { LoaderCircle } from "lucide-react";
import { Slot } from "radix-ui";
import type { ComponentProps, MouseEvent } from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "relative inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-transparent font-medium whitespace-nowrap outline-none select-none transition-[color,background-color,border-color,box-shadow,transform] duration-(--duration-fast) ease-standard focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring focus-visible:outline-solid disabled:pointer-events-none disabled:opacity-50 aria-busy:cursor-progress aria-disabled:not-aria-busy:pointer-events-none aria-disabled:not-aria-busy:opacity-50 motion-reduce:transition-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        primary:
          "bg-primary text-primary-foreground shadow-(--shadow-control) hover:bg-primary-hover motion-safe:active:translate-y-px active:shadow-none",
        secondary: "bg-secondary text-secondary-foreground hover:bg-accent aria-expanded:bg-accent",
        outline:
          "border-border bg-card text-foreground hover:border-input hover:bg-muted aria-expanded:bg-muted aria-pressed:border-ring aria-pressed:bg-muted",
        ghost: "text-foreground hover:bg-muted aria-expanded:bg-muted",
        destructive:
          "border-destructive/30 bg-destructive/8 text-destructive hover:border-destructive/50 hover:bg-destructive/12",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        sm: "h-8 px-3 text-sm",
        md: "h-10 px-4 text-sm",
        lg: "h-12 px-5 text-base",
      },
    },
    compoundVariants: [{ variant: "link", class: "h-auto rounded-sm px-0" }],
  },
);

export type ButtonProps = ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
    loading?: boolean;
  };

export function Button({
  className,
  variant = "primary",
  size = "md",
  asChild = false,
  loading = false,
  disabled = false,
  onClick,
  children,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot.Root : "button";
  const blocked = loading || (asChild && disabled);
  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
      disabled={asChild ? undefined : disabled}
      aria-disabled={blocked || undefined}
      aria-busy={loading || undefined}
      tabIndex={asChild && disabled ? -1 : props.tabIndex}
      onClick={(event: MouseEvent<HTMLButtonElement>) => {
        if (blocked) event.preventDefault();
        else onClick?.(event);
      }}
    >
      {loading && !asChild ? (
        <>
          <LoaderCircle aria-hidden className="absolute motion-safe:animate-spin" />
          <span className="inline-flex items-center gap-2 opacity-0">{children}</span>
        </>
      ) : (
        children
      )}
    </Comp>
  );
}
