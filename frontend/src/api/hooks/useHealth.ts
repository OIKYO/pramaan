import { useQuery } from "@tanstack/react-query";
import { getHealth } from "../client";

export function useHealth() {
  return useQuery({ queryKey: ["health"], queryFn: getHealth, retry: false });
}
