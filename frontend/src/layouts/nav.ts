/** Where each role can go, grouped as the menu shows it, and each role's home page. */
import {
  BadgeCheck,
  BookOpen,
  ChartColumn,
  FileImage,
  FileUp,
  Files,
  ImageUp,
  Inbox,
  LayoutDashboard,
  ListChecks,
  MapPin,
  Palette,
  ScrollText,
  Sigma,
  Users,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import type { PosterScope } from "@/api/hooks/usePosters";
import type { Role } from "@/api/types";

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  /** Show how many posters wait in this queue. */
  queue?: PosterScope;
}

export interface NavGroup {
  title?: string;
  items: NavItem[];
}

const RULEBOOK: NavGroup = {
  title: "Rulebook",
  items: [
    { to: "/rulebook/brand", label: "Brand kit", icon: Palette },
    { to: "/rulebook/courses", label: "Courses and fees", icon: BookOpen },
    { to: "/rulebook/results", label: "Results figures", icon: Sigma },
    { to: "/rulebook/toppers", label: "Toppers register", icon: Users },
    { to: "/rulebook/rules", label: "Rules", icon: ListChecks },
  ],
};

const ALL_POSTERS: NavItem = { to: "/posters", label: "All posters", icon: Files };

export function navFor(role: Role): NavGroup[] {
  if (role === "branch_staff") {
    return [
      { items: [{ to: "/branch", label: "My posters", icon: FileImage }, { to: "/branch/new", label: "New poster", icon: ImageUp }] },
      RULEBOOK,
    ];
  }
  if (role === "regional_manager") {
    return [{ items: [{ to: "/review", label: "Review queue", icon: Inbox, queue: "regional_review" }, ALL_POSTERS] }, RULEBOOK];
  }
  return [
    {
      items: [
        { to: "/overview", label: "Overview", icon: LayoutDashboard },
        { to: "/approvals", label: "Final approvals", icon: BadgeCheck, queue: "final_approval" },
        { to: "/review", label: "Regional review", icon: Inbox, queue: "regional_review" },
        ALL_POSTERS,
      ],
    },
    RULEBOOK,
    {
      title: "Organisation",
      items: [
        { to: "/organisation/team", label: "Team", icon: UsersRound },
        { to: "/organisation/branches", label: "Branches", icon: MapPin },
        { to: "/organisation/import", label: "Import data", icon: FileUp },
        { to: "/insights", label: "Insights", icon: ChartColumn },
        { to: "/audit", label: "Audit log", icon: ScrollText },
      ],
    },
  ];
}

export const HOME: Record<Role, string> = { branch_staff: "/branch", regional_manager: "/review", head_office: "/overview" };
