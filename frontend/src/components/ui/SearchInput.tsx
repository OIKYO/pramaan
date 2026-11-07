import { Search } from "lucide-react";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  /** What's being searched, read out to screen readers ("Search posters"). */
  label: string;
  placeholder?: string;
}

/** A search box for filtering a list as you type. */
export function SearchInput({ value, onChange, label, placeholder = "Search" }: SearchInputProps) {
  return (
    <label className="relative flex w-full items-center sm:w-64">
      <span className="sr-only">{label}</span>
      <Search className="pointer-events-none absolute left-2.5 size-4 text-muted-text" aria-hidden />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-9 w-full rounded-md border border-line-strong bg-surface pr-3 pl-8 text-sm text-ink-strong outline-none placeholder:text-muted-text focus-visible:border-focus focus-visible:ring-2 focus-visible:ring-focus/20"
      />
    </label>
  );
}
