"use client";

import { saveUserSettings, updateUserProfile } from "@/app/actions";
import type { Profile, UserSettings } from "@/lib/types";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

const DOMAINS = [
  "Software Engineering",
  "Finance",
  "Data Science",
  "Marketing",
  "Product Management",
  "Design",
  "Consulting",
  "Other",
];

type Props = {
  profile: Profile | null;
  settings: UserSettings | null;
  onRefresh: () => void;
};

export function ProfileSettings({ profile, settings, onRefresh }: Props) {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const [, startTransition] = useTransition();

  const priorities = profile?.priorities ?? {
    techStack: 3,
    mission: 3,
    location: 2,
    companySize: 2,
  };

  async function handleProfileSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);
    const fd = new FormData(e.currentTarget);

    const skillsRaw = (fd.get("skills") as string) ?? "";
    const skills = skillsRaw.split(",").map((s) => s.trim()).filter(Boolean);

    try {
      await updateUserProfile({
        target_domain: (fd.get("target_domain") as string) || null,
        internship_type: (fd.get("internship_type") as string) || null,
        institution: (fd.get("institution") as string) || null,
        year: (fd.get("year") as string) || null,
        role: (fd.get("role") as string) || null,
        skills,
        bio: (fd.get("bio") as string) || null,
        resume_text: (fd.get("resume_text") as string) || null,
        priorities: {
          techStack: Number(fd.get("priority_tech") ?? 3),
          mission: Number(fd.get("priority_mission") ?? 3),
          location: Number(fd.get("priority_location") ?? 2),
          companySize: Number(fd.get("priority_size") ?? 2),
        },
      });
      setMessage("Profile saved.");
      startTransition(() => {
        router.refresh();
        onRefresh();
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleSettingsSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);
    const fd = new FormData(e.currentTarget);

    try {
      await saveUserSettings({
        gemini_api_key: (fd.get("gemini_api_key") as string) || null,
        smtp_host: (fd.get("smtp_host") as string) || null,
        smtp_port: Number(fd.get("smtp_port")) || 587,
        smtp_user: (fd.get("smtp_user") as string) || null,
        smtp_pass: (fd.get("smtp_pass") as string) || null,
        send_batch_size: Number(fd.get("send_batch_size")) || 5,
        daily_send_cap: Number(fd.get("daily_send_cap")) || 25,
        default_email_tone: (fd.get("default_email_tone") as string) || "professional",
      });
      setMessage("Settings saved.");
      startTransition(() => {
        router.refresh();
        onRefresh();
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h2 className="text-xl font-semibold text-gray-800">Profile & Settings</h2>
        <p className="text-sm text-gray-500 mt-1">Update your goals, priorities, and API credentials anytime.</p>
      </div>

      {message && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded text-sm">{message}</div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">{error}</div>
      )}

      <form onSubmit={handleProfileSubmit} className="bg-white rounded-lg shadow-sm p-6 space-y-4">
        <h3 className="font-medium text-gray-800">Profile & Priorities</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Target Domain</label>
            <select name="target_domain" defaultValue={profile?.target_domain ?? ""} className="mt-1 w-full border border-gray-300 rounded-md py-2 px-3">
              <option value="">Select...</option>
              {DOMAINS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Internship Type</label>
            <select name="internship_type" defaultValue={profile?.internship_type ?? ""} className="mt-1 w-full border border-gray-300 rounded-md py-2 px-3">
              <option value="summer">Summer</option>
              <option value="winter">Winter</option>
              <option value="part-time">Part-time</option>
              <option value="research">Research</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Skills (comma-separated)</label>
          <input name="skills" defaultValue={(profile?.skills ?? []).join(", ")} className="mt-1 w-full border border-gray-300 rounded-md py-2 px-3" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Bio</label>
          <textarea name="bio" rows={2} defaultValue={profile?.bio ?? ""} className="mt-1 w-full border border-gray-300 rounded-md py-2 px-3" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Resume Text</label>
          <textarea name="resume_text" rows={4} defaultValue={profile?.resume_text ?? ""} className="mt-1 w-full border border-gray-300 rounded-md py-2 px-3" />
        </div>

        <fieldset className="border border-gray-200 rounded-md p-4">
          <legend className="text-sm font-medium px-2">Priorities (1 = low, 5 = high)</legend>
          <div className="grid grid-cols-2 gap-4 mt-2">
            <PrioritySlider name="priority_tech" label="Tech stack match" defaultValue={priorities.techStack} />
            <PrioritySlider name="priority_mission" label="Mission fit" defaultValue={priorities.mission} />
            <PrioritySlider name="priority_location" label="Location" defaultValue={priorities.location} />
            <PrioritySlider name="priority_size" label="Company size" defaultValue={priorities.companySize} />
          </div>
        </fieldset>

        <input type="hidden" name="institution" value={profile?.institution ?? ""} />
        <input type="hidden" name="year" value={profile?.year ?? ""} />
        <input type="hidden" name="role" value={profile?.role ?? ""} />

        <button type="submit" disabled={loading} className="bg-[#C0534F] text-white px-6 py-2 rounded-md disabled:opacity-50">
          Save Profile
        </button>
      </form>

      <form onSubmit={handleSettingsSubmit} className="bg-white rounded-lg shadow-sm p-6 space-y-4">
        <h3 className="font-medium text-gray-800">API & Email Settings</h3>

        <div>
          <label className="block text-sm font-medium text-gray-700">Gemini API Key</label>
          <input
            name="gemini_api_key"
            type="password"
            placeholder={settings?.gemini_api_key ? "••••••••" : "AIza..."}
            className="mt-1 w-full border border-gray-300 rounded-md py-2 px-3"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">SMTP Host</label>
            <input name="smtp_host" defaultValue={settings?.smtp_host ?? ""} placeholder="smtp.gmail.com" className="mt-1 w-full border border-gray-300 rounded-md py-2 px-3" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">SMTP Port</label>
            <input name="smtp_port" type="number" defaultValue={settings?.smtp_port ?? 587} className="mt-1 w-full border border-gray-300 rounded-md py-2 px-3" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">SMTP User</label>
            <input name="smtp_user" defaultValue={settings?.smtp_user ?? ""} className="mt-1 w-full border border-gray-300 rounded-md py-2 px-3" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">SMTP Password</label>
            <input name="smtp_pass" type="password" placeholder={settings?.smtp_pass ? "••••••••" : ""} className="mt-1 w-full border border-gray-300 rounded-md py-2 px-3" />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Batch send size</label>
            <input name="send_batch_size" type="number" min={1} max={10} defaultValue={settings?.send_batch_size ?? 5} className="mt-1 w-full border border-gray-300 rounded-md py-2 px-3" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Daily send cap</label>
            <input name="daily_send_cap" type="number" min={1} max={50} defaultValue={settings?.daily_send_cap ?? 25} className="mt-1 w-full border border-gray-300 rounded-md py-2 px-3" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Default tone</label>
            <select name="default_email_tone" defaultValue={settings?.default_email_tone ?? "professional"} className="mt-1 w-full border border-gray-300 rounded-md py-2 px-3">
              <option value="professional">Professional</option>
              <option value="enthusiastic">Enthusiastic</option>
              <option value="concise">Concise</option>
            </select>
          </div>
        </div>

        <button type="submit" disabled={loading} className="bg-[#4A1D1A] text-white px-6 py-2 rounded-md disabled:opacity-50">
          Save Settings
        </button>
      </form>
    </div>
  );
}

function PrioritySlider({
  name,
  label,
  defaultValue,
}: {
  name: string;
  label: string;
  defaultValue: number;
}) {
  return (
    <div>
      <label className="block text-xs text-gray-600">{label}</label>
      <input
        type="range"
        name={name}
        min={1}
        max={5}
        defaultValue={defaultValue}
        className="w-full mt-1"
      />
    </div>
  );
}
