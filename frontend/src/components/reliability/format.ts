export const percent = (value: number | null, digits = 0) =>
  value === null ? "–" : new Intl.NumberFormat("en-IN", { style: "percent", maximumFractionDigits: digits }).format(value);

export const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

export function readerName(model: string): string {
  if (model.startsWith("groq:")) return `${model.slice(5)} (Groq backup)`;
  if (model === "fixture" || model.startsWith("fixture:")) return "the perfect test reader";
  return model;
}
