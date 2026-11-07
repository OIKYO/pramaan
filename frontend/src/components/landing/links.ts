/** Where the product page's menus and footer point. Section ids are on the landing components. */
import {
  BadgeCheck,
  FileUp,
  Library,
  ListChecks,
  Network,
  ScrollText,
  Workflow,
  type LucideIcon,
} from "lucide-react";

export interface LandingLink {
  to: string;
  label: string;
  text: string;
  icon: LucideIcon;
}

export const REPO = "https://github.com/OIKYO/pramaan";

export const PRODUCT: LandingLink[] = [
  { to: "/#how", label: "How it works", text: "Upload, read, check, review, approve", icon: Workflow },
  { to: "/#why", label: "The checks", text: "27 checks, in rulebooks you choose", icon: ListChecks },
  { to: "/#why", label: "Rulebooks", text: "Set up for your industry, changed any time", icon: Library },
  { to: "/#branches", label: "Reviews", text: "Branch, region, then head office", icon: BadgeCheck },
];

export const ENTERPRISE: LandingLink[] = [
  { to: "/#branches", label: "Many branches", text: "Each branch sees only its own posters", icon: Network },
  { to: "/#branches", label: "Two-step approval", text: "Regional review, then head office", icon: BadgeCheck },
  { to: "/#start", label: "Import your data", text: "Branches, prices, people and team from CSV", icon: FileUp },
  { to: "/#why", label: "Audit trail", text: "Every decision and AI call is logged", icon: ScrollText },
];

export const LEGAL = [
  { to: "/legal/privacy", label: "Privacy policy" },
  { to: "/legal/terms", label: "Terms" },
  { to: "/legal/cookies", label: "Cookies" },
];
