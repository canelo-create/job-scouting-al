import type { Adapter, RawJob } from "../types";

const ENDPOINT = "https://search.torre.co/opportunities/_search";

const QUERIES = [
  { text: "Strategy", experience: "1-plus-year" },
  { text: "Operations Manager", experience: "1-plus-year" },
  { text: "Project Manager", experience: "1-plus-year" },
  { text: "Chief of Staff", experience: "1-plus-year" },
];

type TorreResult = {
  id: string;
  objective?: string;
  organizations?: Array<{ name?: string }>;
  locations?: string[];
  remote?: boolean;
  type?: string;
  category?: string;
  publishedDate?: string;
};

type TorreResponse = {
  total?: number;
  results?: TorreResult[];
};

async function search(skill: { text: string; experience: string }, size = 25): Promise<TorreResult[]> {
  const res = await fetch(`${ENDPOINT}?size=${size}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ "skill/role": skill }),
  });
  if (!res.ok) {
    throw new Error(`Torre ${skill.text}: HTTP ${res.status}`);
  }
  const data = (await res.json()) as TorreResponse;
  return data.results ?? [];
}

function locationToCountry(loc?: string | null): string | null {
  if (!loc) return null;
  const l = loc.toLowerCase();
  if (l.includes("colombia") || l.includes("bogot")) return "CO";
  if (l.includes("spain") || l.includes("españ") || l.includes("madrid")) return "ES";
  if (l.includes("united states") || l.includes("usa")) return "US";
  if (l.includes("united kingdom") || l.includes("uk") || l.includes("london")) return "GB";
  if (l.includes("mexico") || l.includes("méxico")) return "MX";
  if (l.includes("argentina")) return "AR";
  return null;
}

const TARGET_COUNTRIES = new Set(["ES", "CO"]);

export const torreAdapter: Adapter = {
  id: "torre",
  name: "Torre.co",
  enabled() {
    return true; // public API
  },
  async fetchJobs({ maxJobs = 60 }) {
    const collected = new Map<string, RawJob>();
    for (const q of QUERIES) {
      try {
        const results = await search(q, Math.ceil(maxJobs / QUERIES.length));
        for (const r of results) {
          if (!r.objective || !r.organizations?.[0]?.name) continue;
          const loc = r.locations?.[0] ?? null;
          const country = locationToCountry(loc);
          // Only ES + CO + remote
          if (country && !TARGET_COUNTRIES.has(country) && !r.remote) continue;
          const key = `${r.organizations[0].name}|${r.objective}`.toLowerCase();
          if (collected.has(key)) continue;
          collected.set(key, {
            source: "torre",
            externalId: r.id,
            title: r.objective,
            company: r.organizations[0].name!,
            location: loc,
            country,
            modality: r.remote ? "remoto" : "unknown",
            url: `https://torre.co/jobs/${r.id}`,
            postedAt: r.publishedDate ?? null,
            tags: [`torre:${q.text.toLowerCase().replace(/\s+/g, "-")}`],
          });
        }
      } catch (e) {
        console.error("[torre]", q.text, e);
      }
    }
    return Array.from(collected.values()).slice(0, maxJobs);
  },
};
