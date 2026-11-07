/** Where each role can go, and each role's home page. */
import {
  BadgeCheck,
  BookOpen,
  ChartColumn,
  FileImage,
  ImageUp,
  Inbox,
  ListChecks,
  Palette,
  ScrollText,
  Sigma,
  Users,
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

export const WORK: Record<Role, NavItem[]> = {
  branch_staff: [
    { to: "/branch", label: "My posters", icon: FileImage },
    { to: "/branch/new", label: "New poster", icon: ImageUp },
  ],
  regional_manager: [{ to: "/review", label: "Review queue", icon: Inbox, queue: "regional_review" }],
  head_office: [
    { to: "/approvals", label: "Final approvals", icon: BadgeCheck, queue: "final_approval" },
    { to: "/review", label: "Regional review", icon: Inbox, queue: "regional_review" },
    { to: "/insights", label: "Insights", icon: ChartColumn },
    { to: "/audit", label: "Audit log", icon: ScrollText },
  ],
};

export const RULEBOOK: NavItem[] = [
  { to: "/rulebook/brand", label: "Brand kit", icon: Palette },
  { to: "/rulebook/courses", label: "Courses and fees", icon: BookOpen },
  { to: "/rulebook/results", label: "Results figures", icon: Sigma },
  { to: "/rulebook/toppers", label: "Toppers register", icon: Users },
  { to: "/rulebook/rules", label: "Rules", icon: ListChecks },
];

export const HOME: Record<Role, string> = { branch_staff: "/branch", regional_manager: "/review", head_office: "/approvals" };
