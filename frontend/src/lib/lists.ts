export const splitList = (text: string, separator: RegExp = /[,\n]/) =>
  text.split(separator).map((item) => item.trim()).filter(Boolean);

export const joinList = (items: string[] | null | undefined, separator = ", ") => (items ?? []).join(separator);

export const dateOrNull = (value: string) => (value ? value : null);
