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
