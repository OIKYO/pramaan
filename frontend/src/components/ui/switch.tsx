import * as React from "react";
import { cn } from "cn";
import { Switch as SwitchPrimitive } from "radix-ui";

/** On/off: a strong amber when on, grey when off. The thumb slides because the person flipped it. */
function Switch({ className, ...props }: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        "peer inline-flex h-5 w-9 shrink-0 items-center rounded-full p-0.5 transition-colors duration-(--duration-fast) outline-none disabled:cursor-not-allowed disabled:data-unchecked:opacity-60 data-checked:bg-control-on data-unchecked:bg-line-strong",
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className="pointer-events-none block size-4 rounded-full bg-surface shadow-sm transition-transform duration-(--duration-fast) data-checked:translate-x-4 data-unchecked:translate-x-0 dark:bg-ink-strong dark:data-checked:bg-canvas"
      />
    </SwitchPrimitive.Root>
  );
}

export { Switch };
