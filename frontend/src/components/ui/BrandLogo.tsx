import { useId } from "react";
import { cn } from "@/lib/utils";
import {
  CUT_BLUE,
  CUT_GOLD,
  LOGO_VIEW_BOX,
  MARK_BLUE,
  MARK_GOLD,
  MARK_STROKE_WIDTH,
  MARK_VIEW_BOX,
  TAGLINE,
  WORDMARK,
} from "./BrandLogo.paths";

interface BrandLogoProps {
  variant?: "full" | "mark";
  className?: string;
}

export function BrandLogo({ variant = "full", className }: BrandLogoProps) {
  // Clip-path ids must be unique on the page, and several logos can be on screen at once.
  const id = `pramaan-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const full = variant === "full";
  return (
    <svg
      viewBox={full ? LOGO_VIEW_BOX : MARK_VIEW_BOX}
      role="img"
      aria-label="Pramaan"
      className={cn("block h-auto", className)}
    >
      <defs>
        <clipPath id={`${id}-blue`}>
          <path d={CUT_BLUE} />
        </clipPath>
        <clipPath id={`${id}-gold`}>
          <path d={CUT_GOLD} />
        </clipPath>
      </defs>
      <g fill="none" strokeWidth={MARK_STROKE_WIDTH} strokeLinejoin="miter" strokeLinecap="butt">
        <path className="stroke-brand-blue" d={MARK_BLUE[0]} clipPath={`url(#${id}-blue)`} />
        <path className="stroke-brand-blue" d={MARK_BLUE[1]} />
        <path className="stroke-brand-gold" d={MARK_GOLD[0]} />
        <path className="stroke-brand-gold" d={MARK_GOLD[1]} clipPath={`url(#${id}-gold)`} />
      </g>
      {full && (
        <>
          <path fill="currentColor" d={WORDMARK} />
          <path className="fill-muted-text" d={TAGLINE} />
        </>
      )}
    </svg>
  );
}
