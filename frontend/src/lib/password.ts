/** Mirrors the server's password rule in backend/app/models.py. */
export const PASSWORD_RULES = [
  { ok: (v: string) => v.length >= 8, next: (v: string) => `Keep going: ${8 - v.length} more character${8 - v.length === 1 ? "" : "s"}` },
  { ok: (v: string) => /\d/.test(v), next: () => "Add a number" },
  { ok: (v: string) => /[^A-Za-z0-9]/.test(v), next: () => "Add a special character, like ! or #" },
] as const;

export function passwordNeeds(value: string): string | null {
  const rule = PASSWORD_RULES.find((r) => !r.ok(value));
  return rule ? rule.next(value) : null;
}

export const passwordScore = (value: string) => PASSWORD_RULES.filter((r) => r.ok(value)).length;
