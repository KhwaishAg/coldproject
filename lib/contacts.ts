import * as cheerio from "cheerio";
import type { Contact } from "./types";

const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

const SKIP_EMAILS = [
  "noreply",
  "no-reply",
  "donotreply",
  "support@",
  "privacy@",
  "legal@",
  "abuse@",
  "sentry",
  "webpack",
  ".png",
  ".jpg",
  "example.com",
  "wixpress",
  "sentry.io",
];

function isValidContactEmail(email: string): boolean {
  const lower = email.toLowerCase();
  return !SKIP_EMAILS.some((s) => lower.includes(s));
}

export function extractEmailsFromHtml(html: string): string[] {
  const $ = cheerio.load(html);
  const found = new Set<string>();

  $('a[href^="mailto:"]').each((_, el) => {
    const href = $(el).attr("href") ?? "";
    const email = href.replace("mailto:", "").split("?")[0].trim();
    if (email && isValidContactEmail(email)) found.add(email);
  });

  const text = $("body").text();
  const matches = text.match(EMAIL_REGEX) ?? [];
  for (const m of matches) {
    if (isValidContactEmail(m)) found.add(m);
  }

  return [...found].slice(0, 10);
}

export function extractContactsFromText(
  html: string,
  companyName: string
): Omit<Contact, "id" | "application_id">[] {
  const emails = extractEmailsFromHtml(html);
  const contacts: Omit<Contact, "id" | "application_id">[] = [];

  for (const email of emails) {
    const local = email.split("@")[0].toLowerCase();
    let role = "Contact";

    if (local.includes("hr") || local.includes("recruit") || local.includes("talent") || local.includes("career")) {
      role = "HR / Recruiting";
    } else if (local.includes("ceo") || local.includes("founder")) {
      role = "Leadership";
    } else if (local.includes("info") || local.includes("contact") || local.includes("hello")) {
      role = "General";
    }

    contacts.push({
      name: null,
      role: `${role} @ ${companyName}`,
      email,
      linkedin_url: null,
    });
  }

  return contacts.slice(0, 5);
}
