import {
  BadgeCheck,
  BookOpen,
  Building2,
  ChartColumn,
  FileImage,
  FileUp,
  Files,
  ImageUp,
  Inbox,
  LayoutDashboard,
  Library,
  ListChecks,
  Map as MapIcon,
  MapPin,
  Palette,
  ScrollText,
  Sigma,
  Users,
  UserPlus,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import type { PosterScope } from "@/api/hooks/usePosters";
import type { Role, Vocabulary } from "@/api/types";

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  queue?: PosterScope;
  attention?: string;
}

export interface NavGroup {
  title?: string;
  items: NavItem[];
}

function rulebook(keeps: (id: string) => boolean, words: Vocabulary): NavGroup {
  const items: (NavItem & { book: string })[] = [
    { book: "brand", to: "/rulebook/brand", label: "Brand kit", icon: Palette },
    { book: "offerings", to: "/rulebook/offerings", label: words.offerings, icon: BookOpen },
    { book: "figures", to: "/rulebook/figures", label: words.figures, icon: Sigma },
    { book: "people", to: "/rulebook/people", label: words.people, icon: Users },
  ];
  return {
    title: "Rulebook",
    items: [...items.filter((i) => keeps(i.book)), { to: "/rulebook/rules", label: "Rules", icon: ListChecks }],
  };
}

const ALL_POSTERS: NavItem = { to: "/posters", label: "All posters", icon: Files };

export function navFor(role: Role, keeps: (id: string) => boolean, words: Vocabulary, gaps: string[] = []): NavGroup[] {
  const book = rulebook(keeps, words);
  if (role === "branch_staff") {
    return [
      { items: [{ to: "/branch", label: "My posters", icon: FileImage }, { to: "/branch/new", label: "New poster", icon: ImageUp }] },
      book,
    ];
  }
  if (role === "regional_manager") {
    return [
      { items: [{ to: "/review", label: "Review queue", icon: Inbox, queue: "regional_review" }, ALL_POSTERS] },
      book,
      { title: "Your region", items: [{ to: "/invite", label: "Invite staff", icon: UserPlus }] },
    ];
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
    book,
    {
      title: "Organisation",
      items: [
        { to: "/organisation/profile", label: "Profile", icon: Building2,
          attention: gaps.length ? `Add your organisation's ${gaps.join(" and ")}` : undefined },
        { to: "/organisation/rulebooks", label: "Rulebooks", icon: Library },
        { to: "/organisation/team", label: "Team", icon: UsersRound },
        { to: "/organisation/regions", label: "Regions", icon: MapIcon },
        { to: "/organisation/branches", label: "Branches", icon: MapPin },
        { to: "/organisation/import", label: "Import data", icon: FileUp },
        { to: "/insights", label: "Insights", icon: ChartColumn },
        { to: "/audit", label: "Audit log", icon: ScrollText },
      ],
    },
  ];
}

export const HOME: Record<Role, string> = { branch_staff: "/branch", regional_manager: "/review", head_office: "/overview" };
