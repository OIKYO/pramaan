import { useQuery } from "@tanstack/react-query";
import type { Reliability } from "../types";
import { keys } from "./keys";

export const useReliability = () =>
  useQuery({
    queryKey: keys.reliability,
    queryFn: async () => {
      const response = await fetch("/reliability.json");
      if (!response.ok || !response.headers.get("content-type")?.includes("json")) {
        throw new Error("The reliability report isn't published yet. Check back soon.");
      }
      return (await response.json()) as Reliability;
    },
    staleTime: 10 * 60_000,
  });
