import { serpapiFetch, SerpApiError } from "./client";
import { getAccount, getRemaining } from "./quota";
import { createAdminClient } from "@/lib/supabase/admin";
import { computeDedupHash } from "@/lib/dedup";
import {
  computeFitScore,
  computeCompanyQuality,
  computeOpportunityPriority,
} from "@/lib/scoring";

export type ScoutConfig = {
  /** Max SerpApi search calls in this run. Hobby plan 100/mo → max 3/day = ~90/mo. */
  maxSearches?: number;
  /** Minimum remaining quota before aborting. */
  minRemaining?: number;
};

type GoogleJob = {
  title?: string;
  company_name?: string;
  location?: string;
  description?: string;
  job_id?: string;
  via?: string;
  related_links?: Array<{ link?: string; text?: string }>;
  detected_extensions?: {
    posted_at?: string;
    schedule_type?: string;
    work_from_home?: boolean;
  };
  extensions?: string[];
  apply_options?: Array<{ link?: string; title?: string }>;
};

type GoogleJobsResponse = {
  jobs_results?: GoogleJob[];
  error?: string;
};

const QUERY_MATRIX: Array<{ q: string; location: string; label: string }> = [
  { q: "Strategy Associate", location: "Madrid, Community of Madrid, Spain", label: "strategy-madrid" },
  { q: "Business Operations Manager", location: "Madrid, Community of Madrid, Spain", label: "bizops-madrid" },
  { q: "Chief of Staff remote Europe", location: "Madrid, Community of Madrid, Spain", label: "chief-of-staff-remote" },
];

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function modalityFromGoogleJob(job: GoogleJob): string {
  if (job.detected_extensions?.work_from_home) return "remoto";
  const text = `${job.location ?? ""} ${(job.extensions ?? []).join(" ")}`.toLowerCase();
  if (text.includes("remot")) return "remoto";
  if (text.includes("hybrid") || text.includes("hibrid")) return "hibrido";
  return "unknown";
}

function countryFromLocation(loc?: string): string | null {
  if (!loc) return null;
  const low = loc.toLowerCase();
  if (low.includes("spain") || low.includes("españ")) return "ES";
  if (low.includes("colombia")) return "CO";
  if (low.includes("united states") || low.includes("usa")) return "US";
  if (low.includes("united kingdom") || low.includes("uk")) return "GB";
  return null;
}

function extractSourceUrl(job: GoogleJob): string | null {
  if (job.apply_options && job.apply_options[0]?.link) {
    return job.apply_options[0].link;
  }
  if (job.related_links && job.related_links[0]?.link) {
    return job.related_links[0].link;
  }
  return null;
}

export type ScoutSummary = {
  runId: string;
  status: "success" | "partial" | "failed";
  quotaBefore: number | null;
  quotaAfter: number | null;
  engines_used: string[];
  totalResults: number;
  newOffers: number;
  duplicates: number;
  errors: string[];
};

/**
 * Main orchestrator. Called by cron and by the "Run now" server action.
 */
export async function runScout(config: ScoutConfig = {}): Promise<ScoutSummary> {
  const maxSearches = config.maxSearches ?? 3;
  const minRemaining = config.minRemaining ?? 5;

  const sb = createAdminClient();
  const allowedEmail = process.env.ALLOWED_EMAIL;
  let ownerId: string | null = null;
  if (allowedEmail) {
    const { data } = await sb.auth.admin.listUsers();
    ownerId = data?.users.find(
      (u) => u.email?.toLowerCase() === allowedEmail.toLowerCase(),
    )?.id ?? null;
  }

  const started = new Date().toISOString();
  const { data: runRow } = await sb
    .from("scrape_runs")
    .insert({
      kind: "serpapi_daily",
      status: "success",
      started_at: started,
      queries: [],
      engines_used: [],
    })
    .select("id")
    .single();
  const runId = runRow?.id ?? "";

  const errors: string[] = [];
  const engines = new Set<string>();
  let quotaBefore: number | null = null;
  let quotaAfter: number | null = null;

  try {
    const acc = await getAccount();
    engines.add("account");
    quotaBefore =
      acc.total_searches_left ??
      acc.plan_searches_left ??
      Math.max(0, (acc.searches_per_month ?? 0) - (acc.this_month_usage ?? 0));
    if (quotaBefore < minRemaining) {
      throw new SerpApiError(
        `quota too low: ${quotaBefore} < ${minRemaining}`,
        429,
      );
    }
  } catch (e) {
    errors.push(e instanceof Error ? e.message : String(e));
  }

  let totalResults = 0;
  let newOffers = 0;
  let duplicates = 0;
  const queriesRun: Array<{ q: string; location: string; label: string; count: number }> = [];

  const limitedMatrix = QUERY_MATRIX.slice(0, maxSearches);

  for (const entry of limitedMatrix) {
    try {
      const resp = await serpapiFetch<GoogleJobsResponse>("/search", {
        engine: "google_jobs",
        q: entry.q,
        location: entry.location,
        hl: "es",
      });
      engines.add("google_jobs");
      const jobs = resp.jobs_results ?? [];
      totalResults += jobs.length;
      queriesRun.push({ ...entry, count: jobs.length });

      for (const job of jobs) {
        if (!job.title || !job.company_name) continue;

        const company_name = job.company_name;
        const companySlug = slugify(company_name);
        const { data: company } = await sb
          .from("companies")
          .upsert({ name: company_name, slug: companySlug }, { onConflict: "slug" })
          .select("*")
          .single();
        if (!company) continue;

        const fit = computeFitScore({
          title: job.title,
          location: job.location,
          country: countryFromLocation(job.location),
          modality: modalityFromGoogleJob(job),
          description: job.description,
        });
        const quality = computeCompanyQuality({
          name: company.name,
          domain: company.domain,
          official_site: company.official_site,
          careers_page: company.careers_page,
          size: company.size,
          funding_stage: company.funding_stage,
          recent_news: (company.recent_news as Array<{ type?: string; title?: string; date?: string }>) ?? [],
        });
        const priority = computeOpportunityPriority(fit.total, quality.total);

        const sourceUrl = extractSourceUrl(job);
        const hash = computeDedupHash({
          company: company.name,
          title: job.title,
          city: job.location,
          source_url: sourceUrl,
        });

        const { data: existing } = await sb
          .from("offers")
          .select("id")
          .eq("dedup_hash", hash)
          .maybeSingle();
        if (existing) {
          duplicates++;
          continue;
        }

        if (!ownerId) continue;

        const { error: insertErr } = await sb.from("offers").insert({
          user_id: ownerId,
          company_id: company.id,
          title: job.title,
          location: job.location,
          country: countryFromLocation(job.location),
          modality: modalityFromGoogleJob(job),
          source: "serpapi",
          source_url: sourceUrl,
          posted_at: null,
          fit_score: fit.total,
          company_quality_score: quality.total,
          opportunity_priority_score: priority,
          fit_tier: fit.tier,
          status: "pendiente",
          tags: [entry.label],
          dedup_hash: hash,
        });
        if (insertErr) {
          errors.push(`insert ${company.name} / ${job.title}: ${insertErr.message}`);
        } else {
          newOffers++;
        }
      }
    } catch (e) {
      errors.push(
        `query "${entry.q}": ${e instanceof Error ? e.message : String(e)}`,
      );
    }
  }

  try {
    quotaAfter = await getRemaining();
  } catch {
    /* noop */
  }

  const summaryStatus: ScoutSummary["status"] =
    errors.length === 0
      ? "success"
      : newOffers > 0 || totalResults > 0
        ? "partial"
        : "failed";

  const summaryMd = [
    `# SerpApi scrape · ${started}`,
    ``,
    `Quota: ${quotaBefore ?? "?"} → ${quotaAfter ?? "?"}`,
    `Queries: ${queriesRun.length}`,
    `Total jobs: ${totalResults}`,
    `New offers: ${newOffers}`,
    `Duplicates: ${duplicates}`,
    errors.length ? `\nErrors:\n${errors.map((e) => `- ${e}`).join("\n")}` : "",
  ].join("\n");

  if (runId) {
    await sb
      .from("scrape_runs")
      .update({
        status: summaryStatus,
        queries: queriesRun,
        engines_used: Array.from(engines),
        quota_before: quotaBefore,
        quota_after: quotaAfter,
        new_offers: newOffers,
        total_results: totalResults,
        finished_at: new Date().toISOString(),
        summary_md: summaryMd,
        error_message: errors.join("\n") || null,
      })
      .eq("id", runId);
  }

  return {
    runId,
    status: summaryStatus,
    quotaBefore,
    quotaAfter,
    engines_used: Array.from(engines),
    totalResults,
    newOffers,
    duplicates,
    errors,
  };
}
