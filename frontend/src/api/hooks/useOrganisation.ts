/** The organisation, its regions and branches, and how far its setup has got. */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { patchJson } from "../client";
import { supabase } from "../supabase";
import type { Branch, Organisation, OrganisationUpdate, Region } from "../types";
import { keys } from "./keys";
import { restore, snapshot } from "./optimistic";

async function rows<T>(query: PromiseLike<{ data: unknown; error: { message: string; code?: string } | null }>): Promise<T> {
  const { data, error } = await query;
  if (error) {
    if (error.code === "23505") throw new Error("That name is already used in your organisation. Use a different name.");
    if (error.code === "23503") throw new Error("Something still uses this. Move or delete what uses it first.");
    throw new Error(error.message);
  }
  return data as T;
}

/** Every column members may read. The join code isn't one: it comes from the API (useJoinCode). */
const ORG_COLUMNS = "id, name, industry_group, industry, org_type, focus, rulebooks, created_by, created_at";

export const useOrganisation = () =>
  useQuery({ queryKey: keys.organisation, queryFn: () => rows<Organisation>(supabase.from("organisations").select(ORG_COLUMNS).single()) });

export function useRenameOrganisation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => rows(supabase.from("organisations").update({ name }).eq("id", id).select("id")),
    onMutate: async ({ name }) => {
      const saved = await snapshot(qc, keys.organisation);
      qc.setQueryData<Organisation>(keys.organisation, (org) => org && { ...org, name });
      return saved;
    },
    onError: (_e, _v, saved) => restore(qc, saved),
    onSettled: () => qc.invalidateQueries({ queryKey: keys.organisation }),
  });
}

export const useRegions = () =>
  useQuery({ queryKey: keys.regions, queryFn: () => rows<Region[]>(supabase.from("regions").select("id, name").order("name")) });

export const useBranches = () =>
  useQuery({ queryKey: keys.branches, queryFn: () => rows<Branch[]>(supabase.from("branches").select("*").order("name")) });

function useWrite<TArgs>(key: readonly unknown[], call: (args: TArgs) => Promise<unknown>) {
  const qc = useQueryClient();
  return useMutation({ mutationFn: call, onSettled: () => qc.invalidateQueries({ queryKey: key }) });
}

export const useSaveRegion = () =>
  useWrite(keys.regions, ({ id, name }: { id?: string; name: string }) =>
    rows(id ? supabase.from("regions").update({ name }).eq("id", id).select("id") : supabase.from("regions").insert({ name }).select("id")),
  );

export const useDeleteRegion = () => useWrite(keys.regions, (id: string) => rows(supabase.from("regions").delete().eq("id", id).select("id")));

export const useSaveBranch = () =>
  useWrite(keys.branches, ({ id, ...branch }: Partial<Branch>) =>
    rows(id ? supabase.from("branches").update(branch).eq("id", id).select("id") : supabase.from("branches").insert(branch).select("id")),
  );

export const useDeleteBranch = () => useWrite(keys.branches, (id: string) => rows(supabase.from("branches").delete().eq("id", id).select("id")));

/** Head office changes what the organisation does, or which rulebooks it keeps. The server checks
 * it against the catalog and adds the rulebooks every organisation keeps. */
export function useUpdateOrganisation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (changes: OrganisationUpdate) => patchJson<Organisation>("/organisation", changes),
    onMutate: async (changes) => {
      const saved = await snapshot(qc, keys.organisation);
      const given = Object.fromEntries(Object.entries(changes).filter(([, v]) => v !== null && v !== undefined));
      qc.setQueryData<Organisation>(keys.organisation, (org) => org && { ...org, ...given });
      return saved;
    },
    onError: (_e, _v, saved) => restore(qc, saved),
    onSuccess: (org) => qc.setQueryData(keys.organisation, org),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: keys.rules });
      qc.invalidateQueries({ queryKey: keys.importSpecs });
    },
  });
}

/** What head office still has to tell Pramaan about the organisation, in words ("industry", "kind
 * of organisation"). Empty once it's complete, and while it loads, so no marker flashes. */
export function useProfileGaps(): string[] {
  const org = useOrganisation().data;
  if (!org) return [];
  const gaps: string[] = [];
  if (!org.industry_group || !org.industry) gaps.push("industry");
  if (!org.org_type) gaps.push("kind of organisation");
  return gaps;
}
