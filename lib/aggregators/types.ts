export type RawModality =
  | "remoto"
  | "hibrido"
  | "presencial"
  | "hibrido-remoto"
  | "unknown";

export type RawJob = {
  source: string;
  externalId?: string | null;
  title: string;
  company: string;
  location?: string | null;
  country?: string | null;
  modality?: RawModality;
  url?: string | null;
  description?: string | null;
  postedAt?: string | null;
  tags?: string[];
};

export type AdapterFetchOpts = {
  maxJobs?: number;
  rolesQuery?: string[];
};

export interface Adapter {
  id: string;
  name: string;
  enabled(): boolean;
  fetchJobs(opts: AdapterFetchOpts): Promise<RawJob[]>;
}

/** Fit-checking heuristic to skip obvious non-matches before DB insert. */
export function isPotentialFit(job: RawJob, targetCountries: Set<string>): boolean {
  const text = `${job.title} ${job.location ?? ""} ${(job.tags ?? []).join(" ")}`.toLowerCase();
  // Skip clearly junior / very technical roles
  if (/(intern|trainee|becario|practicante|junior dev|software engineer i\b)/.test(text)) {
    // intern/trainee allowed only if matches MBA internships
    if (!/mba|associate consultant|consultant/i.test(job.title)) return false;
  }
  // Geo gating
  const country = job.country?.toUpperCase();
  if (country && !targetCountries.has(country)) {
    if (job.modality !== "remoto") return false;
  }
  return true;
}
