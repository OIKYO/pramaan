import type { LucideIcon } from "lucide-react";
import { RadioGroup } from "radix-ui";
import { cn } from "@/lib/utils";

export interface Segment<T extends string> {
  value: T;
  label: string;
  icon?: LucideIcon;
  /** Show only the icon; the label is still read out and shown on hover. */
  iconOnly?: boolean;
  /** A small number after the label, e.g. how many posters a filter holds. */
  count?: number;
}

interface SegmentedControlProps<T extends string> {
  label: string;
  value: T;
  onChange: (value: T) => void;
  options: Segment<T>[];
  size?: "sm" | "md";
}

/** Pick one of a few options in a row (channel, theme, list filter). Arrow keys move between them. */
export function SegmentedControl<T extends string>({ label, value, onChange, options, size = "md" }: SegmentedControlProps<T>) {
  return (
    <RadioGroup.Root
      aria-label={label}
      value={value}
      onValueChange={(next) => onChange(next as T)}
      orientation="horizontal"
      className="inline-flex w-fit max-w-full gap-0.5 self-start overflow-x-auto rounded-md bg-surface-sunken p-0.5"
    >
      {options.map(({ value: option, label: text, icon: Icon, iconOnly, count }) => (
        <RadioGroup.Item
          key={option}
          value={option}
          aria-label={iconOnly ? text : undefined}
          title={iconOnly ? text : undefined}
          className={cn(
            "inline-flex shrink-0 items-center justify-center gap-1.5 rounded-sm font-medium whitespace-nowrap text-muted-text transition-colors duration-(--duration-fast) hover:text-ink-strong",
            "data-checked:bg-surface data-checked:text-ink-strong data-checked:shadow-sm data-checked:ring-1 data-checked:ring-line",
            size === "sm" ? "h-7 px-2 text-xs" : "h-8 px-3 text-sm",
          )}
        >
          {Icon && <Icon className="size-4" aria-hidden />}
          {!iconOnly && text}
          {count !== undefined && <span className="text-xs text-muted-text tabular-nums">{count}</span>}
        </RadioGroup.Item>
      ))}
    </RadioGroup.Root>
  );
}
