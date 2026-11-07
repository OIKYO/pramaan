import { Cookie } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { slideUp } from "@/lib/motion";
import { Button } from "./button";

const KEY = "pramaan-cookie-notice";

function seen(): boolean {
  try {
    return localStorage.getItem(KEY) === "seen";
  } catch {
    return false;
  }
}

/** A small card in the bottom-left corner, once per browser, saying what Pramaan keeps in the browser.
 * There's nothing to refuse: only what signing in and the theme need, and no tracking. */
export function CookieNotice() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (seen()) return;
    const timer = setTimeout(() => setOpen(true), 900);
    return () => clearTimeout(timer);
  }, []);
  const close = () => {
    setOpen(false);
    try {
      localStorage.setItem(KEY, "seen");
    } catch {
      // Private windows can refuse storage; the notice will show again next visit.
    }
  };
  return (
    <AnimatePresence>
      {open && (
        <motion.aside
          {...slideUp}
          aria-label="Cookies"
          className="fixed inset-x-3 bottom-3 z-50 flex flex-col gap-3 rounded-lg border border-line bg-surface p-4 text-sm shadow-overlay sm:inset-x-auto sm:bottom-5 sm:left-5 sm:max-w-sm"
        >
          <div className="flex items-start gap-3">
            <Cookie className="mt-0.5 size-4 shrink-0 text-muted-text" aria-hidden />
            <p className="text-pretty text-ink">
              Pramaan keeps only what it needs in your browser: your sign-in and your theme. No tracking, no ads.
            </p>
          </div>
          <div className="flex items-center justify-end gap-2">
            <Button variant="ghost" size="sm" asChild>
              <a href="/legal/cookies">What we keep</a>
            </Button>
            <Button size="sm" onClick={close}>Got it</Button>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
