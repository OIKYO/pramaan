import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "cn";
import { Slot } from "radix-ui";

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-1.5 rounded-md border border-transparent text-sm font-medium whitespace-nowrap transition-[color,background-color,border-color,box-shadow,transform] duration-(--duration-fast) select-none active:scale-[0.98] motion-reduce:active:scale-100 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-blocked [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-primary text-on-primary hover:bg-primary-hover",
        secondary: "border-line-strong bg-surface text-ink-strong hover:bg-surface-sunken",
        outline: "border-line-strong bg-surface text-ink-strong hover:bg-surface-sunken",
        ghost: "text-ink hover:bg-surface-sunken hover:text-ink-strong aria-expanded:bg-surface-sunken",
        danger: "border-line-strong bg-surface text-blocked hover:border-blocked/40 hover:bg-blocked-soft",
        destructive: "border-line-strong bg-surface text-blocked hover:border-blocked/40 hover:bg-blocked-soft",
        link: "h-auto px-0 text-ink-strong underline decoration-line-strong underline-offset-4 hover:decoration-ink-strong",
      },
      size: {
        default: "h-9 px-3.5",
        xs: "h-7 gap-1 px-2 text-xs [&_svg:not([class*='size-'])]:size-3.5",
        sm: "h-8 px-3",
        lg: "h-10 px-4",
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
