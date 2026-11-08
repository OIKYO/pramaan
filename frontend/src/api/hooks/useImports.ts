import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, postForm } from "../client";
import type { Dataset, ImportPreview, ImportSpec } from "../types";
import { keys } from "./keys";

export const useImportSpecs = () => useQuery({ queryKey: keys.importSpecs, queryFn: () => api<ImportSpec[]>("/imports"), staleTime: Infinity });

const AFFECTS: Record<Dataset, readonly unknown[][]> = {
  branches: [[...keys.branches], [...keys.regions]],
  courses: [[...keys.courses]],
  results: [[...keys.resultStats]],
  toppers: [[...keys.toppers]],
  members: [[...keys.members]],
};

export function useImport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ dataset, file, commit }: { dataset: Dataset; file: File; commit: boolean }) => {
      const form = new FormData();
      form.append("file", file);
      form.append("commit", String(commit));
      return postForm<ImportPreview>(`/imports/${dataset}`, form);
    },
    onSuccess: (result) => {
      if (result.committed) AFFECTS[result.dataset].forEach((queryKey) => void qc.invalidateQueries({ queryKey }));
    },
  });
}
