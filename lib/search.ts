import axios from "axios";
import * as cheerio from "cheerio";
import type { DiscoverResult } from "./types";

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

async function duckDuckGoSearch(query: string): Promise<{ title: string; url: string; snippet: string }[]> {
  try {
    const res = await axios.get("https://html.duckduckgo.com/html/", {
      params: { q: query },
      headers: { "User-Agent": USER_AGENT },
      timeout: 15000,
    });

    const $ = cheerio.load(res.data);
    const results: { title: string; url: string; snippet: string }[] = [];

    $(".result").each((_, el) => {
      const title = $(el).find(".result__a").text().trim();
      let url = $(el).find(".result__a").attr("href") ?? "";
      const snippet = $(el).find(".result__snippet").text().trim();

      if (url.startsWith("//duckduckgo.com/l/?")) {
        const match = url.match(/uddg=([^&]+)/);
        if (match) url = decodeURIComponent(match[1]);
      }

      if (title && url) results.push({ title, url, snippet });
    });

    return results.slice(0, 8);
  } catch {
    return [];
  }
}

function pickWebsiteUrl(results: { url: string }[]): string | null {
  for (const r of results) {
    try {
      const host = new URL(r.url).hostname.replace(/^www\./, "");
      if (
        !host.includes("linkedin.com") &&
        !host.includes("facebook.com") &&
        !host.includes("twitter.com") &&
        !host.includes("instagram.com") &&
        !host.includes("youtube.com") &&
        !host.includes("wikipedia.org")
      ) {
        return r.url;
      }
    } catch {
      continue;
    }
  }
  return null;
}

function pickLinkedInUrl(results: { url: string }[]): string | null {
  for (const r of results) {
    if (r.url.includes("linkedin.com/company/")) return r.url.split("?")[0];
  }
  return null;
}

function pickCareersUrl(results: { url: string }[]): string | null {
  for (const r of results) {
    const lower = r.url.toLowerCase();
    if (lower.includes("career") || lower.includes("jobs") || lower.includes("intern")) {
      return r.url;
    }
  }
  return null;
}

export async function discoverCompany(companyName: string): Promise<DiscoverResult> {
  const [webResults, linkedinResults, careersResults] = await Promise.all([
    duckDuckGoSearch(`${companyName} official website`),
    duckDuckGoSearch(`${companyName} site:linkedin.com/company`),
    duckDuckGoSearch(`${companyName} careers internship`),
  ]);

  const allResults = [...webResults, ...linkedinResults, ...careersResults];
  const snippets = allResults.map((r) => r.snippet).filter(Boolean);

  return {
    websiteUrl: pickWebsiteUrl(webResults) ?? pickWebsiteUrl(allResults),
    linkedinUrl: pickLinkedInUrl(linkedinResults) ?? pickLinkedInUrl(allResults),
    careersUrl: pickCareersUrl(careersResults),
    snippets,
  };
}

export async function scrapeWebsite(url: string): Promise<string> {
  try {
    const normalized = url.startsWith("http") ? url : `https://${url}`;
    const res = await axios.get(normalized, {
      headers: { "User-Agent": USER_AGENT },
      timeout: 15000,
      maxRedirects: 5,
    });

    const $ = cheerio.load(res.data);
    $("script, style, nav, footer, header, noscript").remove();

    const text = $("body").text().replace(/\s+/g, " ").trim();
    return text.slice(0, 12000);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Scrape failed";
    throw new Error(`Could not scrape ${url}: ${message}`);
  }
}

export async function scrapeMultiplePages(baseUrl: string, extraUrls: (string | null)[]): Promise<string> {
  const urls = [baseUrl, ...extraUrls.filter(Boolean)] as string[];
  const unique = [...new Set(urls)];
  const parts: string[] = [];

  for (const url of unique.slice(0, 3)) {
    try {
      const text = await scrapeWebsite(url);
      if (text) parts.push(`--- ${url} ---\n${text}`);
    } catch {
      // skip failed pages
    }
  }

  return parts.join("\n\n").slice(0, 20000);
}
