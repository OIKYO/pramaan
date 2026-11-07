/** Head office's overview and the audit log. */
import { useQuery } from "@tanstack/react-query";
import { api } from "../client";
import { supabase } from "../supabase";
import type { AuditEntry, Insights } from "../types";
import { keys } from "./keys";

export const useInsights = () => useQuery({ queryKey: keys.insights, queryFn: () => api<Insights>("/insights") });

interface AuditRow extends Omit<AuditEntry, "actor_name"> {
  profiles: { full_name: string } | null;
}

/** The latest 200 audit entries. Row-level security limits this to head office. */
export const useAuditLog = () =>
  useQuery({
    queryKey: keys.audit,
    queryFn: async (): Promise<AuditEntry[]> => {
      const { data, error } = await supabase
        .from("audit_log")
        .select("id, action, target_type, target_id, details, created_at, profiles(full_name)")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw new Error(`Couldn't load the audit log: ${error.message}`);
      return (data as unknown as AuditRow[]).map(({ profiles, ...row }) => ({
        ...row,
        actor_name: profiles?.full_name ?? null,
      }));
    },
  });
