import { useOrganisation } from "@/api/hooks/useOrganisation";
import { OverviewStats } from "@/components/overview/OverviewStats";
import { RecentActivity } from "@/components/overview/RecentActivity";
import { SetupChecklist } from "@/components/overview/SetupChecklist";
import { PageHeader } from "@/components/ui/PageHeader";

export function OverviewPage() {
  const org = useOrganisation().data;
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Overview" description={org ? `What needs attention at ${org.name}, and what just happened.` : undefined} />
      <SetupChecklist />
      <OverviewStats />
      <RecentActivity />
    </div>
  );
}
