import { completeRulebooks, suggestedRulebooks, useCatalog, useVocabulary } from "@/api/hooks/useCatalog";
import { useUpdateOrganisation } from "@/api/hooks/useOrganisation";
import { useRules } from "@/api/hooks/useRulebook";
import type { Organisation, RulebookDef } from "@/api/types";
import { Button } from "@/components/ui/button";
import { LoadingRows } from "@/components/ui/States";
import { toast } from "@/components/ui/Toast";
import { RulebookRow } from "./RulebookRow";

const GROUPS = [
  { behaviour: "always", title: "Always on", text: "Every organisation keeps these. They can't be switched off." },
  { behaviour: "conditional", title: "When a poster shows it",
    text: "These act only when a poster has a price, a figure, a date, an offer or a claim. Switch off any your posters never need." },
  { behaviour: "domain", title: "For particular industries", text: "Rules that apply only in some industries." },
] as const;

export function RulebookList({ org, canEdit }: { org: Organisation; canEdit: boolean }) {
  const catalog = useCatalog().data;
  const rules = useRules().data;
  const words = useVocabulary();
  const update = useUpdateOrganisation();
  if (!catalog) return <LoadingRows rows={6} />;

  const nameOf = (b: RulebookDef) => ({ offerings: words.offerings, figures: words.figures, people: words.people })[b.id] ?? b.name;
  const byId = (id: string) => catalog.rulebooks.find((b) => b.id === id)!;
  const kept = completeRulebooks(catalog, org.rulebooks);
  const suggested = suggestedRulebooks(catalog, org);
  const missing = suggested.filter((id) => !kept.includes(id));
  const save = (next: string[], message: string) =>
    update.mutate({ rulebooks: next }, { onSuccess: () => toast.success(message), onError: (e) => toast.error(e.message) });
  const neededBy = (id: string) => catalog.rulebooks.find((b) => kept.includes(b.id) && (b.requires ?? []).includes(id));

  return (
    <div className="flex flex-col gap-8">
      {canEdit && org.industry && missing.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line bg-surface px-4 py-3">
          <p className="text-sm text-ink">
            For <span className="font-medium text-ink-strong">{org.industry}</span>, Pramaan suggests also keeping{" "}
            {missing.map((id) => nameOf(byId(id))).join(", ")}.
          </p>
          <Button size="sm" variant="secondary" onClick={() => save(completeRulebooks(catalog, [...kept, ...missing]), "Suggested rulebooks added.")}>
            Add them
          </Button>
        </div>
      )}
      {GROUPS.map((group) => {
        const books = catalog.rulebooks.filter((b) => (b.behaviour ?? "conditional") === group.behaviour);
        if (books.length === 0) return null;
        return (
          <section key={group.behaviour} className="flex flex-col gap-3">
            <div className="flex flex-col gap-0.5">
              <h2 className="text-sm">{group.title}</h2>
              <p className="text-muted-text">{group.text}</p>
            </div>
            <ul className="flex flex-col divide-y divide-line rounded-lg border border-line bg-surface">
              {books.map((book) => {
                const on = kept.includes(book.id);
                const holder = neededBy(book.id);
                const name = nameOf(book);
                return (
                  <RulebookRow
                    key={book.id}
                    book={book}
                    name={name}
                    on={on}
                    suggested={suggested.includes(book.id)}
                    checks={(rules?.rules ?? []).filter((r) => r.rulebooks.includes(book.id))}
                    lockedBy={book.required ? "Always on" : holder ? nameOf(holder) : null}
                    adds={(book.requires ?? []).map((id) => nameOf(byId(id)))}
                    canEdit={canEdit}
                    pending={update.isPending}
                    onToggle={(next) =>
                      save(
                        next ? completeRulebooks(catalog, [...kept, book.id]) : kept.filter((id) => id !== book.id),
                        next ? `${name} added. Its checks run on new posters.` : `${name} removed. Its checks no longer run.`,
                      )
                    }
                  />
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
