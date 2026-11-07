import { cn } from "cn";

/** A still placeholder block while data loads. It doesn't shimmer or pulse. */
function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="skeleton" className={cn("rounded-md bg-surface-sunken", className)} {...props} />;
}

export { Skeleton };
