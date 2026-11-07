/** The password rule, the same as the server's (backend/app/models.py): at least 8 characters, with
 * a number and a special character. Each rule says what to do next, one at a time. */
export const PASSWORD_RULES = [
  { ok: (v: string) => v.length >= 8, next: (v: string) => `Keep going: ${8 - v.length} more character${8 - v.length === 1 ? "" : "s"}` },
  { ok: (v: string) => /\d/.test(v), next: () => "Add a number" },
  { ok: (v: string) => /[^A-Za-z0-9]/.test(v), next: () => "Add a special character, like ! or #" },
] as const;

/** What the password still needs, or null when it's good. */
export function passwordNeeds(value: string): string | null {
  const rule = PASSWORD_RULES.find((r) => !r.ok(value));
  return rule ? rule.next(value) : null;
}

export const passwordScore = (value: string) => PASSWORD_RULES.filter((r) => r.ok(value)).length;
