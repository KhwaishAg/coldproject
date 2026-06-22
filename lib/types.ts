export type ApplicationStatus =
  | "discovered"
  | "draft_ready"
  | "sent"
  | "replied"
  | "interview"
  | "offer"
  | "rejected";

export type User = {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  created_at: string;
  updated_at: string;
};

export type Profile = {
  user_id: string;
  target_domain: string | null;
  internship_type: string | null;
  institution: string | null;
  year: string | null;
  role: string | null;
  skills: string[];
  bio: string | null;
  resume_text: string | null;
  priorities: Record<string, number>;
  has_onboarded: boolean;
  updated_at: string;
};

export type UserSettings = {
  user_id: string;
  gemini_api_key: string | null;
  smtp_host: string | null;
  smtp_port: number | null;
  smtp_user: string | null;
  smtp_pass: string | null;
  send_batch_size: number;
  daily_send_cap: number;
  default_email_tone: string;
};

export type Application = {
  id: string;
  user_id: string;
  company_name: string;
  website_url: string | null;
  linkedin_url: string | null;
  scraped_text: string | null;
  alignment_score: number | null;
  alignment_notes: AlignmentNotes | null;
  status: ApplicationStatus;
  status_history: StatusHistoryEntry[];
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type AlignmentNotes = {
  whyFit: string[];
  gaps: string[];
  suggestedFocus: string;
};

export type StatusHistoryEntry = {
  status: ApplicationStatus;
  at: string;
  note?: string;
};

export type Contact = {
  id: string;
  application_id: string;
  name: string | null;
  role: string | null;
  email: string | null;
  linkedin_url: string | null;
};

export type OutreachEmail = {
  id: string;
  application_id: string;
  contact_id: string | null;
  subject: string;
  body: string;
  recipient: string | null;
  sent_at: string | null;
  is_draft: boolean;
};

export type DashboardStats = {
  totalApplications: number;
  emailsSent: number;
  replied: number;
  interviews: number;
  offers: number;
  responseRate: number;
};

export type DiscoverResult = {
  websiteUrl: string | null;
  linkedinUrl: string | null;
  careersUrl: string | null;
  snippets: string[];
};
