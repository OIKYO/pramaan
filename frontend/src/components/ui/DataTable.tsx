import type { ReactNode } from "react";
import { Link } from "react-router";
import { cn } from "@/lib/utils";

export interface Column<T> {
  header: string;
  cell: (row: T) => ReactNode;
  /** Right-align numbers, dates and buttons. */
  align?: "end";
  /** Keep the column as narrow as its content. */
  shrink?: boolean;
}

interface DataTableProps<T> {
  caption: string;
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  /** Make the whole row open a page. Rows with links shouldn't hold buttons. */
  rowLink?: (row: T) => { to: string; label: string } | null;
  /** A person pointed at or focused a row: start loading what it opens. */
  onRowIntent?: (row: T) => void;
}

const phoneLabel =
  "max-md:before:mb-0.5 max-md:before:block max-md:before:text-xs max-md:before:font-semibold max-md:before:text-muted-text max-md:before:content-[attr(data-label)]";

/** A table on wide screens that turns into labelled, stacked rows on phones. */
export function DataTable<T>({ caption, columns, rows, rowKey, rowLink, onRowIntent }: DataTableProps<T>) {
  return (
    <div className="overflow-hidden rounded-md border border-line bg-surface">
      <table className="w-full border-collapse text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead className="max-md:sr-only">
          <tr className="border-b border-line bg-surface-sunken/50">
            {columns.map((c) => (
              <th
                key={c.header}
                scope="col"
                className={cn("px-4 py-2.5 text-left text-xs font-semibold text-muted-text", c.align === "end" && "text-right", c.shrink && "w-px whitespace-nowrap")}
              >
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const link = rowLink?.(row) ?? null;
            const intent = onRowIntent ? () => onRowIntent(row) : undefined;
            return (
              <tr
                key={rowKey(row)}
                onPointerEnter={intent}
                onFocus={intent}
                className={cn(
                  "border-b border-line last:border-b-0 max-md:grid max-md:grid-cols-2 max-md:gap-x-4 max-md:gap-y-3 max-md:p-4",
                  link && "relative transition-colors duration-(--duration-fast) focus-within:bg-surface-sunken/50 hover:bg-surface-sunken/50",
                )}
              >
                {columns.map((c, i) => (
                  <td
                    key={c.header}
                    data-label={c.header}
                    className={cn(
                      "px-4 py-3 align-top max-md:p-0",
                      i === 0 ? "max-md:col-span-2" : phoneLabel,
                      c.align === "end" && "md:text-right",
                      c.shrink && "md:whitespace-nowrap",
                    )}
                  >
                    {i === 0 && link && (
                      <Link to={link.to} aria-label={link.label} className="absolute inset-0 focus-visible:-outline-offset-2" />
                    )}
                    {c.cell(row)}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
