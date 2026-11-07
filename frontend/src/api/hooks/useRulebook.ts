/** Head office's rulebook: brand kit, courses, results figures, toppers and rule switches.
 * Read and edited through Supabase; row-level security lets only head office write. */
import { useMutation, useQuery, useQueryClient, type QueryKey } from "@tanstack/react-query";
import { api, postForm } from "../client";
import { supabase } from "../supabase";
import type { Branch, BrandKit, Course, ResultStat, RulePack, Topper } from "../types";
import { keys } from "./keys";

const TOPPER_COLUMNS =
  "id, full_name, name_variants, exam, exam_year, rank, result_date, course_id, is_minor, has_consent, " +
  "consent_date, consent_channels, consent_valid_until, guardian_signed, verified_at";

function friendly(error: { message: string; code?: string }): Error {
  if (error.code === "42501" || /row-level security|permission denied/i.test(error.message)) {
    return new Error("Only head office can change the rulebook.");
  }
  if (error.code === "23505") return new Error("Something with that name already exists. Use a different name.");
  return new Error(error.message);
}

async function rows<T>(query: PromiseLike<{ data: unknown; error: { message: string; code?: string } | null }>): Promise<T> {
  const { data, error } = await query;
  if (error) throw friendly(error);
  return data as T;
}

function useSave<TArgs>(key: QueryKey, call: (args: TArgs) => Promise<unknown>) {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: call, onSuccess: () => queryClient.invalidateQueries({ queryKey: key }) });
}

// ---------------------------------------------------------------- brand kit

export const useBrandKit = () =>
  useQuery({
    queryKey: keys.brandKit,
    queryFn: () => rows<BrandKit>(supabase.from("brand_kit").select("*").eq("id", 1).single()),
  });

export const useSaveBrandKit = () =>
  useSave(keys.brandKit, (kit: Partial<BrandKit>) =>
    rows(supabase.from("brand_kit").update(kit).eq("id", 1).select("id").single()),
  );

export const logoUrl = (path: string) => supabase.storage.from("brand").getPublicUrl(path).data.publicUrl;

// ---------------------------------------------------------------- courses and results figures

export const useCourses = () =>
  useQuery({ queryKey: keys.courses, queryFn: () => rows<Course[]>(supabase.from("courses").select("*").order("name")) });

export const useSaveCourse = () =>
  useSave(keys.courses, ({ id, ...course }: Partial<Course>) =>
    rows(id ? supabase.from("courses").update(course).eq("id", id).select("id") : supabase.from("courses").insert(course).select("id")),
  );

export const useDeleteCourse = () =>
  useSave(keys.courses, (id: string) => rows(supabase.from("courses").delete().eq("id", id).select("id")));

export const useResultStats = () =>
  useQuery({
    queryKey: keys.resultStats,
    queryFn: () => rows<ResultStat[]>(supabase.from("result_stats").select("*").order("year", { ascending: false })),
  });

export const useSaveResultStat = () =>
  useSave(keys.resultStats, ({ id, ...stat }: Partial<ResultStat>) =>
    rows(id ? supabase.from("result_stats").update(stat).eq("id", id).select("id") : supabase.from("result_stats").insert(stat).select("id")),
  );

export const useDeleteResultStat = () =>
  useSave(keys.resultStats, (id: string) => rows(supabase.from("result_stats").delete().eq("id", id).select("id")));

// ---------------------------------------------------------------- toppers register

export const useToppers = () =>
  useQuery({
    queryKey: keys.toppers,
    queryFn: () => rows<Topper[]>(supabase.from("toppers").select(TOPPER_COLUMNS).order("rank")),
  });

type TopperEdit = Omit<Topper, "has_consent" | "verified_at">;

export const useSaveTopper = () =>
  useSave(keys.toppers, ({ id, ...topper }: Partial<TopperEdit>) =>
    rows(id ? supabase.from("toppers").update(topper).eq("id", id).select("id") : supabase.from("toppers").insert(topper).select("id")),
  );

/** Head office uploads a signed consent PDF; it goes to the private bucket via the backend. */
export const useUploadConsent = () =>
  useSave(keys.toppers, ({ topperId, file }: { topperId: string; file: File }) => {
    const form = new FormData();
    form.append("file", file);
    return postForm(`/toppers/${topperId}/consent`, form);
  });

/** A short-lived link to a consent file (head office only). */
export const useConsentLink = () =>
  useMutation({ mutationFn: (topperId: string) => api<{ url: string; expires_in: number }>(`/toppers/${topperId}/consent-url`) });

// ---------------------------------------------------------------- rules and branches

export const useRules = () => useQuery({ queryKey: keys.rules, queryFn: () => api<RulePack>("/rules") });

export const useToggleRule = () =>
  useSave(keys.rules, ({ ruleId, enabled }: { ruleId: string; enabled: boolean }) =>
    rows(supabase.from("rule_settings").upsert({ rule_id: ruleId, enabled }).select("rule_id")),
  );

export const useBranches = () =>
  useQuery({ queryKey: keys.branches, queryFn: () => rows<Branch[]>(supabase.from("branches").select("*").order("name")) });
