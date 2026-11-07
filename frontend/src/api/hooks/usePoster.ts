/** One poster: its detail, and every action on it. All go through the backend, which runs the checks
 * and enforces the status machine. Actions that need no checks show their result at once
 * (optimistic) and settle on the server's answer; if the server refuses, the screen goes back. */
import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { api, postForm, postJson, toForm } from "../client";
import type { Channel, PosterDetail } from "../types";
import { keys } from "./keys";
import { pendingReview, posterOfFinding, refreshPosterLists, restore, showPoster, snapshot, withFinding } from "./optimistic";

const getPoster = (id: string) => api<PosterDetail>(`/posters/${id}`);

export const usePoster = (id: string) =>
  useQuery({ queryKey: keys.poster(id), queryFn: () => getPoster(id), enabled: Boolean(id) });

/** Start loading a poster when a person points at it in a list, so the page opens without a wait. */
export function usePrefetchPoster() {
  const qc = useQueryClient();
  return (id: string) => void qc.prefetchQuery({ queryKey: keys.poster(id), queryFn: () => getPoster(id) });
}

interface Change<TArgs> {
  call: (args: TArgs) => Promise<PosterDetail>;
  /** The poster this changes (if known before the server answers). */
  target?: (args: TArgs, qc: QueryClient) => PosterDetail | undefined;
  /** What the poster will look like once the server agrees. */
  predict?: (detail: PosterDetail, args: TArgs) => PosterDetail;
}

function usePosterChange<TArgs>({ call, target, predict }: Change<TArgs>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: call,
    onMutate: async (args: TArgs) => {
      const before = target?.(args, qc);
      if (!before || !predict) return undefined;
      const saved = await snapshot(qc, keys.posters);
      showPoster(qc, predict(before, args));
      return saved;
    },
    onError: (_error, _args, saved) => restore(qc, saved),
    onSuccess: (detail) => showPoster(qc, detail),
    onSettled: () => refreshPosterLists(qc),
  });
}

const cached = (qc: QueryClient, id: string) => qc.getQueryData<PosterDetail>(keys.poster(id));

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

/** Upload a fixed version; the checks run again (10-30 s), so there is nothing to predict. */
export const useNewVersion = (posterId: string) =>
  usePosterChange({
    call: (input: VersionInput) => postForm<PosterDetail>(`/posters/${posterId}/versions`, toForm({ ...input })),
  });

export const useSubmitPoster = (posterId: string) =>
  usePosterChange({
    call: () => postJson<PosterDetail>(`/posters/${posterId}/submit`, {}),
    target: (_args: void, qc) => cached(qc, posterId),
    predict: (d) => ({
      ...d,
      status: "in_review",
      review_stage: "regional",
      allowed_actions: [],
      reviews: [...d.reviews, pendingReview("submitted")],
    }),
  });

export const useReviewPoster = (posterId: string) =>
  usePosterChange({
    call: (body: { action: "approve" | "send_back"; comment?: string }) =>
      postJson<PosterDetail>(`/posters/${posterId}/review`, body),
    target: (_args, qc) => cached(qc, posterId),
    predict: (d, { action, comment }) => {
      if (action === "send_back") {
        return { ...d, status: "changes_requested", review_stage: null, allowed_actions: [], reviews: [...d.reviews, pendingReview("sent_back", comment)] };
      }
      const final = d.review_stage === "head_office";
      return {
        ...d,
        status: final ? "approved" : "in_review",
        review_stage: final ? null : "head_office",
        allowed_actions: [],
        reviews: [...d.reviews, pendingReview(final ? "final_approved" : "approved")],
      };
    },
  });

/** A reviewer confirms a reading that needed a person. */
export const useResolveFinding = () =>
  usePosterChange({
    call: ({ findingId, note }: { findingId: string; note: string }) =>
      postJson<PosterDetail>(`/findings/${findingId}/resolve`, { note }),
    target: ({ findingId }, qc) => posterOfFinding(qc, findingId),
    predict: (d, { findingId, note }) => withFinding(d, findingId, { status: "resolved", override_reason: note }),
  });

/** Head office overrides a blocking finding, with a reason. */
export const useOverrideFinding = () =>
  usePosterChange({
    call: ({ findingId, note }: { findingId: string; note: string }) =>
      postJson<PosterDetail>(`/findings/${findingId}/override`, { note }),
    target: ({ findingId }, qc) => posterOfFinding(qc, findingId),
    predict: (d, { findingId, note }) => withFinding(d, findingId, { status: "overridden", override_reason: note }),
  });
