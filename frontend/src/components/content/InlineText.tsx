import { Fragment, type ReactNode } from "react";
import { Link } from "react-router";

const TOKEN = /(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\)|`[^`]+`)/g;

export function InlineText({ text }: { text: string }) {
  const parts: ReactNode[] = text.split(TOKEN).map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i} className="font-semibold text-ink-strong">{part.slice(2, -2)}</strong>;
    }
    const link = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(part);
    if (link) {
      const [, label, to] = link;
      const style = "font-medium text-ink-strong underline decoration-line-strong underline-offset-4 hover:decoration-ink-strong";
      return to.startsWith("/") || to.startsWith("#")
        ? <Link key={i} to={to} className={style}>{label}</Link>
        : <a key={i} href={to} target="_blank" rel="noreferrer" className={style}>{label}</a>;
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return <code key={i} className="rounded-sm bg-surface-sunken px-1 py-0.5 text-[0.95em] text-ink-strong">{part.slice(1, -1)}</code>;
    }
    return <Fragment key={i}>{part}</Fragment>;
  });
  return <>{parts}</>;
}
