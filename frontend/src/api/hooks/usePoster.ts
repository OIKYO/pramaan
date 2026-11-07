/** One poster: its detail, and every action on it. All go through the backend, which runs the checks
 * and enforces the status machine. Each action returns the updated detail, which replaces the cache. */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, postForm, postJson } from "../client";
import type { Channel, PosterDetail } from "../types";
import { keys } from "./keys";

export const usePoster = (id: string) =>
  useQuery({ queryKey: keys.poster(id), queryFn: () => api<PosterDetail>(`/posters/${id}`), enabled: Boolean(id) });

function useDetailMutation<TArgs>(call: (args: TArgs) => Promise<PosterDetail>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: call,
    onSuccess: (detail) => {
      queryClient.setQueryData(keys.poster(detail.id), detail);
      void queryClient.invalidateQueries({ queryKey: keys.posters });
      void queryClient.invalidateQueries({ queryKey: keys.insights });
    },
  });
}

export interface VersionInput {
  image: File;
  caption: string;
  alt_text: string;
  tagged_topper_ids: string[];
}

export interface NewPosterInput extends VersionInput {
  title: string;
  channel: Channel;
}

function toForm(input: Record<string, unknown>): FormData {
  const form = new FormData();
  for (const [key, value] of Object.entries(input)) {
    if (Array.isArray(value)) value.forEach((item) => form.append(key, String(item)));
    else if (value instanceof File) form.append(key, value);
    else form.append(key, String(value ?? ""));
  }
  return form;
}

/** Upload a poster: creates it, runs all checks (can take 20-30 s), returns the detail. */
export const useCreatePoster = () =>
  useDetailMutation((input: NewPosterInput) => postForm<PosterDetail>("/posters", toForm({ ...input })));

/** Upload a fixed version; the checks run again. */
export const useNewVersion = (posterId: string) =>
  useDetailMutation((input: VersionInput) => postForm<PosterDetail>(`/posters/${posterId}/versions`, toForm({ ...input })));

export const useSubmitPoster = (posterId: string) =>
  useDetailMutation(() => postJson<PosterDetail>(`/posters/${posterId}/submit`, {}));

export const useReviewPoster = (posterId: string) =>
  useDetailMutation((body: { action: "approve" | "send_back"; comment?: string }) =>
    postJson<PosterDetail>(`/posters/${posterId}/review`, body),
  );

/** A reviewer confirms a reading that needed a person. */
export const useResolveFinding = () =>
  useDetailMutation(({ findingId, note }: { findingId: string; note: string }) =>
    postJson<PosterDetail>(`/findings/${findingId}/resolve`, { note }),
  );

/** Head office overrides a blocking finding, with a reason. */
export const useOverrideFinding = () =>
  useDetailMutation(({ findingId, note }: { findingId: string; note: string }) =>
    postJson<PosterDetail>(`/findings/${findingId}/override`, { note }),
  );
