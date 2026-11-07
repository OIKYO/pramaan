import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "cn";
import { Slot } from "radix-ui";

/**
 * Buttons. "default" is the one main action on a screen (orange); "secondary"/"outline" sit beside it;
 * "ghost" is for quiet actions in lists; "danger" removes or overrides something.
 * Colour changes on hover are the only motion: buttons don't move, grow or glow.
 */
const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-md border border-transparent text-sm font-semibold whitespace-nowrap transition-colors duration-(--duration-fast) select-none disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-blocked [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-action text-on-action hover:bg-action-hover",
        secondary: "border-line-strong bg-surface text-ink-strong hover:bg-surface-sunken",
        outline: "border-line-strong bg-surface text-ink-strong hover:bg-surface-sunken",
        ghost: "text-ink hover:bg-surface-sunken hover:text-ink-strong aria-expanded:bg-surface-sunken",
        danger: "border-blocked/50 bg-surface text-blocked hover:bg-blocked-soft",
        destructive: "border-blocked/50 bg-surface text-blocked hover:bg-blocked-soft",
        link: "h-auto px-0 text-ink-strong underline underline-offset-4 hover:text-ink",
      },
      size: {
        default: "h-9 px-3.5",
        xs: "h-7 gap-1 px-2 text-xs [&_svg:not([class*='size-'])]:size-3.5",
        sm: "h-8 px-2.5",
        lg: "h-10 px-4 text-base",
        icon: "size-9",
        "icon-xs": "size-7 [&_svg:not([class*='size-'])]:size-3.5",
        "icon-sm": "size-8",
        "icon-lg": "size-10",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> & VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "button";
  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
