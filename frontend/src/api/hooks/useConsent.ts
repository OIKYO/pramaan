import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, postJson } from "../client";
import type { ConsentApprove, ConsentPage, ConsentRequest, ConsentRequestCreate, ConsentRequestCreated } from "../types";
import { keys } from "./keys";
import { restore, snapshot } from "./optimistic";

export const useConsentRequests = (topperId: string) =>
  useQuery({
    queryKey: keys.consentRequests(topperId),
    queryFn: () => api<ConsentRequest[]>(`/consent-requests?topper_id=${encodeURIComponent(topperId)}`),
  });

export function useCreateConsentRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: ConsentRequestCreate) => postJson<ConsentRequestCreated>("/consent-requests", body),
    onSuccess: (made) =>
      qc.setQueryData<ConsentRequest[]>(keys.consentRequests(made.request.topper_id), (list) => [made.request, ...(list ?? [])]),
  });
}

export function useRevokeConsentRequest(topperId: string) {
  const qc = useQueryClient();
  const key = keys.consentRequests(topperId);
  return useMutation({
    mutationFn: (id: string) => postJson<ConsentRequest>(`/consent-requests/${id}/revoke`, {}),
    onMutate: async (id) => {
      const saved = await snapshot(qc, key);
      qc.setQueryData<ConsentRequest[]>(key, (list) => (list ?? []).map((r) => (r.id === id ? { ...r, status: "revoked" } : r)));
      return saved;
    },
    onError: (_e, _id, saved) => restore(qc, saved),
    onSettled: () => qc.invalidateQueries({ queryKey: key }),
  });
}

export const useConsentPage = (token: string) =>
  useQuery({ queryKey: keys.consentPage(token), queryFn: () => api<ConsentPage>(`/consent/${encodeURIComponent(token)}`), retry: false });

type Answer =
  | { kind: "approve"; body: ConsentApprove }
  | { kind: "decline"; body: { reason: string | null } }
  | { kind: "withdraw"; body: { signer_name: string } };

export function useAnswerConsent(token: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ kind, body }: Answer) => postJson<ConsentPage>(`/consent/${encodeURIComponent(token)}/${kind}`, body),
    onSuccess: (page) => qc.setQueryData(keys.consentPage(token), page),
  });
}
