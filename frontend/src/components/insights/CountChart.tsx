import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { CountItem } from "@/api/types";
import { Panel } from "@/components/ui/Panel";

/** A horizontal bar chart of counts. Colours are theme tokens, so it follows light and midnight. */
export function CountChart({ title, items, colour = "var(--color-ink)", empty }: {
  title: string;
  items: CountItem[];
  colour?: string;
  empty: string;
}) {
  return (
    <Panel title={title}>
      {items.length === 0 ? (
        <p className="text-sm text-muted-text">{empty}</p>
      ) : (
        <div style={{ height: `calc(${Math.max(3, items.length)} * 2.25rem + 2rem)` }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={items} layout="vertical" margin={{ left: 4, right: 16, top: 4, bottom: 4 }}>
              <XAxis type="number" allowDecimals={false} stroke="var(--color-line-strong)" tick={{ fill: "var(--color-muted-text)", fontSize: 12 }} />
              <YAxis type="category" dataKey="label" width={160} stroke="var(--color-line-strong)" tick={{ fill: "var(--color-ink)", fontSize: 12 }} />
              <Tooltip
                cursor={{ fill: "var(--color-surface-sunken)" }}
                contentStyle={{ background: "var(--color-surface)", border: "1px solid var(--color-line-strong)", borderRadius: "var(--radius)", color: "var(--color-ink-strong)" }}
                labelStyle={{ color: "var(--color-ink-strong)", fontWeight: 600 }}
                itemStyle={{ color: "var(--color-ink)" }}
              />
              <Bar dataKey="count" name="Count" fill={colour} radius={[0, 3, 3, 0]} maxBarSize={22} isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </Panel>
  );
}
