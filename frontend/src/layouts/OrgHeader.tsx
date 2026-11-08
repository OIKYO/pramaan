import { Link } from "react-router";
import { useOrganisation } from "@/api/hooks/useOrganisation";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { Skeleton } from "@/components/ui/skeleton";

export function OrgHeader() {
  const org = useOrganisation();
  return (
    <Link to="/" className="flex min-w-0 items-center gap-2.5 rounded-md px-2 py-1.5 hover:bg-surface-sunken" aria-label="Go to your home page">
      <BrandLogo variant="mark" className="w-7 shrink-0" />
      <span className="flex min-w-0 flex-col">
        {org.data ? (
          <span className="truncate text-sm font-semibold text-ink-strong">{org.data.name}</span>
        ) : (
          <Skeleton className="h-4 w-28" />
        )}
        <span className="text-xs text-muted-text">Pramaan</span>
      </span>
    </Link>
  );
}
