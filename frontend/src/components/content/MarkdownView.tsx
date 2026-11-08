import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import type { Block } from "@/lib/markdown";
import { InlineText } from "./InlineText";

const HEADING = {
  1: "text-4xl leading-tight font-semibold tracking-tight sm:text-5xl",
  2: "scroll-mt-24 border-t border-line pt-10 text-2xl font-semibold tracking-tight sm:text-3xl",
  3: "scroll-mt-24 pt-2 text-lg font-semibold",
  4: "scroll-mt-24 pt-1 text-base font-semibold",
} as const;

const ONLY_LINK = /^\[([^\]]+)\]\((\/[^)]*)\)$/;

export function MarkdownView({ blocks }: { blocks: Block[] }) {
  return (
    <div className="flex flex-col gap-5 text-base leading-relaxed text-ink">
      {blocks.map((block, i) => {
        if (block.kind === "heading") {
          const Tag = `h${block.level}` as const;
          return <Tag key={i} id={block.id} className={HEADING[block.level]}><InlineText text={block.text} /></Tag>;
        }
        if (block.kind === "list") {
          const Tag = block.ordered ? "ol" : "ul";
          return (
            <Tag key={i} className={block.ordered ? "flex max-w-3xl list-decimal flex-col gap-2 pl-6" : "flex max-w-3xl list-disc flex-col gap-2 pl-6 marker:text-muted-text"}>
              {block.items.map((item, j) => <li key={j} className="pl-1 text-pretty"><InlineText text={item} /></li>)}
            </Tag>
          );
        }
        const cta = ONLY_LINK.exec(block.text);
        if (cta) {
          return <Button key={i} size="lg" asChild className="self-start"><Link to={cta[2]}>{cta[1]}</Link></Button>;
        }
        return <p key={i} className="max-w-3xl text-pretty"><InlineText text={block.text} /></p>;
      })}
    </div>
  );
}
