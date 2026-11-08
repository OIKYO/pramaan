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
  { to: "/product#how-a-poster-goes-through-pramaan", label: "How it works", text: "Upload, read, check, review, approve", icon: Workflow },
  { to: "/product#rulebooks-that-fit-your-organisation", label: "The checks", text: "Rules applied to every relevant poster", icon: ListChecks },
  { to: "/product#built-around-your-industry", label: "Rulebooks", text: "Set the rules for your organisation", icon: Library },
  { to: "/enterprise#three-roles-one-review-process", label: "Reviews", text: "Branch, regional, then head office", icon: BadgeCheck },
];

export const ENTERPRISE: LandingLink[] = [
  { to: "/enterprise#data-kept-within-your-organisation", label: "Many branches", text: "Each branch sees only its own posters", icon: Network },
  { to: "/enterprise#three-roles-one-review-process", label: "Two-step review", text: "Regional review, then head office", icon: BadgeCheck },
  { to: "/enterprise#import-your-data-from-csv", label: "Import data", text: "Import branches, prices, people and teams from CSV", icon: FileUp },
  { to: "/enterprise#data-kept-within-your-organisation", label: "Audit trail", text: "Every decision, change and AI call is logged", icon: ScrollText },
];

export const COMPANY = [
  { to: "/about", label: "About Pramaan" },
  { to: "/about#the-pilot", label: "The pilot" },
  { to: "/about#the-team", label: "The team" },
];

export const LEGAL = [
  { to: "/legal/privacy", label: "Privacy policy" },
  { to: "/legal/terms", label: "Terms of use" },
  { to: "/legal/cookies", label: "Cookies" },
];
