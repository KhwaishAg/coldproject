"use client";

import {
  discoverAndAddCompany,
  bulkAddCompanies,
  runAlignmentAnalysis,
  rescrapeApplication,
} from "@/app/actions";
import type { Application } from "@/lib/types";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type Props = {
  applications: Application[];
  onRefresh: () => void;
};

export function CompanyOverview({ applications, onRefresh }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showBulk, setShowBulk] = useState(false);
  const router = useRouter();
  const [, startTransition] = useTransition();

  const selected = applications.find((a) => a.id === selectedId) ?? applications[0] ?? null;

  async function handleDiscover(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const form = e.currentTarget;
    const fd = new FormData(form);

    try {
      const app = await discoverAndAddCompany(fd);
      setSelectedId(app.id);
      startTransition(() => {
        router.refresh();
        onRefresh();
      });
      form.reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add company");
    } finally {
      setLoading(false);
    }
  }

  async function handleBulk(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    try {
      await bulkAddCompanies(fd);
      startTransition(() => {
        router.refresh();
        onRefresh();
      });
      e.currentTarget.reset();
      setShowBulk(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bulk add failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleAnalyze(id: string) {
    setError(null);
    setLoading(true);
    try {
      await runAlignmentAnalysis(id);
      startTransition(() => {
        router.refresh();
        onRefresh();
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleRescrape(id: string) {
    setError(null);
    setLoading(true);
    try {
      await rescrapeApplication(id);
      startTransition(() => {
        router.refresh();
        onRefresh();
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Rescrape failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-5xl space-y-8">
      <div>
        <h2 className="text-xl font-semibold text-gray-800">Company Overview</h2>
        <p className="text-sm text-gray-500 mt-1">
          Search by name, paste a URL, or bulk-add companies. We discover their website and LinkedIn via web search.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">{error}</div>
      )}

      <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setShowBulk(false)}
            className={`text-sm px-3 py-1 rounded ${!showBulk ? "bg-[#C0534F] text-white" : "bg-gray-100"}`}
          >
            Single Company
          </button>
          <button
            type="button"
            onClick={() => setShowBulk(true)}
            className={`text-sm px-3 py-1 rounded ${showBulk ? "bg-[#C0534F] text-white" : "bg-gray-100"}`}
          >
            Bulk Paste
          </button>
        </div>

        {!showBulk ? (
          <form onSubmit={handleDiscover} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Company Name *</label>
              <input
                name="company_name"
                required
                placeholder="e.g. Stripe, Goldman Sachs"
                className="mt-1 w-full border border-gray-300 rounded-md py-2 px-3"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Website URL (optional)</label>
                <input name="website_url" placeholder="https://stripe.com" className="mt-1 w-full border border-gray-300 rounded-md py-2 px-3" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">LinkedIn URL (optional)</label>
                <input name="linkedin_url" placeholder="https://linkedin.com/company/..." className="mt-1 w-full border border-gray-300 rounded-md py-2 px-3" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Or paste company / LinkedIn text</label>
              <textarea name="pasted_text" rows={3} placeholder="Paste About page or job post text if scrape fails" className="mt-1 w-full border border-gray-300 rounded-md py-2 px-3" />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="bg-[#C0534F] text-white px-6 py-2 rounded-md hover:bg-[#a84542] disabled:opacity-50"
            >
              {loading ? "Discovering..." : "Discover & Add"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleBulk} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">One company per line: Name, website</label>
              <textarea
                name="bulk_list"
                rows={6}
                placeholder={"Stripe, stripe.com\nGoldman Sachs, goldmansachs.com"}
                className="mt-1 w-full border border-gray-300 rounded-md py-2 px-3 font-mono text-sm"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="bg-[#C0534F] text-white px-6 py-2 rounded-md hover:bg-[#a84542] disabled:opacity-50"
            >
              {loading ? "Adding..." : "Bulk Add (max 30)"}
            </button>
          </form>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-4">
          <h3 className="font-medium text-gray-800 mb-3">Your Companies ({applications.length})</h3>
          {applications.length === 0 ? (
            <p className="text-sm text-gray-500">No companies added yet.</p>
          ) : (
            <ul className="space-y-2 max-h-80 overflow-y-auto">
              {applications.map((app) => (
                <li key={app.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(app.id)}
                    className={`w-full text-left px-3 py-2 rounded text-sm ${
                      selected?.id === app.id ? "bg-[#C0534F]/10 border border-[#C0534F]/30" : "hover:bg-gray-50"
                    }`}
                  >
                    <span className="font-medium">{app.company_name}</span>
                    {app.alignment_score != null && (
                      <span className="ml-2 text-xs text-gray-500">{app.alignment_score}% fit</span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {selected && (
          <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
            <h3 className="font-semibold text-lg">{selected.company_name}</h3>
            {selected.website_url && (
              <p className="text-sm text-blue-600 truncate">{selected.website_url}</p>
            )}
            {selected.linkedin_url && (
              <p className="text-sm text-blue-600 truncate">{selected.linkedin_url}</p>
            )}

            {selected.alignment_score != null ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-3xl font-bold text-green-700">{selected.alignment_score}%</p>
                <p className="text-sm text-green-600">Alignment Score</p>
                {selected.alignment_notes && (
                  <div className="mt-3 text-sm space-y-2">
                    <div>
                      <p className="font-medium">Why you fit:</p>
                      <ul className="list-disc ml-4 text-gray-600">
                        {selected.alignment_notes.whyFit.map((w) => (
                          <li key={w}>{w}</li>
                        ))}
                      </ul>
                    </div>
                    {selected.alignment_notes.gaps.length > 0 && (
                      <div>
                        <p className="font-medium">Gaps:</p>
                        <ul className="list-disc ml-4 text-gray-600">
                          {selected.alignment_notes.gaps.map((g) => (
                            <li key={g}>{g}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <p className="text-gray-600 italic">{selected.alignment_notes.suggestedFocus}</p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-500">Run alignment analysis to see how well you match.</p>
            )}

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleAnalyze(selected.id)}
                disabled={loading}
                className="bg-[#4A1D1A] text-white px-4 py-2 rounded text-sm disabled:opacity-50"
              >
                Analyze Alignment
              </button>
              {selected.website_url && (
                <button
                  type="button"
                  onClick={() => handleRescrape(selected.id)}
                  disabled={loading}
                  className="border border-gray-300 px-4 py-2 rounded text-sm disabled:opacity-50"
                >
                  Re-scrape
                </button>
              )}
            </div>

            {selected.scraped_text && (
              <details className="text-sm">
                <summary className="cursor-pointer text-gray-500">Scraped text preview</summary>
                <p className="mt-2 text-gray-600 max-h-40 overflow-y-auto">{selected.scraped_text.slice(0, 1500)}...</p>
              </details>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
