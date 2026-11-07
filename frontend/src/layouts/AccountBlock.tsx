import { LogOut } from "lucide-react";
import { useProfile, useSession } from "@/api/hooks/useSession";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { ROLE_LABEL } from "@/lib/labels";

/** Who is signed in, the theme switch, and sign out. At the foot of the menu. */
export function AccountBlock() {
  const profile = useProfile();
  const { signOut } = useSession();
  return (
    <div className="flex flex-col gap-3 border-t border-line pt-4">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0 text-sm">
          <p className="truncate font-semibold text-ink-strong">{profile.full_name}</p>
          <p className="text-xs text-muted-text">{ROLE_LABEL[profile.role]}</p>
        </div>
        <Button variant="ghost" size="icon-sm" onClick={() => void signOut()} aria-label="Sign out" title="Sign out">
          <LogOut />
        </Button>
      </div>
      <ThemeToggle />
    </div>
  );
}
