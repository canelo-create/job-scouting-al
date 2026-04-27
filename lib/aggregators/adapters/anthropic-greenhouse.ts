import type { Adapter, RawJob } from "../types";

const ENDPOINT =
  "https://boards-api.greenhouse.io/v1/boards/anthropic/jobs?content=true";

type GhJob = {
  id: number;
  title: string;
  absolute_url: string;
  location?: { name?: string };
  updated_at?: string;
  metadata?: Array<{ name?: string; value?: unknown }>;
  content?: string;
};

type GhResponse = {
  jobs?: GhJob[];
};

const TARGET_KEYWORDS = [
  "strategy",
  "operations",
  "chief of staff",
  "program manager",
  "product",
  "business",
  "go-to-market",
  "gtm",
  "growth",
  "transformation",
  "consulting",
];

function locationToCountry(name?: string): string | null {
  if (!name) return null;
  const l = name.toLowerCase();
  if (l.includes("spain") || l.includes("madrid") || l.includes("barcelona")) return "ES";
  if (l.includes("colombia") || l.includes("bogot")) return "CO";
  if (l.includes("united kingdom") || l.includes("london")) return "GB";
  if (l.includes("united states") || l.includes("san francisco") || l.includes("nyc") || l.includes("new york")) return "US";
  if (l.includes("germany") || l.includes("berlin") || l.includes("munich")) return "DE";
  if (l.includes("remote")) return null;
  return null;
}

function modalityFromLocation(name?: string): RawJob["modality"] {
  if (!name) return "unknown";
  const l = name.toLowerCase();
  if (l.includes("remote")) return "remoto";
  if (l.includes("hybrid")) return "hibrido";
  return "unknown";
}

export const anthropicGreenhouseAdapter: Adapter = {
  id: "anthropic-greenhouse",
  name: "Anthropic (Greenhouse)",
  enabled() {
    return true;
  },
  async fetchJobs({ maxJobs = 30 }) {
    const res = await fetch(ENDPOINT, { headers: { Accept: "application/json" } });
    if (!res.ok) throw new Error(`Anthropic GH HTTP ${res.status}`);
    const data = (await res.json()) as GhResponse;
    const out: RawJob[] = [];
    for (const j of data.jobs ?? []) {
      const titleLow = j.title.toLowerCase();
      const matches = TARGET_KEYWORDS.some((k) => titleLow.includes(k));
      if (!matches) continue;
      const locName = j.location?.name;
      // Geo: prefer EU/remote/US
      const country = locationToCountry(locName);
      const modality = modalityFromLocation(locName);
      out.push({
        source: "anthropic-greenhouse",
        externalId: String(j.id),
        title: j.title,
        company: "Anthropic",
        location: locName ?? null,
        country,
        modality,
        url: j.absolute_url,
        postedAt: j.updated_at ?? null,
        tags: ["anthropic", "ai-lab", "greenhouse"],
      });
      if (out.length >= maxJobs) break;
    }
    return out;
  },
};
