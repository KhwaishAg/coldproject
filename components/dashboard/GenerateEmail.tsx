"use client";

import { generateEmailDraft, sendApplicationEmail } from "@/app/actions";
import type { Application, UserSettings } from "@/lib/types";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type Props = {
  applications: Application[];
  settings: UserSettings | null;
  onRefresh: () => void;
};

export function GenerateEmail({ applications, settings, onRefresh }: Props) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [recipient, setRecipient] = useState("");
  const [emailId, setEmailId] = useState<string | null>(null);
  const [tone, setTone] = useState(settings?.default_email_tone ?? "professional");
  const [focus, setFocus] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const router = useRouter();
  const [, startTransition] = useTransition();

  const active = applications.find((a) => a.id === activeId);

  function toggleSelect(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  async function handleGenerate(id: string) {
    setError(null);
    setLoading(true);
    setActiveId(id);
    try {
      const draft = await generateEmailDraft(id, { tone, focus: focus || undefined });
      setSubject(draft.subject);
      setBody(draft.body);
      setRecipient(draft.recipient ?? "");
      setEmailId(draft.id);
      startTransition(() => {
        router.refresh();
        onRefresh();
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerateSelected() {
    for (const id of selectedIds) {
      await handleGenerate(id);
    }
  }

  async function handleSend() {
    if (!activeId || !emailId || !recipient) {
      setError("Select a company, generate a draft, and enter a recipient email.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await sendApplicationEmail(activeId, emailId, subject, body, recipient);
      startTransition(() => {
        router.refresh();
        onRefresh();
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Send failed");
    } finally {
      setLoading(false);
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(`Subject: ${subject}\n\n${body}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const hasGemini = !!settings?.gemini_api_key;
  const hasSmtp = !!(settings?.smtp_host && settings?.smtp_user && settings?.smtp_pass);

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-800">Generate Email</h2>
        <p className="text-sm text-gray-500 mt-1">
          Generate personalized drafts, review, then send (batch limit: {settings?.send_batch_size ?? 5}/action).
        </p>
      </div>

      {!hasGemini && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded text-sm">
          Add your Gemini API key in Profile & Settings to generate emails.
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">{error}</div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-4 lg:col-span-1">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-medium">Companies</h3>
            {selectedIds.length > 0 && hasGemini && (
              <button
                type="button"
                onClick={handleGenerateSelected}
                disabled={loading}
                className="text-xs bg-[#C0534F] text-white px-2 py-1 rounded disabled:opacity-50"
              >
                Generate {selectedIds.length}
              </button>
            )}
          </div>
          <ul className="space-y-2 max-h-96 overflow-y-auto">
            {applications.map((app) => (
              <li key={app.id} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selectedIds.includes(app.id)}
                  onChange={() => toggleSelect(app.id)}
                  className="rounded"
                />
                <button
                  type="button"
                  onClick={() => handleGenerate(app.id)}
                  disabled={loading || !hasGemini}
                  className={`flex-1 text-left px-2 py-1.5 rounded text-sm ${
                    activeId === app.id ? "bg-[#C0534F]/10" : "hover:bg-gray-50"
                  } disabled:opacity-50`}
                >
                  {app.company_name}
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 lg:col-span-2 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Tone</label>
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                className="mt-1 w-full border border-gray-300 rounded-md py-2 px-3 text-sm"
              >
                <option value="professional">Professional</option>
                <option value="enthusiastic">Enthusiastic</option>
                <option value="concise">Concise</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Focus (optional)</label>
              <input
                value={focus}
                onChange={(e) => setFocus(e.target.value)}
                placeholder="e.g. highlight React projects"
                className="mt-1 w-full border border-gray-300 rounded-md py-2 px-3 text-sm"
              />
            </div>
          </div>

          {active && (
            <p className="text-sm text-gray-500">
              Drafting for: <strong>{active.company_name}</strong>
              {active.alignment_score != null && ` (${active.alignment_score}% fit)`}
            </p>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700">Recipient</label>
            <input
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="hr@company.com"
              className="mt-1 w-full border border-gray-300 rounded-md py-2 px-3"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Subject</label>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="mt-1 w-full border border-gray-300 rounded-md py-2 px-3"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Body</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={12}
              className="mt-1 w-full border border-gray-300 rounded-md py-2 px-3 font-mono text-sm"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleCopy}
              disabled={!body}
              className="border border-gray-300 px-4 py-2 rounded text-sm disabled:opacity-50"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
            {recipient && (
              <a
                href={`mailto:${recipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`}
                className="border border-gray-300 px-4 py-2 rounded text-sm"
              >
                Open in Mail
              </a>
            )}
            <button
              type="button"
              onClick={handleSend}
              disabled={loading || !hasSmtp || !body || !recipient}
              className="bg-[#C0534F] text-white px-4 py-2 rounded text-sm disabled:opacity-50"
              title={!hasSmtp ? "Configure SMTP in Profile & Settings" : undefined}
            >
              {loading ? "Sending..." : "Send via SMTP"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
