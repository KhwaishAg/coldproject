"use client";

import type { Application, DashboardStats } from "@/lib/types";

type Props = {
  stats: DashboardStats;
  applications: Application[];
};

const STATUS_LABELS: Record<string, string> = {
  discovered: "Discovered",
  draft_ready: "Draft Ready",
  sent: "Sent",
  replied: "Replied",
  interview: "Interview",
  offer: "Offer",
  rejected: "Rejected",
};

export function StatisticsView({ stats, applications }: Props) {
  const byStatus = applications.reduce(
    (acc, app) => {
      acc[app.status] = (acc[app.status] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const maxCount = Math.max(...Object.values(byStatus), 1);

  return (
    <div className="max-w-5xl space-y-8">
      <div>
        <h2 className="text-xl font-semibold text-gray-800">Statistics</h2>
        <p className="text-sm text-gray-500 mt-1">Track your outreach performance over time.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <MetricCard label="Total Applications" value={stats.totalApplications} />
        <MetricCard label="Emails Sent" value={stats.emailsSent} />
        <MetricCard label="Response Rate" value={`${stats.responseRate}%`} />
        <MetricCard label="Replies" value={stats.replied} />
        <MetricCard label="Interviews" value={stats.interviews} />
        <MetricCard label="Offers" value={stats.offers} />
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="font-medium text-gray-800 mb-6">Pipeline Breakdown</h3>
        <div className="space-y-4">
          {Object.entries(STATUS_LABELS).map(([status, label]) => {
            const count = byStatus[status] ?? 0;
            const width = (count / maxCount) * 100;
            return (
              <div key={status}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">{label}</span>
                  <span className="font-medium">{count}</span>
                </div>
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#C0534F] rounded-full transition-all"
                    style={{ width: `${width}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {applications.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="font-medium text-gray-800 mb-4">Top Matches</h3>
          <ul className="space-y-2">
            {[...applications]
              .filter((a) => a.alignment_score != null)
              .sort((a, b) => (b.alignment_score ?? 0) - (a.alignment_score ?? 0))
              .slice(0, 5)
              .map((app) => (
                <li key={app.id} className="flex justify-between text-sm">
                  <span>{app.company_name}</span>
                  <span className="font-medium text-[#C0534F]">{app.alignment_score}%</span>
                </li>
              ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-white rounded-lg p-5 shadow-sm">
      <p className="text-2xl font-bold text-gray-800">{value}</p>
      <p className="text-xs text-gray-500 mt-1">{label}</p>
    </div>
  );
}
