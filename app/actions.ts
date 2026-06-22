"use server";

import { auth, signOut } from "@/auth";
import {
  countEmailsSentToday,
  createApplication,
  getApplication,
  getApplications,
  getContacts,
  getDashboardStats,
  getEmails,
  getOrCreateUser,
  getProfile,
  getSettings,
  markEmailSent,
  saveEmailDraft,
  updateApplication,
  updateApplicationStatus,
  updateProfile,
  updateSettings,
  upsertContacts,
} from "@/lib/db";
import { delay, sendEmail } from "@/lib/email";
import { analyzeAlignment, generateOutreachEmail } from "@/lib/gemini";
import { extractContactsFromText } from "@/lib/contacts";
import { discoverCompany, scrapeMultiplePages } from "@/lib/search";
import type { ApplicationStatus, Profile, UserSettings } from "@/lib/types";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function signOutAction() {
  await signOut({ redirectTo: "/login" });
}

async function requireUser() {
  const session = await auth();
  if (!session?.user?.email) throw new Error("Not authenticated");
  const user = await getOrCreateUser(session);
  return { session, user };
}

export async function getDashboardData() {
  const { user } = await requireUser();
  const [profile, settings, applications, stats] = await Promise.all([
    getProfile(user.id),
    getSettings(user.id),
    getApplications(user.id),
    getDashboardStats(user.id),
  ]);
  return { user, profile, settings, applications, stats };
}

export async function completeOnboarding(formData: FormData) {
  const { user } = await requireUser();

  const skillsRaw = (formData.get("skills") as string) ?? "";
  const skills = skillsRaw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  await updateProfile(user.id, {
    target_domain: (formData.get("target_domain") as string) || null,
    internship_type: (formData.get("internship_type") as string) || null,
    institution: (formData.get("institution") as string) || null,
    year: (formData.get("year") as string) || null,
    role: (formData.get("role") as string) || null,
    skills,
    bio: (formData.get("bio") as string) || null,
    resume_text: (formData.get("resume_text") as string) || null,
    has_onboarded: true,
  });

  const cookieStore = await cookies();
  cookieStore.set("has_onboarded", "true", {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    path: "/",
  });

  revalidatePath("/dashboard");
  redirect("/dashboard");
}

export async function updateUserProfile(data: Partial<Profile>) {
  const { user } = await requireUser();
  const profile = await updateProfile(user.id, data);
  revalidatePath("/dashboard");
  return profile;
}

export async function saveUserSettings(data: Partial<UserSettings>) {
  const { user } = await requireUser();
  const existing = await getSettings(user.id);
  const merged = { ...data };
  if (!merged.gemini_api_key && existing?.gemini_api_key) {
    merged.gemini_api_key = existing.gemini_api_key;
  }
  if (!merged.smtp_pass && existing?.smtp_pass) {
    merged.smtp_pass = existing.smtp_pass;
  }
  const settings = await updateSettings(user.id, merged);
  revalidatePath("/dashboard");
  return settings;
}

export async function discoverAndAddCompany(formData: FormData) {
  const { user } = await requireUser();
  const companyName = (formData.get("company_name") as string)?.trim();
  const websiteUrl = (formData.get("website_url") as string)?.trim() || null;
  const linkedinUrl = (formData.get("linkedin_url") as string)?.trim() || null;
  const pastedText = (formData.get("pasted_text") as string)?.trim() || null;

  if (!companyName) throw new Error("Company name is required");

  let finalWebsite = websiteUrl;
  let finalLinkedin = linkedinUrl;
  let snippets: string[] = [];
  let careersUrl: string | null = null;

  if (!finalWebsite && !finalLinkedin) {
    const discovered = await discoverCompany(companyName);
    finalWebsite = discovered.websiteUrl;
    finalLinkedin = discovered.linkedinUrl;
    careersUrl = discovered.careersUrl;
    snippets = discovered.snippets;
  }

  let scrapedText = pastedText ?? "";
  if (finalWebsite) {
    try {
      scrapedText = await scrapeMultiplePages(finalWebsite, [careersUrl, finalLinkedin]);
    } catch {
      if (!scrapedText) scrapedText = snippets.join("\n");
    }
  } else if (snippets.length) {
    scrapedText = snippets.join("\n");
  }

  const app = await createApplication(user.id, {
    company_name: companyName,
    website_url: finalWebsite,
    linkedin_url: finalLinkedin,
    scraped_text: scrapedText || null,
  });

  if (scrapedText) {
    const contacts = extractContactsFromText(scrapedText, companyName);
    if (contacts.length) await upsertContacts(app.id, contacts);
  }

  revalidatePath("/dashboard");
  return app;
}

export async function bulkAddCompanies(formData: FormData) {
  const { user } = await requireUser();
  const raw = (formData.get("bulk_list") as string) ?? "";
  const lines = raw.split("\n").map((l) => l.trim()).filter(Boolean);
  const created = [];

  for (const line of lines.slice(0, 30)) {
    const [name, url] = line.split(",").map((s) => s.trim());
    if (!name) continue;

    let scrapedText = "";
    let websiteUrl = url || null;

    if (websiteUrl) {
      try {
        scrapedText = await scrapeMultiplePages(websiteUrl, []);
      } catch {
        // continue without scrape
      }
    } else {
      const discovered = await discoverCompany(name);
      websiteUrl = discovered.websiteUrl;
      if (websiteUrl) {
        try {
          scrapedText = await scrapeMultiplePages(websiteUrl, [discovered.careersUrl]);
        } catch {
          scrapedText = discovered.snippets.join("\n");
        }
      }
    }

    const app = await createApplication(user.id, {
      company_name: name,
      website_url: websiteUrl,
      scraped_text: scrapedText || null,
    });
    created.push(app);
  }

  revalidatePath("/dashboard");
  return created;
}

export async function runAlignmentAnalysis(applicationId: string) {
  const { user } = await requireUser();
  const [profile, settings, app] = await Promise.all([
    getProfile(user.id),
    getSettings(user.id),
    getApplication(user.id, applicationId),
  ]);

  if (!profile) throw new Error("Profile not found");
  if (!app) throw new Error("Application not found");
  if (!settings?.gemini_api_key) throw new Error("Add your Gemini API key in Profile & Settings");

  const companyText = app.scraped_text ?? "";
  if (!companyText) throw new Error("No company text to analyze. Scrape or paste company info first.");

  const { score, notes } = await analyzeAlignment(
    settings.gemini_api_key,
    profile,
    app.company_name,
    companyText
  );

  const updated = await updateApplication(user.id, applicationId, {
    alignment_score: score,
    alignment_notes: notes,
  });

  revalidatePath("/dashboard");
  return updated;
}

export async function generateEmailDraft(
  applicationId: string,
  options: { tone?: string; focus?: string; recipientEmail?: string; contactId?: string }
) {
  const { user } = await requireUser();
  const [profile, settings, app, contacts] = await Promise.all([
    getProfile(user.id),
    getSettings(user.id),
    getApplication(user.id, applicationId),
    getContacts(applicationId),
  ]);

  if (!profile) throw new Error("Profile not found");
  if (!app) throw new Error("Application not found");
  if (!settings?.gemini_api_key) throw new Error("Add your Gemini API key in Profile & Settings");

  const contact = contacts.find((c) => c.id === options.contactId) ?? contacts[0];
  const recipient = options.recipientEmail ?? contact?.email ?? null;

  const { subject, body } = await generateOutreachEmail(
    settings.gemini_api_key,
    profile,
    app.company_name,
    app.scraped_text ?? "",
    app.alignment_notes,
    {
      tone: options.tone ?? settings.default_email_tone,
      focus: options.focus,
      recipientRole: contact?.role ?? undefined,
    }
  );

  const draft = await saveEmailDraft(applicationId, subject, body, recipient, contact?.id ?? null);
  await updateApplicationStatus(user.id, applicationId, "draft_ready", "Draft generated");

  revalidatePath("/dashboard");
  return draft;
}

export async function sendApplicationEmail(
  applicationId: string,
  emailId: string,
  subject: string,
  body: string,
  recipient: string
) {
  const { user } = await requireUser();
  const settings = await getSettings(user.id);
  if (!settings) throw new Error("Settings not found");

  const sentToday = await countEmailsSentToday(user.id);
  if (sentToday >= settings.daily_send_cap) {
    throw new Error(`Daily send cap (${settings.daily_send_cap}) reached. Try again tomorrow.`);
  }

  await sendEmail(settings, recipient, subject, body);

  const supabase = await import("@/lib/supabase").then((m) => m.createSupabaseAdmin());
  await supabase
    .from("emails")
    .update({ subject, body, recipient, is_draft: false, sent_at: new Date().toISOString() })
    .eq("id", emailId);

  await markEmailSent(emailId, applicationId, user.id);
  revalidatePath("/dashboard");
}

export async function sendBatchEmails(
  items: { applicationId: string; emailId: string; subject: string; body: string; recipient: string }[]
) {
  const { user } = await requireUser();
  const settings = await getSettings(user.id);
  if (!settings) throw new Error("Settings not found");

  const batchSize = Math.min(settings.send_batch_size, 10);
  const batch = items.slice(0, batchSize);

  const sentToday = await countEmailsSentToday(user.id);
  if (sentToday + batch.length > settings.daily_send_cap) {
    throw new Error(`Would exceed daily send cap (${settings.daily_send_cap}).`);
  }

  for (let i = 0; i < batch.length; i++) {
    await sendApplicationEmail(
      batch[i].applicationId,
      batch[i].emailId,
      batch[i].subject,
      batch[i].body,
      batch[i].recipient
    );
    if (i < batch.length - 1) await delay(50000);
  }

  revalidatePath("/dashboard");
  return { sent: batch.length };
}

export async function changeApplicationStatus(
  applicationId: string,
  status: ApplicationStatus,
  note?: string
) {
  const { user } = await requireUser();
  const updated = await updateApplicationStatus(user.id, applicationId, status, note);
  revalidatePath("/dashboard");
  return updated;
}

export async function updateApplicationNotes(applicationId: string, notes: string) {
  const { user } = await requireUser();
  const updated = await updateApplication(user.id, applicationId, { notes });
  revalidatePath("/dashboard");
  return updated;
}

export async function getApplicationDetails(applicationId: string) {
  const { user } = await requireUser();
  const app = await getApplication(user.id, applicationId);
  if (!app) throw new Error("Application not found");

  const [contacts, emails] = await Promise.all([
    getContacts(applicationId),
    getEmails(applicationId),
  ]);

  return { app, contacts, emails };
}

export async function rescrapeApplication(applicationId: string) {
  const { user } = await requireUser();
  const app = await getApplication(user.id, applicationId);
  if (!app?.website_url) throw new Error("No website URL to scrape");

  const scrapedText = await scrapeMultiplePages(app.website_url, [app.linkedin_url]);
  const updated = await updateApplication(user.id, applicationId, { scraped_text: scrapedText });

  const contacts = extractContactsFromText(scrapedText, app.company_name);
  if (contacts.length) await upsertContacts(applicationId, contacts);

  revalidatePath("/dashboard");
  return updated;
}
