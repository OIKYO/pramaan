import { Link } from "react-router";
import { completeRulebooks, suggestedRulebooks, useCatalog, useVocabulary } from "@/api/hooks/useCatalog";
import { useUpdateOrganisation } from "@/api/hooks/useOrganisation";
import { useRules } from "@/api/hooks/useRulebook";
import type { Organisation, RulebookDef, Vocabulary } from "@/api/types";
import { Button } from "@/components/ui/button";
import { LoadingRows } from "@/components/ui/States";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/Toast";
import { ToneBadge } from "@/components/ui/ToneBadge";

/** Where each rulebook's records are kept. */
const PAGE: Record<string, string> = {
  brand: "/rulebook/brand", contacts: "/organisation/branches", claims: "/rulebook/brand",
  offerings: "/rulebook/offerings", figures: "/rulebook/figures", people: "/rulebook/people", rankings: "/rulebook/people",
};

const nameOf = (book: RulebookDef, words: Vocabulary) =>
  ({ offerings: words.offerings, figures: words.figures, people: words.people })[book.id] ?? book.name;

/** Every rulebook, on or off for this organisation, with what it checks. Switching shows at once
 * and goes back if the server refuses. Rulebooks every organisation needs can't be switched off,
 * and one that another needs stays on while that one is on. */
export function RulebookList({ org, canEdit }: { org: Organisation; canEdit: boolean }) {
  const catalog = useCatalog().data;
  const rules = useRules().data;
  const words = useVocabulary();
  const update = useUpdateOrganisation();
  if (!catalog) return <LoadingRows rows={6} />;

  const kept = completeRulebooks(catalog, org.rulebooks);
  const suggested = suggestedRulebooks(catalog, org.industry_group, org.industry, org.focus ?? []);
  const save = (next: string[], message: string) =>
    update.mutate({ rulebooks: next }, { onSuccess: () => toast.success(message), onError: (e) => toast.error(e.message) });
  const neededBy = (id: string) => catalog.rulebooks.find((b) => kept.includes(b.id) && (b.requires ?? []).includes(id));
  const missing = suggested.filter((id) => !kept.includes(id));

  return (
    <div className="flex flex-col gap-4">
      {org.industry && missing.length > 0 && canEdit && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line bg-surface px-4 py-3">
          <p className="text-sm text-ink">
            Organisations in <span className="font-medium text-ink-strong">{org.industry}</span> usually also keep{" "}
            {missing.map((id) => nameOf(catalog.rulebooks.find((b) => b.id === id)!, words)).join(", ")}.
          </p>
          <Button size="sm" variant="secondary" onClick={() => save(completeRulebooks(catalog, [...kept, ...missing]), "Suggested rulebooks added.")}>
            Add them
          </Button>
        </div>
      )}
      <ul className="flex flex-col divide-y divide-line rounded-lg border border-line bg-surface">
        {catalog.rulebooks.map((book) => {
          const on = kept.includes(book.id);
          const holder = neededBy(book.id);
          const locked = book.required || Boolean(holder);
          const checks = (rules?.rules ?? []).filter((r) => r.rulebooks.includes(book.id));
          const name = nameOf(book, words);
          return (
            <li key={book.id} className="flex flex-wrap items-start gap-x-6 gap-y-3 px-4 py-4">
              <div className="flex min-w-0 flex-1 basis-80 flex-col gap-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-sm">{name}</h2>
                  {book.required && <ToneBadge tone="neutral">Always on</ToneBadge>}
                  {!on && suggested.includes(book.id) && <ToneBadge tone="accent">Suggested</ToneBadge>}
                </div>
                <p className="text-pretty text-muted-text">{book.about}</p>
                <p className="text-xs text-muted-text">
                  {[
                    checks.length > 0 && `${checks.length} ${checks.length === 1 ? "check" : "checks"}: ${checks.map((r) => r.id).join(", ")}`,
                    holder && `Needed by ${nameOf(holder, words)}`,
                    !on && (book.requires ?? []).length > 0 &&
                      `Adds ${(book.requires ?? []).map((id) => nameOf(catalog.rulebooks.find((b) => b.id === id)!, words)).join(" and ")}`,
                  ].filter(Boolean).join(" · ")}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {on && PAGE[book.id] && (
                  <Button variant="ghost" size="sm" asChild>
                    <Link to={PAGE[book.id]}>Open</Link>
                  </Button>
                )}
                <Switch
                  checked={on}
                  disabled={!canEdit || locked || update.isPending}
                  aria-label={`${name}: ${on ? "kept" : "not kept"}`}
                  onCheckedChange={(next) =>
                    save(
                      next ? completeRulebooks(catalog, [...kept, book.id]) : kept.filter((id) => id !== book.id),
                      next ? `${name} added. Its checks run on new posters.` : `${name} removed. Its checks no longer run.`,
                    )
                  }
                />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
