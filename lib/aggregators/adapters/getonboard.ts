import type { Adapter, RawJob } from "../types";

const BASE = "https://www.getonbrd.com/api/v0";

const CATEGORIES = ["business-administration", "marketing-and-communications"];

type GobJob = {
  id: string;
  attributes: {
    title?: string;
    company?: { data?: { attributes?: { name?: string } } };
    "company-name"?: string;
    country?: string;
    city?: string;
    "remote-modality"?: string;
    remote?: boolean;
    "public-url"?: string;
    "long-url"?: string;
    description?: string;
    "published-at"?: string;
    seniority?: string;
  };
};

type GobResponse = {
  data?: GobJob[];
};

const TARGET_COUNTRIES = new Set(["Colombia", "Spain", "España", "Argentina", "Chile", "Mexico", "México"]);

function countryCode(s?: string): string | null {
  if (!s) return null;
  const x = s.toLowerCase();
  if (x.includes("colombia")) return "CO";
  if (x.includes("spain") || x.includes("españ")) return "ES";
  if (x.includes("argentina")) return "AR";
  if (x.includes("chile")) return "CL";
  if (x.includes("mexico") || x.includes("méxico")) return "MX";
  return null;
}

function modalityFrom(remote?: boolean, mod?: string): RawJob["modality"] {
  if (remote) return "remoto";
  const m = (mod ?? "").toLowerCase();
  if (m.includes("remote")) return "remoto";
  if (m.includes("hybrid") || m.includes("hibrid")) return "hibrido";
  if (m.includes("on-site") || m.includes("on site") || m.includes("presencial")) return "presencial";
  return "unknown";
}

export const getonboardAdapter: Adapter = {
  id: "getonboard",
  name: "Get on Board",
  enabled() {
    return true;
  },
  async fetchJobs({ maxJobs = 40 }) {
    const out: RawJob[] = [];
    for (const cat of CATEGORIES) {
      try {
        const res = await fetch(
          `${BASE}/categories/${cat}/jobs?per_page=${Math.ceil(maxJobs / CATEGORIES.length)}`,
          { headers: { Accept: "application/json" } },
        );
        if (!res.ok) {
          console.error(`[getonboard] ${cat} HTTP ${res.status}`);
          continue;
        }
        const data = (await res.json()) as GobResponse;
        for (const j of data.data ?? []) {
          const a = j.attributes;
          if (!a.title) continue;
          const company =
            a.company?.data?.attributes?.name ?? a["company-name"] ?? null;
          if (!company) continue;
          const country = countryCode(a.country);
          if (country && !TARGET_COUNTRIES.has(a.country ?? "") && !a.remote) {
            // skip non-target countries unless remote
            continue;
          }
          out.push({
            source: "getonboard",
            externalId: j.id,
            title: a.title,
            company,
            location: a.city ? `${a.city}, ${a.country ?? ""}`.trim() : a.country ?? null,
            country,
            modality: modalityFrom(a.remote, a["remote-modality"]),
            url: a["public-url"] ?? a["long-url"] ?? null,
            description: a.description ?? null,
            postedAt: a["published-at"] ?? null,
            tags: ["getonboard", cat],
          });
          if (out.length >= maxJobs) return out;
        }
      } catch (e) {
        console.error(`[getonboard] ${cat}`, e);
      }
    }
    return out;
  },
};
