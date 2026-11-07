import { usePosterList, type PosterScope } from "@/api/hooks/usePosters";

/** How many posters wait in a queue, beside its menu item. Nothing when the queue is empty. */
export function QueueCount({ scope }: { scope: PosterScope }) {
  const count = usePosterList(scope).data?.length ?? 0;
  if (count === 0) return null;
  return (
    <span className="ml-auto grid h-5 min-w-5 place-items-center rounded-sm bg-action px-1 text-xs font-bold text-on-action tabular-nums">
      <span className="sr-only">, waiting: </span>
      {count}
    </span>
  );
}
