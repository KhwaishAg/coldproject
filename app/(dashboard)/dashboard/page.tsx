import { getDashboardData } from "@/app/actions";
import { DashboardShell } from "@/components/dashboard/DashboardShell";

export default async function DashboardPage() {
  const data = await getDashboardData();

  return (
    <DashboardShell
      user={data.user}
      profile={data.profile}
      settings={data.settings}
      applications={data.applications}
      stats={data.stats}
    />
  );
}
