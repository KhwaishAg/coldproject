import { GoogleGenerativeAI } from "@google/generative-ai";
import type { AlignmentNotes, Profile } from "./types";

function getModel(apiKey: string) {
  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
}

function parseJson<T>(text: string): T {
  const cleaned = text.replace(/```json\n?|\n?```/g, "").trim();
  return JSON.parse(cleaned) as T;
}

export async function analyzeAlignment(
  apiKey: string,
  profile: Profile,
  companyName: string,
  companyText: string
): Promise<{ score: number; notes: AlignmentNotes }> {
  const model = getModel(apiKey);

  const prompt = `You are an internship placement advisor. Score how well this candidate fits the company for an internship.

Candidate:
- Target domain: ${profile.target_domain ?? "Not specified"}
- Internship type: ${profile.internship_type ?? "Not specified"}
- Institution: ${profile.institution ?? "Not specified"}
- Year: ${profile.year ?? "Not specified"}
- Skills: ${(profile.skills ?? []).join(", ") || "None listed"}
- Bio: ${profile.bio ?? "None"}
- Resume excerpt: ${(profile.resume_text ?? "").slice(0, 2000)}
- Priorities (1-5): ${JSON.stringify(profile.priorities ?? {})}

Company: ${companyName}
Company info:
${companyText.slice(0, 8000)}

Respond ONLY with valid JSON:
{
  "score": <number 0-100>,
  "whyFit": ["reason1", "reason2"],
  "gaps": ["gap1"],
  "suggestedFocus": "one sentence on what to highlight in outreach"
}`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  const parsed = parseJson<{ score: number; whyFit: string[]; gaps: string[]; suggestedFocus: string }>(text);

  return {
    score: Math.min(100, Math.max(0, Math.round(parsed.score))),
    notes: {
      whyFit: parsed.whyFit ?? [],
      gaps: parsed.gaps ?? [],
      suggestedFocus: parsed.suggestedFocus ?? "",
    },
  };
}

export async function generateOutreachEmail(
  apiKey: string,
  profile: Profile,
  companyName: string,
  companyText: string,
  alignmentNotes: AlignmentNotes | null,
  options: { tone?: string; focus?: string; recipientRole?: string }
): Promise<{ subject: string; body: string }> {
  const model = getModel(apiKey);

  const prompt = `Write a concise, personalized cold email for an internship inquiry.

Candidate:
- Name context: ${profile.institution ?? "student"} student targeting ${profile.target_domain ?? "internships"}
- Skills: ${(profile.skills ?? []).join(", ")}
- Bio: ${profile.bio ?? ""}
- Resume highlights: ${(profile.resume_text ?? "").slice(0, 1500)}

Company: ${companyName}
Company context: ${companyText.slice(0, 4000)}
Alignment notes: ${JSON.stringify(alignmentNotes ?? {})}
Tone: ${options.tone ?? "professional"}
Focus: ${options.focus || alignmentNotes?.suggestedFocus || "skills and enthusiasm"}
Recipient: ${options.recipientRole ?? "hiring manager or HR"}

Rules:
- Under 200 words
- Specific to this company (mention something real from context)
- Clear ask for internship conversation
- No placeholder brackets like [Your Name] — use "I" for the student
- Professional sign-off

Respond ONLY with valid JSON:
{"subject": "...", "body": "..."}`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  return parseJson<{ subject: string; body: string }>(text);
}

export async function generateFollowUpReply(
  apiKey: string,
  originalEmail: string,
  replyText: string
): Promise<string> {
  const model = getModel(apiKey);

  const prompt = `Draft a brief, professional follow-up reply to a recruiter.

Original email sent:
${originalEmail}

Their reply:
${replyText}

Write only the reply body (no subject). Keep it under 120 words.`;

  const result = await model.generateContent(prompt);
  return result.response.text().trim();
}
