import { Link } from "react-router";
import type { Rule, RulebookDef } from "@/api/types";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { ToneBadge } from "@/components/ui/ToneBadge";

/** Where each rulebook's records are kept. Dates and offers keep none: their checks need only the poster. */
const PAGE: Record<string, string> = {
  brand: "/rulebook/brand", contacts: "/organisation/branches", claims: "/rulebook/brand", rights: "/rulebook/brand",
  legal: "/rulebook/brand", offerings: "/rulebook/offerings", figures: "/rulebook/figures", people: "/rulebook/people",
  rankings: "/rulebook/people",
};

interface RulebookRowProps {
  book: RulebookDef;
  name: string;
  on: boolean;
  suggested: boolean;
  checks: Rule[];
  /** Why it can't be switched: "Always on", or the rulebook that needs it. */
  lockedBy: string | null;
  /** The rulebooks switching it on brings with it. */
  adds: string[];
  canEdit: boolean;
  pending: boolean;
  onToggle: (on: boolean) => void;
}

/** One rulebook: what it holds, its checks, and its switch. */
export function RulebookRow({ book, name, on, suggested, checks, lockedBy, adds, canEdit, pending, onToggle }: RulebookRowProps) {
  const meta = [
    checks.length > 0 && `${checks.length} ${checks.length === 1 ? "check" : "checks"}: ${checks.map((r) => r.id).join(", ")}`,
    lockedBy && lockedBy !== "Always on" && `Needed by ${lockedBy}`,
    !on && adds.length > 0 && `Adds ${adds.join(" and ")}`,
  ].filter(Boolean);
  return (
    <li className="flex flex-wrap items-start gap-x-6 gap-y-3 px-4 py-4">
      <div className="flex min-w-0 flex-1 basis-80 flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-sm">{name}</h3>
          {!on && suggested && <ToneBadge tone="accent">Suggested for you</ToneBadge>}
        </div>
        <p className="text-pretty text-muted-text">{book.about}</p>
        {meta.length > 0 && <p className="text-xs text-muted-text">{meta.join(" · ")}</p>}
      </div>
      <div className="flex items-center gap-3">
        {on && PAGE[book.id] && (
          <Button variant="ghost" size="sm" asChild>
            <Link to={PAGE[book.id]}>Open</Link>
          </Button>
        )}
        <Switch
          checked={on}
          disabled={!canEdit || Boolean(lockedBy) || pending}
          aria-label={`${name}: ${on ? "kept" : "not kept"}${lockedBy ? ` (${lockedBy})` : ""}`}
          onCheckedChange={onToggle}
        />
      </div>
    </li>
  );
}
