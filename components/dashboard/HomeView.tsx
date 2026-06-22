"use client";

import type { Application, DashboardStats } from "@/lib/types";

type Props = {
  stats: DashboardStats;
  applications: Application[];
  userName: string;
};

export function HomeView({ stats, applications, userName }: Props) {
  const recent = applications.slice(0, 5);

  return (
    <div className="flex flex-col gap-8 max-w-5xl">
      <h2 className="text-xl font-medium text-gray-800">Hello, {userName}</h2>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Applications" value={stats.totalApplications} />
        <StatCard label="Emails Sent" value={stats.emailsSent} />
        <StatCard label="Responses" value={stats.replied} />
        <StatCard label="Response Rate" value={`${stats.responseRate}%`} />
      </div>

      <div className="w-full bg-[#4A1D1A] rounded-lg shadow-sm p-8 flex flex-col md:flex-row gap-8">
        <div className="flex-1">
          <h3 className="text-white/70 text-sm mb-4">Pipeline</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-white text-3xl font-bold">{stats.interviews}</p>
              <p className="text-white/70 text-xs mt-1">Interviews</p>
            </div>
            <div>
              <p className="text-white text-3xl font-bold">{stats.offers}</p>
              <p className="text-white/70 text-xs mt-1">Offers</p>
            </div>
          </div>
        </div>
        <div className="flex-[2] border-t md:border-t-0 md:border-l border-white/20 pt-6 md:pt-0 md:pl-8">
          <h3 className="text-white/70 text-sm mb-4">Recent Activity</h3>
          {recent.length === 0 ? (
            <p className="text-white/50 text-sm">No companies yet. Add one from Company Overview.</p>
          ) : (
            <ul className="space-y-2">
              {recent.map((app) => (
                <li key={app.id} className="text-white text-sm flex justify-between">
                  <span>{app.company_name}</span>
                  <span className="text-white/50 capitalize">{app.status.replace("_", " ")}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-white rounded-lg p-4 shadow-sm">
      <p className="text-2xl font-bold text-gray-800">{value}</p>
      <p className="text-xs text-gray-500 mt-1">{label}</p>
    </div>
  );
}
