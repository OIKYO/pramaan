import { useMemo } from "react";
import { parseMarkdown } from "@/lib/markdown";
import { InlineText } from "./InlineText";
import { MarkdownView } from "./MarkdownView";

export function ContentPage({ source }: { source: string }) {
  const blocks = useMemo(() => parseMarkdown(source), [source]);
  const sections = blocks.filter((b) => b.kind === "heading" && b.level === 2);
  return (
    <div className="grid gap-10 px-5 py-14 sm:px-8 sm:py-20 lg:grid-cols-[minmax(0,1fr)_minmax(0,3fr)] lg:gap-16 lg:px-12">
      <nav aria-label="On this page" className="hidden flex-col gap-3 lg:sticky lg:top-24 lg:flex lg:self-start">
        {sections.length > 0 && <p className="text-xs text-muted-text">On this page</p>}
        <ul className="flex flex-col gap-2 border-l border-line">
          {sections.map((s) => s.kind === "heading" && (
            <li key={s.id}>
              <a href={`#${s.id}`} className="-ml-px block border-l border-transparent pl-4 text-sm text-muted-text hover:border-ink-strong hover:text-ink-strong">
                <InlineText text={s.text} />
              </a>
            </li>
          ))}
        </ul>
      </nav>
      <article className="flex min-w-0 flex-col">
        <MarkdownView blocks={blocks} />
      </article>
    </div>
  );
}
