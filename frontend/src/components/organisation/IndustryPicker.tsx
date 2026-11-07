import { Check, ChevronsUpDown, Search } from "lucide-react";
import { useId, useMemo, useState, type KeyboardEvent } from "react";
import type { Catalog } from "@/api/types";
import { Popover } from "@/components/ui/Popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

export interface IndustryValue {
  group: string | null;
  industry: string | null;
}

interface Option {
  group: string;
  groupName: string;
  industry: string;
  custom?: boolean;
}

/** Every subdomain whose name, or whose industry's name, contains the search. */
function search(catalog: Catalog, query: string): Option[] {
  const q = query.trim().toLowerCase();
  return catalog.industries.flatMap((g) => {
    const groupHit = g.name.toLowerCase().includes(q);
    return g.subdomains
      .filter((s) => !q || groupHit || s.toLowerCase().includes(q))
      .map((s) => ({ group: g.id, groupName: g.name, industry: s }));
  });
}

/**
 * What the organisation does: one search across 30 industries and their 500-odd subdomains,
 * grouped by industry. Anything not listed can be typed in, and then placed under the closest
 * industry, so nobody is forced into the wrong box.
 */
export function IndustryPicker({ catalog, value, onChange, invalid = false }: {
  catalog: Catalog;
  value: IndustryValue;
  onChange: (value: IndustryValue) => void;
  invalid?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const listId = useId();
  const group = catalog.industries.find((g) => g.id === value.group);
  const custom = Boolean(value.industry && group && !group.subdomains.includes(value.industry));

  const options = useMemo(() => {
    const found = search(catalog, query);
    const typed = query.trim();
    const exact = found.some((o) => o.industry.toLowerCase() === typed.toLowerCase());
    if (typed.length >= 2 && !exact) {
      found.push({ group: value.group ?? "other", groupName: "Not listed", industry: typed, custom: true });
    }
    return found;
  }, [catalog, query, value.group]);

  const choose = (o: Option) => {
    onChange({ group: o.group, industry: o.industry });
    setOpen(false);
    setQuery("");
  };
  const onKey = (event: KeyboardEvent) => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const next = Math.max(0, Math.min(options.length - 1, active + (event.key === "ArrowDown" ? 1 : -1)));
      setActive(next);
      document.getElementById(`${listId}-${next}`)?.scrollIntoView({ block: "nearest" });
    } else if (event.key === "Enter" && options[active]) {
      event.preventDefault();
      choose(options[active]);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <Popover
        open={open}
        onOpenChange={setOpen}
        matchWidth
        trigger={
          <button
            type="button"
            aria-invalid={invalid || undefined}
            className="flex h-9 w-full items-center gap-2 rounded-md border border-input bg-surface px-3 text-left text-sm aria-invalid:border-blocked"
          >
            {value.industry ? (
              <span className="flex min-w-0 flex-1 items-baseline gap-2">
                <span className="truncate text-ink-strong">{value.industry}</span>
                {group && <span className="truncate text-xs text-muted-text">{group.name}</span>}
              </span>
            ) : (
              <span className="flex-1 text-muted-text">Search, e.g. coaching, restaurant, gym</span>
            )}
            <ChevronsUpDown className="size-4 shrink-0 text-muted-text" aria-hidden />
          </button>
        }
      >
        <div className="flex items-center gap-2 border-b border-line px-3">
          <Search className="size-4 text-muted-text" aria-hidden />
          <input
            autoFocus
            role="combobox"
            aria-expanded
            aria-controls={listId}
            aria-activedescendant={options[active] ? `${listId}-${active}` : undefined}
            aria-label="Search industries"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setActive(0); }}
            onKeyDown={onKey}
            placeholder="Search industries"
            className="h-10 flex-1 bg-transparent text-sm text-ink-strong outline-none placeholder:text-muted-text"
          />
        </div>
        <ul id={listId} role="listbox" aria-label="Industries" className="max-h-72 overflow-y-auto p-1">
          {options.length === 0 && <li className="px-2 py-6 text-center text-muted-text">Type at least 2 letters to describe it yourself.</li>}
          {options.map((o, i) => {
            const firstOfGroup = i === 0 || options[i - 1].groupName !== o.groupName;
            const selected = !o.custom && o.group === value.group && o.industry === value.industry;
            return (
              <li key={`${o.group}-${o.industry}-${o.custom ? "custom" : ""}`} role="presentation">
                {firstOfGroup && <p className="px-2 pt-2 pb-1 text-xs text-muted-text">{o.groupName}</p>}
                <div
                  id={`${listId}-${i}`}
                  role="option"
                  aria-selected={selected}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => choose(o)}
                  className={cn("flex h-8 cursor-pointer items-center gap-2 rounded-sm px-2 text-ink-strong", i === active && "bg-surface-sunken")}
                >
                  <span className="flex-1 truncate">{o.custom ? `Use “${o.industry}”` : o.industry}</span>
                  {selected && <Check className="size-4 text-muted-text" aria-hidden />}
                </div>
              </li>
            );
          })}
        </ul>
      </Popover>
      {custom && (
        <div className="flex flex-col gap-1.5">
          <span className="text-xs text-muted-text">Which industry is it closest to? This picks the words Pramaan uses.</span>
          <Select value={value.group ?? undefined} onValueChange={(g) => onChange({ group: g, industry: value.industry })}>
            <SelectTrigger className="w-full"><SelectValue placeholder="Choose the closest industry" /></SelectTrigger>
            <SelectContent>{catalog.industries.map((g) => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}
