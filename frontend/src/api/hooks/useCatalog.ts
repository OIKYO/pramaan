/** What organisations do, the words each industry uses, and the rulebooks. The same for everyone
 * and needed before sign-up, so it is read once and kept. */
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { api } from "../client";
import type { Catalog, Vocabulary } from "../types";
import { keys } from "./keys";
import { useOrganisation } from "./useOrganisation";

export const useCatalog = () =>
  useQuery({ queryKey: keys.catalog, queryFn: () => api<Catalog>("/catalog"), staleTime: Infinity, gcTime: Infinity });

/** Used until the catalog arrives, and for an organisation that hasn't said what it does. */
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

/** The words your organisation uses: "Courses and fees", "Menu and prices", "Toppers register". */
export function useVocabulary(): Vocabulary {
  const catalog = useCatalog().data;
  const org = useOrganisation().data;
  return useMemo(() => vocabularyFor(catalog, org?.industry_group, org?.industry), [catalog, org?.industry_group, org?.industry]);
}

/** Rulebooks every organisation keeps, plus what each chosen rulebook depends on. */
export function completeRulebooks(catalog: Catalog | undefined, chosen: string[]): string[] {
  if (!catalog) return chosen;
  const set = new Set(chosen);
  for (const book of catalog.rulebooks) if (book.required) set.add(book.id);
  for (const book of catalog.rulebooks) if (set.has(book.id)) (book.requires ?? []).forEach((id) => set.add(id));
  return catalog.rulebooks.map((b) => b.id).filter((id) => set.has(id));
}

/** Whether your organisation keeps a rulebook. Until the organisation loads, everything counts
 * as kept, so menus don't flicker. */
export function useKeeps(): (rulebook: string) => boolean {
  const catalog = useCatalog().data;
  const org = useOrganisation().data;
  if (!org) return () => true;
  const kept = new Set(completeRulebooks(catalog, org.rulebooks ?? []));
  return (rulebook: string) => kept.has(rulebook);
}

/** What an organisation like this usually needs (the same rule as the server's): honest claims for
 * everyone, then the industry's, its subdomain's and its focus areas' suggestions. */
export function suggestedRulebooks(catalog: Catalog | undefined, group: string | null | undefined, industry: string | null | undefined, focus: string[]): string[] {
  if (!catalog) return [];
  const found = catalog.industries.find((g) => g.id === group);
  const picks = ["claims", ...(found?.suggest ?? []), ...((industry && found?.special?.[industry]?.suggest) || [])];
  for (const area of catalog.focus_areas) if (focus.includes(area.id)) picks.push(...area.suggest);
  return completeRulebooks(catalog, picks);
}
