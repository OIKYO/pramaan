/**
 * Just enough Markdown for the website's own pages (src/content): headings, paragraphs, bullet and
 * numbered lists. Inline marks (**bold**, [links](/to), `code`) are handled by InlineText. It builds
 * plain data, never HTML, so nothing in a page can inject markup.
 */
export type Block =
  | { kind: "heading"; level: 1 | 2 | 3 | 4; text: string; id: string }
  | { kind: "paragraph"; text: string }
  | { kind: "list"; ordered: boolean; items: string[] };

/** "Two readers, clear decisions" -> "two-readers-clear-decisions", for #links to a section. */
export const slug = (text: string) =>
  text.toLowerCase().replace(/\*\*|`/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export function parseMarkdown(source: string): Block[] {
  const blocks: Block[] = [];
  let paragraph: string[] = [];
  let list: { ordered: boolean; items: string[] } | null = null;
  const flush = () => {
    if (paragraph.length) blocks.push({ kind: "paragraph", text: paragraph.join(" ") });
    if (list) blocks.push({ kind: "list", ...list });
    paragraph = [];
    list = null;
  };
  for (const raw of source.replace(/\r\n/g, "\n").split("\n")) {
    const line = raw.trim();
    const heading = /^(#{1,4})\s+(.*)$/.exec(line);
    const bullet = /^[-*]\s+(.*)$/.exec(line);
    const numbered = /^\d+\.\s+(.*)$/.exec(line);
    if (!line || line === "---") {
      flush();
    } else if (heading) {
      flush();
      const text = heading[2].trim();
      blocks.push({ kind: "heading", level: heading[1].length as 1 | 2 | 3 | 4, text, id: slug(text) });
    } else if (bullet || numbered) {
      if (paragraph.length || (list && list.ordered !== Boolean(numbered))) flush();
      list ??= { ordered: Boolean(numbered), items: [] };
      list.items.push((bullet ?? numbered)![1]);
    } else if (list) {
      list.items[list.items.length - 1] += ` ${line}`;  // a wrapped list line
    } else {
      paragraph.push(line);
    }
  }
  flush();
  return blocks;
}
