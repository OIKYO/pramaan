import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { api } from "../client";
import type { Catalog, Vocabulary } from "../types";
import { keys } from "./keys";
import { useOrganisation } from "./useOrganisation";

export const useCatalog = () =>
  useQuery({ queryKey: keys.catalog, queryFn: () => api<Catalog>("/catalog"), staleTime: Infinity, gcTime: Infinity });

export const DEFAULT_WORDS: Vocabulary = {
  offerings: "Products and prices",
  offering: "product",
  offering_plural: "products",
  price: "price",
  figures: "Approved figures",
  figure: "approved figure",
  people: "People and consent",
  person: "person",
  person_plural: "people",
  register_name: "consent register",
  durations: false,
  offering_types: false,
  exams: false,
};

export function vocabularyFor(catalog: Catalog | undefined, group: string | null | undefined, industry: string | null | undefined): Vocabulary {
  if (!catalog) return DEFAULT_WORDS;
  const found = catalog.industries.find((g) => g.id === group);
  const key = (industry && found?.special?.[industry]?.vocabulary) || found?.vocabulary || "default";
  return catalog.vocabularies[key] ?? catalog.vocabularies.default ?? DEFAULT_WORDS;
}

export function useVocabulary(): Vocabulary {
  const catalog = useCatalog().data;
  const org = useOrganisation().data;
  return useMemo(() => vocabularyFor(catalog, org?.industry_group, org?.industry), [catalog, org?.industry_group, org?.industry]);
}

export function completeRulebooks(catalog: Catalog | undefined, chosen: string[]): string[] {
  if (!catalog) return chosen;
  const set = new Set(chosen);
  for (const book of catalog.rulebooks) if (book.required) set.add(book.id);
  for (const book of catalog.rulebooks) if (set.has(book.id)) (book.requires ?? []).forEach((id) => set.add(id));
  return catalog.rulebooks.map((b) => b.id).filter((id) => set.has(id));
}

/** Until the organisation loads, every rulebook counts as kept, so menus don't flicker. */
export function useKeeps(): (rulebook: string) => boolean {
  const catalog = useCatalog().data;
  const org = useOrganisation().data;
  if (!org) return () => true;
  const kept = new Set(completeRulebooks(catalog, org.rulebooks ?? []));
  return (rulebook: string) => kept.has(rulebook);
}

/** Mirrors suggested_rulebooks() in backend/app/catalog.py. */
export function suggestedRulebooks(
  catalog: Catalog | undefined,
  org: { industry_group: string | null; industry: string | null; org_type: string | null; focus: string[] },
): string[] {
  if (!catalog) return [];
  const found = catalog.industries.find((g) => g.id === org.industry_group);
  const picks = [
    ...catalog.rulebooks.filter((b) => b.default_on).map((b) => b.id),
    ...(found?.suggest ?? []),
    ...((org.industry && found?.special?.[org.industry]?.suggest) || []),
    ...(catalog.org_types.find((t) => t.id === org.org_type)?.suggest ?? []),
  ];
  for (const area of catalog.focus_areas) if ((org.focus ?? []).includes(area.id)) picks.push(...area.suggest);
  return completeRulebooks(catalog, picks);
}
