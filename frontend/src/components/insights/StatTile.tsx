import { Card, CardContent } from "@/components/ui/card";

/** One headline number with its label. */
export function StatTile({ label, value, note }: { label: string; value: number; note?: string }) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-1">
        <span className="text-sm text-muted-text">{label}</span>
        <span className="font-heading text-3xl font-bold text-ink">{value}</span>
        {note && <span className="text-xs text-muted-text">{note}</span>}
      </CardContent>
    </Card>
  );
}
