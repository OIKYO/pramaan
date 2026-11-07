/** Edit list fields (aliases, banned phrases, palette) as plain text. */
export const splitList = (text: string, separator: RegExp = /[,\n]/) =>
  text.split(separator).map((item) => item.trim()).filter(Boolean);

export const joinList = (items: string[] | null | undefined, separator = ", ") => (items ?? []).join(separator);

/** A date input's value, or null when empty. */
export const dateOrNull = (value: string) => (value ? value : null);
