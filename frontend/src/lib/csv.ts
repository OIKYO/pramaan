/** Writing CSV files for people to download: rulebook exports, import templates, temporary passwords. */

const cell = (value: unknown): string => {
  const text = Array.isArray(value) ? value.join("; ") : value === null || value === undefined ? "" : String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

/** Rows as CSV, with the given columns in order. */
export function toCsv<T extends object>(rows: T[], columns: (keyof T & string)[]): string {
  const lines = [columns.join(","), ...rows.map((row) => columns.map((c) => cell(row[c])).join(","))];
  return lines.join("\n") + "\n";
}

/** Hand the browser a file to save. */
export function download(filename: string, text: string, type = "text/csv;charset=utf-8") {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
