import { useEffect, useState } from "react";

/** Seconds since this appeared, counting up: an honest progress signal when the real progress is unknown. */
export function Elapsed() {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    const started = Date.now();
    const timer = setInterval(() => setSeconds(Math.round((Date.now() - started) / 1000)), 1000);
    return () => clearInterval(timer);
  }, []);
  return <span className="tabular-nums">{seconds} s</span>;
}
