import { createAdminClient } from "@/lib/supabase/admin";
import { computeDedupHash } from "@/lib/dedup";
import {
  computeFitScore,
  computeCompanyQuality,
  computeOpportunityPriority,
} from "@/lib/scoring";
import type { Adapter, RawJob } from "./types";
import { torreAdapter } from "./adapters/torre";
import { remoteokAdapter } from "./adapters/remoteok";
import { getonboardAdapter } from "./adapters/getonboard";
import { anthropicGreenhouseAdapter } from "./adapters/anthropic-greenhouse";

const ADAPTERS: Adapter[] = [
  torreAdapter,
  remoteokAdapter,
  getonboardAdapter,
  anthropicGreenhouseAdapter,
];

export type AggregatorRunSummary = {
  runId: string;
  status: "success" | "partial" | "failed";
  totalResults: number;
  newOffers: number;
  duplicates: number;
  filtered: number;
  perAdapter: Record<string, { fetched: number; inserted: number; dups: number; errors: string[] }>;
  errors: string[];
};

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 100);
}

export async function runAggregators(maxPerAdapter = 30): Promise<AggregatorRunSummary> {
  const sb = createAdminClient();
  const allowedEmail = process.env.ALLOWED_EMAIL;
  let ownerId: string | null = null;
  if (allowedEmail) {
    const { data } = await sb.auth.admin.listUsers();
    ownerId =
      data?.users.find((u) => u.email?.toLowerCase() === allowedEmail.toLowerCase())?.id ?? null;
  }

  const started = new Date().toISOString();
  const { data: runRow } = await sb
    .from("scrape_runs")
    .insert({
      kind: "adzuna_sync", // reuse this kind enum value for "aggregators"
      status: "success",
      started_at: started,
      queries: [],
      engines_used: ADAPTERS.map((a) => a.id),
    })
    .select("id")
    .single();
  const runId = runRow?.id ?? "";

  const perAdapter: AggregatorRunSummary["perAdapter"] = {};
  const errors: string[] = [];
  let totalResults = 0;
  let newOffers = 0;
  let duplicates = 0;
  let filtered = 0;

  const allRaw: RawJob[] = [];
  await Promise.all(
    ADAPTERS.filter((a) => a.enabled()).map(async (adapter) => {
      perAdapter[adapter.id] = { fetched: 0, inserted: 0, dups: 0, errors: [] };
      try {
        const jobs = await adapter.fetchJobs({ maxJobs: maxPerAdapter });
        perAdapter[adapter.id].fetched = jobs.length;
        totalResults += jobs.length;
        allRaw.push(...jobs);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        perAdapter[adapter.id].errors.push(msg);
        errors.push(`${adapter.id}: ${msg}`);
      }
    }),
  );

  for (const job of allRaw) {
    if (!job.title || !job.company) {
      filtered++;
      continue;
    }

    const companySlug = slugify(job.company);
    const { data: company, error: cErr } = await sb
      .from("companies")
      .upsert({ name: job.company, slug: companySlug }, { onConflict: "slug" })
      .select("*")
      .single();
    if (cErr || !company) {
      errors.push(`company upsert ${job.company}: ${cErr?.message}`);
      continue;
    }

    const fit = computeFitScore({
      title: job.title,
      location: job.location,
      country: job.country,
      modality: job.modality,
      description: job.description,
      tags: job.tags,
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

    const hash = computeDedupHash({
      company: company.name,
      title: job.title,
      city: job.location,
      source_url: job.url,
    });

    const { data: existing } = await sb
      .from("offers")
      .select("id")
      .eq("dedup_hash", hash)
      .maybeSingle();
    if (existing) {
      duplicates++;
      perAdapter[job.source].dups++;
      continue;
    }

    if (!ownerId) {
      filtered++;
      continue;
    }

    const { error: insertErr } = await sb.from("offers").insert({
      user_id: ownerId,
      company_id: company.id,
      title: job.title,
      location: job.location,
      country: job.country,
      modality: job.modality ?? "unknown",
      source: job.source,
      source_url: job.url,
      posted_at: job.postedAt ?? null,
      fit_score: fit.total,
      company_quality_score: quality.total,
      opportunity_priority_score: priority,
      fit_tier: fit.tier,
      status: "pendiente",
      tags: job.tags ?? [],
      dedup_hash: hash,
    });

    if (insertErr) {
      errors.push(`insert ${job.company} / ${job.title}: ${insertErr.message}`);
    } else {
      newOffers++;
      perAdapter[job.source].inserted++;
    }
  }

  const status: AggregatorRunSummary["status"] =
    errors.length === 0 ? "success" : newOffers > 0 || totalResults > 0 ? "partial" : "failed";

  const summaryMd = [
    `# Aggregators run · ${started}`,
    ``,
    `Total fetched: ${totalResults}`,
    `New: ${newOffers} · Dups: ${duplicates} · Filtered: ${filtered}`,
    ``,
    `## Per adapter`,
    ...Object.entries(perAdapter).map(
      ([id, s]) => `- **${id}**: fetched ${s.fetched} · inserted ${s.inserted} · dups ${s.dups}${s.errors.length ? ` · errors: ${s.errors.join("; ")}` : ""}`,
    ),
    errors.length ? `\n## Errors\n${errors.map((e) => `- ${e}`).join("\n")}` : "",
  ].join("\n");

  if (runId) {
    await sb
      .from("scrape_runs")
      .update({
        status,
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
    status,
    totalResults,
    newOffers,
    duplicates,
    filtered,
    perAdapter,
    errors,
  };
}
