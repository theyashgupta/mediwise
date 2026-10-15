import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"
import { Slot } from "radix-ui"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding text-sm font-semibold tracking-[-0.005em] whitespace-nowrap normal-case transition-[color,background-color,border-color,box-shadow,transform,filter] duration-(--duration-fast) ease-standard outline-none select-none focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 motion-reduce:transition-none motion-reduce:active:translate-y-0 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-(--shadow-control) hover:bg-[color-mix(in_oklch,var(--primary),var(--foreground)_8%)] active:bg-[color-mix(in_oklch,var(--primary),var(--foreground)_14%)] active:shadow-none focus-visible:border-ring",
        outline:
          "border-input bg-card text-foreground hover:border-[color-mix(in_oklch,var(--input),var(--foreground)_18%)] hover:bg-muted active:bg-[color-mix(in_oklch,var(--muted),var(--foreground)_8%)] focus-visible:border-ring aria-expanded:bg-muted aria-pressed:border-ring aria-pressed:bg-muted",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-[color-mix(in_oklch,var(--secondary),var(--foreground)_6%)] active:bg-[color-mix(in_oklch,var(--secondary),var(--foreground)_11%)] focus-visible:border-ring aria-expanded:bg-[color-mix(in_oklch,var(--secondary),var(--foreground)_6%)]",
        ghost:
          "text-foreground hover:bg-muted active:bg-[color-mix(in_oklch,var(--muted),var(--foreground)_8%)] focus-visible:border-ring aria-expanded:bg-muted",
        destructive:
          "border-destructive/30 bg-destructive/6 text-destructive hover:border-destructive/45 hover:bg-destructive/10 active:bg-destructive/14 focus-visible:border-destructive/50 focus-visible:ring-destructive/25 dark:bg-destructive/10 dark:hover:bg-destructive/14 dark:active:bg-destructive/18",
        link: "rounded-sm font-medium text-primary underline-offset-4 hover:underline active:translate-y-0",
      },
      size: {
        default:
          "h-9 gap-2 px-4 has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3 has-[>svg:first-child]:pl-3",
        xs: "h-6 gap-1 rounded-md px-2 text-xs has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 gap-1.5 rounded-md px-3 has-data-[icon=inline-end]:pr-2.5 has-data-[icon=inline-start]:pl-2.5 has-[>svg:first-child]:pl-2.5",
        lg: "h-11 gap-2 px-5 text-base has-data-[icon=inline-end]:pr-4 has-data-[icon=inline-start]:pl-4 has-[>svg:first-child]:pl-4",
        icon: "size-9",
        "icon-xs": "size-6 rounded-md [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-8 rounded-md",
        "icon-lg": "size-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
