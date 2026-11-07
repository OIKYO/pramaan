import { Building2, ChevronsUpDown, LogOut, Monitor, Moon, Palette, Settings, Sun } from "lucide-react";
import { useNavigate } from "react-router";
import { useProfileGaps } from "@/api/hooks/useOrganisation";
import { useProfile, useSession } from "@/api/hooks/useSession";
import { Avatar } from "@/components/ui/Avatar";
import { Menu } from "@/components/ui/Menu";
import { ROLE_LABEL } from "@/lib/labels";
import { THEME_LABEL, useTheme } from "@/lib/theme";

/** Who is signed in. Opens settings, the organisation, the theme and sign out. */
export function AccountMenu({ side = "top" }: { side?: "top" | "bottom" }) {
  const profile = useProfile();
  const { signOut } = useSession();
  const { choice, setTheme } = useTheme();
  const navigate = useNavigate();
  const gaps = useProfileGaps();
  const headOffice = profile.role === "head_office";
  return (
    <Menu
      side={side}
      align="start"
      label={profile.email ?? undefined}
      trigger={
        <button type="button" className="flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left hover:bg-surface-sunken">
          <Avatar name={profile.full_name} />
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-sm font-medium text-ink-strong">{profile.full_name}</span>
            <span className="truncate text-xs text-muted-text">{ROLE_LABEL[profile.role]}</span>
          </span>
          <ChevronsUpDown className="size-4 text-muted-text" aria-hidden />
        </button>
      }
      items={[
        { label: "Settings", icon: Settings, onSelect: () => navigate("/settings") },
        ...(headOffice
          ? [{ label: "Organisation", icon: Building2, onSelect: () => navigate("/organisation/profile"),
               attention: gaps.length ? `Add your organisation's ${gaps.join(" and ")}` : undefined }]
          : []),
        {
          label: "Theme",
          icon: Palette,
          value: THEME_LABEL[choice],
          items: [
            { label: THEME_LABEL.light, icon: Sun, checked: choice === "light", onSelect: () => setTheme("light") },
            { label: THEME_LABEL.dark, icon: Moon, checked: choice === "dark", onSelect: () => setTheme("dark") },
            { label: THEME_LABEL.system, icon: Monitor, checked: choice === "system", onSelect: () => setTheme("system") },
          ],
        },
        "separator",
        { label: "Sign out", icon: LogOut, onSelect: () => void signOut() },
      ]}
    />
  );
}
