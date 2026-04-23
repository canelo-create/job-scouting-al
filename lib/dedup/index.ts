import { createHash } from "node:crypto";

/** Normalize a string for dedup hashing. */
export function normalize(input?: string | null): string {
  if (!input) return "";
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // strip accents
    .replace(/[^a-z0-9\s]/g, " ") // keep only alphanumerics + spaces
    .replace(/\b(jr|sr|i|ii|iii|iv|v)\b/g, "") // strip roman/generic seniority marks
    .replace(/\s+/g, " ")
    .trim();
}

/** Strip query strings, fragments, and trailing slashes from a URL. */
export function normalizeUrl(url?: string | null): string {
  if (!url) return "";
  try {
    const u = new URL(url);
    u.search = "";
    u.hash = "";
    return `${u.hostname}${u.pathname.replace(/\/+$/, "")}`.toLowerCase();
  } catch {
    return url.toLowerCase().split("?")[0].split("#")[0].replace(/\/+$/, "");
  }
}

export type DedupInput = {
  company?: string | null;
  title: string;
  city?: string | null;
  source_url?: string | null;
};

export function computeDedupHash(input: DedupInput): string {
  const parts = [
    normalize(input.company),
    normalize(input.title),
    normalize(input.city),
    normalizeUrl(input.source_url),
  ].join("|");
  return createHash("sha256").update(parts).digest("hex");
}
