/**
 * Upload a new poster and run all its checks (10-30 s on the live reader). While they run, the
 * poster already appears at the top of "My posters" as being checked, so the person can move on;
 * when the checks finish, the real poster replaces it. If the upload fails, the row disappears.
 */
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { postForm, toForm } from "../client";
import type { PosterDetail, PosterListItem } from "../types";
import { keys } from "./keys";
import { refreshPosterLists, restore, snapshot } from "./optimistic";
import type { NewPosterInput } from "./usePoster";

export function usePosterUpload() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: NewPosterInput) => postForm<PosterDetail>("/posters", toForm({ ...input })),
    onMutate: async (input) => {
      const saved = await snapshot(qc, keys.posterList("all"));
      const row: PosterListItem = {
        id: `uploading-${Date.now()}`,
        title: input.title,
        channel: input.channel,
        status: "draft",
        review_stage: null,
        current_version: 1,
        updated_at: new Date().toISOString(),
        branch_name: "",
        created_by_name: "You",
        blocking: 0,
        open_issues: 0,
        pending: true,
      };
      qc.setQueryData<PosterListItem[]>(keys.posterList("all"), (rows) => (rows ? [row, ...rows] : rows));
      return saved;
    },
    onError: (_error, _input, saved) => restore(qc, saved),
    onSuccess: (detail) => qc.setQueryData(keys.poster(detail.id), detail),
    onSettled: () => refreshPosterLists(qc),
  });
}
