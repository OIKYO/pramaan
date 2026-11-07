import type { UseQueryResult } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { ErrorState, LoadingRows } from "./States";

interface QueryStateProps<T> {
  query: UseQueryResult<T, Error>;
  /** When the data counts as empty, `empty` is shown instead. */
  isEmpty?: (data: T) => boolean;
  empty?: ReactNode;
  /** Rows of placeholder shown while loading. */
  loadingRows?: number;
  children: (data: T) => ReactNode;
}

/** Every screen's loading, error and empty states in one place, so they always look and behave the same. */
export function QueryState<T>({ query, isEmpty, empty, loadingRows, children }: QueryStateProps<T>) {
  if (query.isPending) return <LoadingRows rows={loadingRows} />;
  if (query.isError) return <ErrorState error={query.error} onRetry={() => void query.refetch()} />;
  if (empty && isEmpty?.(query.data)) return <>{empty}</>;
  return <>{children(query.data)}</>;
}
