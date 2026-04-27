import type { Adapter, RawJob } from "../types";

const ENDPOINT = "https://remoteok.com/api";

type RemoteOkJob = {
  id?: string | number;
  position?: string;
  company?: string;
  location?: string;
  description?: string;
  url?: string;
  apply_url?: string;
  date?: string;
  tags?: string[];
};

const TARGET_TAGS = [
  "strategy",
  "operations",
  "ops",
  "project management",
  "product management",
  "business",
  "growth",
  "consulting",
];

export const remoteokAdapter: Adapter = {
  id: "remoteok",
  name: "Remote OK",
  enabled() {
    return true;
  },
  async fetchJobs({ maxJobs = 50 }) {
    const res = await fetch(ENDPOINT, {
      headers: {
        "User-Agent":
          "job-scouting-al/1.0 (+https://job-scouting-al.vercel.app; contact: canelopolymarket@gmail.com)",
      },
    });
    if (!res.ok) throw new Error(`RemoteOK HTTP ${res.status}`);
    const list = (await res.json()) as RemoteOkJob[];
    // First entry is metadata, skip
    const jobs = list.filter((j) => j.id && j.position && j.company);

    const out: RawJob[] = [];
    for (const j of jobs) {
      const tagsLow = (j.tags ?? []).map((t) => t.toLowerCase());
      const matches = TARGET_TAGS.some(
        (t) => tagsLow.some((tag) => tag.includes(t)) || j.position?.toLowerCase().includes(t),
      );
      if (!matches) continue;

      out.push({
        source: "remoteok",
        externalId: String(j.id),
        title: j.position!,
        company: j.company!,
        location: j.location ?? "Remote",
        country: null,
        modality: "remoto",
        url: j.url ?? j.apply_url ?? null,
        description: j.description ?? null,
        postedAt: j.date ?? null,
        tags: ["remote", ...tagsLow.slice(0, 5)],
      });
      if (out.length >= maxJobs) break;
    }
    return out;
  },
};
