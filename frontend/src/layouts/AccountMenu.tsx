import { ChevronsUpDown, LogOut, Monitor, Moon, Settings, Sun } from "lucide-react";
import { useNavigate } from "react-router";
import { useProfile, useSession } from "@/api/hooks/useSession";
import { Avatar } from "@/components/ui/Avatar";
import { Menu } from "@/components/ui/Menu";
import { ROLE_LABEL } from "@/lib/labels";
import { useTheme } from "@/lib/theme";

/** Who is signed in. Opens settings, the theme choice and sign out. */
export function AccountMenu({ side = "top" }: { side?: "top" | "bottom" }) {
  const profile = useProfile();
  const { signOut } = useSession();
  const { choice, setTheme } = useTheme();
  const navigate = useNavigate();
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
        "separator",
        { label: "Light theme", icon: Sun, checked: choice === "light", onSelect: () => setTheme("light") },
        { label: "Midnight theme", icon: Moon, checked: choice === "dark", onSelect: () => setTheme("dark") },
        { label: "Match this device", icon: Monitor, checked: choice === "system", onSelect: () => setTheme("system") },
        "separator",
        { label: "Sign out", icon: LogOut, onSelect: () => void signOut() },
      ]}
    />
  );
}
