-- OutreachAI initial schema
-- Run in Supabase SQL Editor or via CLI

CREATE TYPE application_status AS ENUM (
  'discovered',
  'draft_ready',
  'sent',
  'replied',
  'interview',
  'offer',
  'rejected'
);

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  image TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE profiles (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  target_domain TEXT,
  internship_type TEXT,
  institution TEXT,
  year TEXT,
  role TEXT,
  skills TEXT[] DEFAULT '{}',
  bio TEXT,
  resume_text TEXT,
  priorities JSONB DEFAULT '{"techStack":3,"mission":3,"location":2,"companySize":2}'::jsonb,
  has_onboarded BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE user_settings (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  gemini_api_key TEXT,
  smtp_host TEXT,
  smtp_port INTEGER,
  smtp_user TEXT,
  smtp_pass TEXT,
  send_batch_size INTEGER NOT NULL DEFAULT 5,
  daily_send_cap INTEGER NOT NULL DEFAULT 25,
  default_email_tone TEXT NOT NULL DEFAULT 'professional'
);

CREATE TABLE applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  website_url TEXT,
  linkedin_url TEXT,
  scraped_text TEXT,
  alignment_score INTEGER,
  alignment_notes JSONB,
  status application_status NOT NULL DEFAULT 'discovered',
  status_history JSONB NOT NULL DEFAULT '[]'::jsonb,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  name TEXT,
  role TEXT,
  email TEXT,
  linkedin_url TEXT
);

CREATE TABLE emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  recipient TEXT,
  sent_at TIMESTAMPTZ,
  is_draft BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  source TEXT NOT NULL DEFAULT 'manual'
);

CREATE INDEX idx_applications_user_id ON applications(user_id);
CREATE INDEX idx_applications_status ON applications(status);
CREATE INDEX idx_contacts_application_id ON contacts(application_id);
CREATE INDEX idx_emails_application_id ON emails(application_id);

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER applications_updated_at BEFORE UPDATE ON applications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
