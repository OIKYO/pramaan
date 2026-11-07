/** Invite links and the organisation's join code, for head office and regional managers. */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, postJson } from "../client";
import type { Invite, InviteCreate, InviteCreated } from "../types";
import { keys } from "./keys";
import { restore, snapshot } from "./optimistic";

export const useInvites = () => useQuery({ queryKey: keys.invites, queryFn: () => api<Invite[]>("/invites") });

/** A single-use link. The link itself comes back only now, so the caller shows it straight away. */
export function useCreateInvite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: InviteCreate) => postJson<InviteCreated>("/invites", body),
    onSuccess: (created) => qc.setQueryData<Invite[]>(keys.invites, (list) => [created.invite, ...(list ?? [])]),
  });
}

/** Cancel an invite: it disappears at once and comes back if the server refuses. */
export function useRevokeInvite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => postJson<Invite>(`/invites/${id}/revoke`, {}),
    onMutate: async (id) => {
      const saved = await snapshot(qc, keys.invites);
      qc.setQueryData<Invite[]>(keys.invites, (list) => (list ?? []).filter((i) => i.id !== id));
      return saved;
    },
    onError: (_e, _id, saved) => restore(qc, saved),
    onSettled: () => qc.invalidateQueries({ queryKey: keys.invites }),
  });
}

export const useJoinCode = (enabled = true) =>
  useQuery({ queryKey: keys.joinCode, queryFn: () => api<{ code: string }>("/organisation/join-code"), enabled });

/** Replace the join code. The old one is hidden at once; the new one shows when the server sends it. */
export function useRefreshJoinCode() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => postJson<{ code: string }>("/organisation/join-code", {}),
    onMutate: async () => {
      const saved = await snapshot(qc, keys.joinCode);
      qc.setQueryData(keys.joinCode, undefined);
      return saved;
    },
    onError: (_e, _v, saved) => restore(qc, saved),
    onSuccess: (data) => qc.setQueryData(keys.joinCode, data),
  });
}
