/** index.html sets data-theme before the first paint (no flash); this keeps it in step after. */
import { useSyncExternalStore } from "react";
import { swapTheme } from "./motion";

export type ThemeChoice = "light" | "dark" | "system";
export type Theme = "light" | "dark";

export const THEME_LABEL: Record<ThemeChoice, string> = { light: "Light", dark: "Midnight", system: "Match device" };

const KEY = "pramaan-theme";
const dark = typeof window === "undefined" ? null : window.matchMedia("(prefers-color-scheme: dark)");
const listeners = new Set<() => void>();

function saved(): ThemeChoice {
  try {
    const value = localStorage.getItem(KEY);
    return value === "light" || value === "dark" ? value : "system";
  } catch {
    return "system";
  }
}

let choice: ThemeChoice = saved();
const resolve = (c: ThemeChoice): Theme => (c === "system" ? (dark?.matches ? "dark" : "light") : c);

function apply() {
  document.documentElement.dataset.theme = resolve(choice);
  listeners.forEach((listener) => listener());
}

dark?.addEventListener("change", () => {
  if (choice === "system") swapTheme(apply);
});

export function setTheme(next: ThemeChoice) {
  choice = next;
  try {
    if (next === "system") localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, next);
  } catch {
    // Private windows can refuse storage; the theme still changes for this visit.
  }
  swapTheme(apply);
}

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export function useTheme() {
  const current = useSyncExternalStore(subscribe, () => choice);
  const theme = useSyncExternalStore(subscribe, () => resolve(choice));
  return { choice: current, theme, setTheme };
}
