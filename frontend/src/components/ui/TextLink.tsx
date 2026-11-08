import type { ReactNode } from "react";
import { Link } from "react-router";

export function TextLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link to={to} className="font-medium text-ink-strong underline decoration-line-strong underline-offset-4 hover:decoration-ink-strong">
      {children}
    </Link>
  );
}
