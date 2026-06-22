"use client";

import type { Application, DashboardStats, Profile, User, UserSettings } from "@/lib/types";
import {
  BarChart3,
  Building2,
  FileCheck,
  Home,
  LogOut,
  Mail,
  UserCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { signOutAction } from "@/app/actions";
import { CompanyOverview } from "./CompanyOverview";
import { GenerateEmail } from "./GenerateEmail";
import { HomeView } from "./HomeView";
import { KanbanBoard } from "./KanbanBoard";
import { ProfileSettings } from "./ProfileSettings";
import { StatisticsView } from "./StatisticsView";

type Props = {
  user: User;
  profile: Profile | null;
  settings: UserSettings | null;
  applications: Application[];
  stats: DashboardStats;
};

export function DashboardShell({
  user,
  profile,
  settings,
  applications: initialApps,
  stats: initialStats,
}: Props) {
  const [activeTab, setActiveTab] = useState("home");
  const [applications, setApplications] = useState(initialApps);
  const [stats, setStats] = useState(initialStats);
  const router = useRouter();
  const [, startTransition] = useTransition();

  useEffect(() => {
    setApplications(initialApps);
    setStats(initialStats);
  }, [initialApps, initialStats]);

  const refresh = () => {
    startTransition(() => router.refresh());
  };

  const menuItems = [
    { id: "home", label: "Home", icon: <Home size={20} /> },
    { id: "overview", label: "Company Overview", icon: <Building2 size={20} /> },
    { id: "generate", label: "Generate Email", icon: <Mail size={20} /> },
    { id: "status", label: "Application Status", icon: <FileCheck size={20} /> },
    { id: "stats", label: "Statistics", icon: <BarChart3 size={20} /> },
  ];

  return (
    <div className="flex h-screen bg-[#E5E5E5] font-sans">
      <aside className="w-64 bg-[#C0534F] text-white flex flex-col justify-between shrink-0">
        <div className="mt-16">
          <nav className="flex flex-col space-y-1">
            {menuItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center w-full gap-4 px-6 py-4 transition-colors ${
                  activeTab === item.id
                    ? "border-y border-white/40 bg-white/10 font-semibold"
                    : "border-y border-transparent hover:bg-white/5"
                }`}
              >
                {item.icon}
                <span className="text-sm">{item.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="p-4">
          <form action={signOutAction}>
            <button
              type="submit"
              className="flex items-center gap-3 px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded transition-colors w-full"
            >
              <LogOut size={20} />
              <span className="text-sm font-medium">Logout</span>
            </button>
          </form>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-20 bg-[#C4B2B0] flex items-center justify-between px-8 shrink-0">
          <div className="bg-[#E5E5E5] px-6 py-2 text-sm font-bold text-gray-800 tracking-wide">
            OutreachAI
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-700 hidden sm:block">
              {user.name ?? user.email}
            </span>
            <button
              type="button"
              onClick={() => setActiveTab("profile")}
              className={`h-10 w-10 rounded-full flex items-center justify-center transition-colors ${
                activeTab === "profile"
                  ? "bg-[#C0534F] text-white"
                  : "bg-[#E5E5E5] text-gray-400 hover:text-gray-600"
              }`}
              title="Profile & Settings"
            >
              <UserCircle size={28} />
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 md:p-10">
          {activeTab === "home" && (
            <HomeView stats={stats} applications={applications} userName={user.name ?? "there"} />
          )}
          {activeTab === "overview" && (
            <CompanyOverview applications={applications} onRefresh={refresh} />
          )}
          {activeTab === "generate" && (
            <GenerateEmail
              applications={applications}
              settings={settings}
              onRefresh={refresh}
            />
          )}
          {activeTab === "status" && (
            <KanbanBoard applications={applications} onRefresh={refresh} />
          )}
          {activeTab === "stats" && (
            <StatisticsView stats={stats} applications={applications} />
          )}
          {activeTab === "profile" && (
            <ProfileSettings profile={profile} settings={settings} onRefresh={refresh} />
          )}
        </main>
      </div>
    </div>
  );
}
