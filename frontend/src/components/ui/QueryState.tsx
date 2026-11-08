import type { UseQueryResult } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { ErrorState, LoadingRows } from "./States";

interface QueryStateProps<T> {
  query: UseQueryResult<T, Error>;
  isEmpty?: (data: T) => boolean;
  empty?: ReactNode;
  loadingRows?: number;
  children: (data: T) => ReactNode;
}

export function QueryState<T>({ query, isEmpty, empty, loadingRows, children }: QueryStateProps<T>) {
  if (query.isPending) return <LoadingRows rows={loadingRows} />;
  if (query.isError) return <ErrorState error={query.error} onRetry={() => void query.refetch()} />;
  if (empty && isEmpty?.(query.data)) return <>{empty}</>;
  return <>{children(query.data)}</>;
}
