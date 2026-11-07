/**
 * Preferences kept in this browser, beside the theme (lib/theme.ts). For now: fewer animations,
 * for people who want them off here without changing their whole device.
 */
import { useSyncExternalStore } from "react";

const KEY = "pramaan-reduce-motion";
const listeners = new Set<() => void>();

function read(): boolean {
  try {
    return localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

let reduce = read();

export function reduceMotionHere(): boolean {
  return reduce;
}

export function setReduceMotion(next: boolean) {
  reduce = next;
  try {
    if (next) localStorage.setItem(KEY, "1");
    else localStorage.removeItem(KEY);
  } catch {
    // Private windows can refuse storage; the setting still holds for this visit.
  }
  listeners.forEach((listener) => listener());
}

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export function useReduceMotion() {
  return [useSyncExternalStore(subscribe, () => reduce), setReduceMotion] as const;
}
