import type { Session } from "next-auth";
import { createSupabaseAdmin } from "./supabase";
import type {
  Application,
  ApplicationStatus,
  Contact,
  DashboardStats,
  OutreachEmail,
  Profile,
  User,
  UserSettings,
} from "./types";

export async function getOrCreateUser(session: Session): Promise<User> {
  const email = session.user?.email;
  if (!email) throw new Error("Not authenticated");

  const supabase = createSupabaseAdmin();

  const { data: existing } = await supabase
    .from("users")
    .select("*")
    .eq("email", email)
    .maybeSingle();

  if (existing) return existing as User;

  const { data: created, error } = await supabase
    .from("users")
    .insert({
      email,
      name: session.user?.name ?? null,
      image: session.user?.image ?? null,
    })
    .select()
    .single();

  if (error) throw error;

  await supabase.from("profiles").insert({ user_id: created.id });
  await supabase.from("user_settings").insert({ user_id: created.id });

  return created as User;
}

export async function getProfile(userId: string): Promise<Profile | null> {
  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return data as Profile | null;
}

export async function updateProfile(
  userId: string,
  updates: Partial<Profile>
): Promise<Profile> {
  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from("profiles")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("user_id", userId)
    .select()
    .single();
  if (error) throw error;
  return data as Profile;
}

export async function getSettings(userId: string): Promise<UserSettings | null> {
  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from("user_settings")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return data as UserSettings | null;
}

export async function updateSettings(
  userId: string,
  updates: Partial<UserSettings>
): Promise<UserSettings> {
  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from("user_settings")
    .update(updates)
    .eq("user_id", userId)
    .select()
    .single();
  if (error) throw error;
  return data as UserSettings;
}

export async function getApplications(userId: string): Promise<Application[]> {
  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from("applications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Application[];
}

export async function getApplication(
  userId: string,
  applicationId: string
): Promise<Application | null> {
  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from("applications")
    .select("*")
    .eq("id", applicationId)
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return data as Application | null;
}

export async function createApplication(
  userId: string,
  input: {
    company_name: string;
    website_url?: string | null;
    linkedin_url?: string | null;
    scraped_text?: string | null;
  }
): Promise<Application> {
  const supabase = createSupabaseAdmin();
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("applications")
    .insert({
      user_id: userId,
      company_name: input.company_name,
      website_url: input.website_url ?? null,
      linkedin_url: input.linkedin_url ?? null,
      scraped_text: input.scraped_text ?? null,
      status: "discovered",
      status_history: [{ status: "discovered", at: now }],
    })
    .select()
    .single();
  if (error) throw error;
  return data as Application;
}

export async function updateApplication(
  userId: string,
  applicationId: string,
  updates: Partial<Application>
): Promise<Application> {
  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from("applications")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", applicationId)
    .eq("user_id", userId)
    .select()
    .single();
  if (error) throw error;
  return data as Application;
}

export async function updateApplicationStatus(
  userId: string,
  applicationId: string,
  status: ApplicationStatus,
  note?: string
): Promise<Application> {
  const app = await getApplication(userId, applicationId);
  if (!app) throw new Error("Application not found");

  const history = [
    ...app.status_history,
    { status, at: new Date().toISOString(), note },
  ];

  return updateApplication(userId, applicationId, { status, status_history: history });
}

export async function getContacts(applicationId: string): Promise<Contact[]> {
  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from("contacts")
    .select("*")
    .eq("application_id", applicationId);
  if (error) throw error;
  return (data ?? []) as Contact[];
}

export async function upsertContacts(
  applicationId: string,
  contacts: Omit<Contact, "id" | "application_id">[]
): Promise<Contact[]> {
  const supabase = createSupabaseAdmin();
  await supabase.from("contacts").delete().eq("application_id", applicationId);

  if (contacts.length === 0) return [];

  const rows = contacts.map((c) => ({ ...c, application_id: applicationId }));
  const { data, error } = await supabase.from("contacts").insert(rows).select();
  if (error) throw error;
  return (data ?? []) as Contact[];
}

export async function getEmails(applicationId: string): Promise<OutreachEmail[]> {
  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from("emails")
    .select("*")
    .eq("application_id", applicationId)
    .order("sent_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as OutreachEmail[];
}

export async function saveEmailDraft(
  applicationId: string,
  subject: string,
  body: string,
  recipient: string | null,
  contactId?: string | null
): Promise<OutreachEmail> {
  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from("emails")
    .insert({
      application_id: applicationId,
      contact_id: contactId ?? null,
      subject,
      body,
      recipient,
      is_draft: true,
    })
    .select()
    .single();
  if (error) throw error;
  return data as OutreachEmail;
}

export async function markEmailSent(
  emailId: string,
  applicationId: string,
  userId: string
): Promise<void> {
  const supabase = createSupabaseAdmin();
  const now = new Date().toISOString();

  await supabase
    .from("emails")
    .update({ is_draft: false, sent_at: now })
    .eq("id", emailId);

  await updateApplicationStatus(userId, applicationId, "sent", "Email sent via SMTP");
}

export async function countEmailsSentToday(userId: string): Promise<number> {
  const supabase = createSupabaseAdmin();
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const { data: apps } = await supabase
    .from("applications")
    .select("id")
    .eq("user_id", userId);

  if (!apps?.length) return 0;

  const appIds = apps.map((a) => a.id);
  const { count, error } = await supabase
    .from("emails")
    .select("*", { count: "exact", head: true })
    .in("application_id", appIds)
    .eq("is_draft", false)
    .gte("sent_at", startOfDay.toISOString());

  if (error) throw error;
  return count ?? 0;
}

export async function getDashboardStats(userId: string): Promise<DashboardStats> {
  const apps = await getApplications(userId);
  const emailsSent = apps.filter((a) =>
    ["sent", "replied", "interview", "offer", "rejected"].includes(a.status)
  ).length;
  const replied = apps.filter((a) =>
    ["replied", "interview", "offer"].includes(a.status)
  ).length;
  const interviews = apps.filter((a) => ["interview", "offer"].includes(a.status)).length;
  const offers = apps.filter((a) => a.status === "offer").length;

  return {
    totalApplications: apps.length,
    emailsSent,
    replied,
    interviews,
    offers,
    responseRate: emailsSent > 0 ? Math.round((replied / emailsSent) * 100) : 0,
  };
}
