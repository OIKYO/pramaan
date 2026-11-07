import { cn } from "@/lib/utils";

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

/** A person's initials in a circle. No photos: Pramaan doesn't store pictures of people. */
export function Avatar({ name, size = "md" }: { name: string; size?: "sm" | "md" }) {
  return (
    <span
      aria-hidden
      className={cn(
        "grid shrink-0 place-items-center rounded-full bg-surface-sunken font-medium text-ink-strong ring-1 ring-line",
        size === "sm" ? "size-6 text-xs" : "size-8 text-xs",
      )}
    >
      {initials(name)}
    </span>
  );
}
