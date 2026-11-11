import type { ConsentPage } from "@/api/types";
import { CHANNEL_LABEL, formatDate } from "@/lib/labels";

function Highlight({ box }: { box: number[] }) {
  const [ymin, xmin, ymax, xmax] = box;
  return (
    <span
      aria-hidden
      className="absolute rounded-sm ring-2 ring-accent ring-offset-2 ring-offset-surface"
      style={{ top: `${ymin / 10}%`, left: `${xmin / 10}%`, height: `${(ymax - ymin) / 10}%`, width: `${(xmax - xmin) / 10}%` }}
    />
  );
}

export function ConsentShown({ page }: { page: ConsentPage }) {
  return (
    <section className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl text-pretty sm:text-3xl">
          {page.organisation} would like to show {page.person_name}'s result
        </h1>
        <p className="text-muted-text">
          {page.poster_title ? "This is the exact poster. " : ""}Look at what it says, then approve or decline. Nothing is published with {page.person_name} on it unless consent is given.
        </p>
      </div>
      {page.image_url && (
        <figure className="flex flex-col gap-2">
          <div className="relative overflow-hidden rounded-lg border border-line bg-surface">
            <img src={page.image_url} alt={`The poster “${page.poster_title ?? ""}”, with ${page.person_name} marked`} className="block w-full" />
            {page.box_2d && <Highlight box={page.box_2d} />}
          </div>
          {page.box_2d && <figcaption className="text-xs text-muted-text">{page.person_name} is marked on the poster.</figcaption>}
        </figure>
      )}
      <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-5 gap-y-2 rounded-lg border border-line bg-surface p-4 text-sm">
        <dt className="text-muted-text">What it says</dt>
        <dd className="flex flex-col gap-0.5 text-ink-strong">{page.shown.map((line) => <span key={line}>{line}</span>)}</dd>
        <dt className="text-muted-text">Where</dt>
        <dd className="text-ink-strong">{page.channels.map((c) => CHANNEL_LABEL[c]).join(", ")}</dd>
        <dt className="text-muted-text">Until</dt>
        <dd className="text-ink-strong">{formatDate(page.valid_until)}, unless you withdraw sooner</dd>
      </dl>
    </section>
  );
}
