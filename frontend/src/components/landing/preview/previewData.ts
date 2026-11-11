/** Findings for test-posters/03-wrong-rank.png (fictional). Boxes are top, left, height and width in % of the poster. */
import type { Severity } from "@/api/types";

export interface PreviewFinding {
  number: number;
  severity: Severity;
  rule: string;
  message: string;
  fix: string;
  box: { top: number; left: number; height: number; width: number };
}

export const FINDINGS: PreviewFinding[] = [
  {
    number: 1,
    severity: "block",
    rule: "CCPA-04 · Rank matches the register",
    message: "Shows AIR 37 for Riya Sen; the register says AIR 73.",
    fix: "Change the rank to AIR 73.",
    box: { top: 32.9, left: 30.4, height: 1.7, width: 3.1 },
  },
  {
    number: 2,
    severity: "needs_human",
    rule: "READ-02 · Key numbers read twice",
    message: "The two readers disagree about this phone number.",
    fix: "A reviewer confirms the right number before anyone can approve.",
    box: { top: 53.6, left: 28.6, height: 1.7, width: 23.8 },
  },
];

export const PASSED = [
  "No banned claims",
  "Everyone shown has consent on file",
  "Consent is valid",
  "Required details next to each topper",
  "Figures match approved figures",
  "Offerings named as approved",
  "Prices match approved prices",
  "Branch contact details",
  "No expired prices or figures",
  "Logo present",
  "Colours within palette",
  "Registered name and helpline present",
  "Tone of voice",
  "Text contrast (4.5:1, large text 3:1)",
  "Alt text on social posts",
  "Disguised guarantees",
  "Dates are real dates",
  "Day matches the date",
  "No deadlines that have passed",
  "Offers say how long they last",
  "Offers point to their conditions",
  "Discounts add up",
  "No stock-photo watermarks",
  "Other organisations are approved partners",
  "Required disclaimers are present",
  "No claims your industry forbids",
];
