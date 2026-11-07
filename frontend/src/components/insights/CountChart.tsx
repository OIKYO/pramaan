import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { CountItem } from "@/api/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/** A horizontal bar chart of counts, with an empty message when there's nothing yet. */
export function CountChart({ title, items, colour = "var(--color-ink)", empty }: {
  title: string;
  items: CountItem[];
  colour?: string;
  empty: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-muted-text">{empty}</p>
        ) : (
          <div style={{ height: Math.max(120, items.length * 36) }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={items} layout="vertical" margin={{ left: 8, right: 16 }}>
                <XAxis type="number" allowDecimals={false} tick={{ fill: "var(--color-muted-text)", fontSize: 12 }} />
                <YAxis type="category" dataKey="label" width={170} tick={{ fill: "var(--color-ink)", fontSize: 12 }} />
                <Tooltip cursor={{ fill: "var(--color-ink-soft)" }} />
                <Bar dataKey="count" name="Count" fill={colour} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
