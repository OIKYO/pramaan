/** The organisation's people. Reading goes through Supabase; adding people, changing roles,
 * passwords and access go through the backend, which also manages their sign-in. */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { postJson, api } from "../client";
import { supabase } from "../supabase";
import type { MemberCreated, MemberOut, Profile, Role } from "../types";
import { keys } from "./keys";
import { restore, snapshot } from "./optimistic";
import { PROFILE_COLUMNS } from "./useSession";

export const useMembers = () =>
  useQuery({
    queryKey: keys.members,
    queryFn: async (): Promise<Profile[]> => {
      const { data, error } = await supabase.from("profiles").select(PROFILE_COLUMNS).order("full_name");
      if (error) throw new Error(`Couldn't load your team: ${error.message}`);
      return data as Profile[];
    },
  });

export interface MemberInput {
  full_name: string;
  email: string;
  role: Role;
  branch_id: string | null;
  region_id: string | null;
}

function useMemberChange<TArgs, TResult>(call: (args: TArgs) => Promise<TResult>, predict?: (list: Profile[], args: TArgs) => Profile[]) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: call,
    onMutate: async (args: TArgs) => {
      if (!predict) return undefined;
      const saved = await snapshot(qc, keys.members);
      qc.setQueryData<Profile[]>(keys.members, (list) => list && predict(list, args));
      return saved;
    },
    onError: (_e, _a, saved) => restore(qc, saved),
    onSettled: () => qc.invalidateQueries({ queryKey: keys.members }),
  });
}

/** Add someone. The result holds their temporary password: show it once. */
export const useAddMember = () => useMemberChange((input: MemberInput) => postJson<MemberCreated>("/members", input));

export const useUpdateMember = () =>
  useMemberChange(
    ({ id, ...changes }: Partial<MemberInput> & { id: string }) => api<MemberOut>(`/members/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(changes),
    }),
    (list, { id, ...changes }) => list.map((m) => (m.id === id ? { ...m, ...changes } : m)),
  );

export const useResetPassword = () => useMemberChange((id: string) => postJson<MemberCreated>(`/members/${id}/reset-password`, {}));

export const useSetAccess = () =>
  useMemberChange(
    ({ id, active }: { id: string; active: boolean }) => postJson<MemberOut>(`/members/${id}/${active ? "reactivate" : "deactivate"}`, {}),
    (list, { id, active }) => list.map((m) => (m.id === id ? { ...m, deactivated_at: active ? null : new Date().toISOString() } : m)),
  );
