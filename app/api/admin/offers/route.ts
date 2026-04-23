import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { computeDedupHash } from "@/lib/dedup";
import {
  computeCompanyQuality,
  computeFitScore,
  computeOpportunityPriority,
} from "@/lib/scoring";

export const dynamic = "force-dynamic";

const OfferSchema = z.object({
  user_id: z.string().uuid().optional(),
  user_email: z.string().email().optional(),
  title: z.string().min(2),
  company: z.string().min(1),
  location: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  modality: z
    .enum(["remoto", "hibrido", "presencial", "hibrido-remoto", "unknown"])
    .optional()
    .default("unknown"),
  source: z.string().optional().default("cowork"),
  source_url: z.string().url().optional().nullable(),
  posted_at: z.string().optional().nullable(),
  deadline: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  why_it_matches: z.string().optional().nullable(),
  recommended_action: z.string().optional().nullable(),
  risks: z.array(z.string()).optional().default([]),
  tags: z.array(z.string()).optional().default([]),
  status: z
    .enum([
      "pendiente",
      "investigar",
      "aplicado",
      "entrevistando",
      "oferta",
      "rechazado",
      "archivado",
    ])
    .optional()
    .default("pendiente"),
});

async function resolveUserId(
  sb: ReturnType<typeof createAdminClient>,
  body: z.infer<typeof OfferSchema>,
): Promise<string | null> {
  if (body.user_id) return body.user_id;
  const email = body.user_email ?? process.env.ALLOWED_EMAIL;
  if (!email) return null;
  const { data } = await sb.auth.admin.listUsers();
  const found = data?.users.find(
    (u) => u.email?.toLowerCase() === email.toLowerCase(),
  );
  return found?.id ?? null;
}

export async function GET(req: NextRequest) {
  const guard = requireAdmin(req);
  if (guard) return guard;

  const sb = createAdminClient();
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const fitTier = searchParams.get("fit_tier");
  const limit = Math.min(Number(searchParams.get("limit") ?? "50"), 200);

  let query = sb
    .from("offers")
    .select("*, companies(name, quality_signal)")
    .order("opportunity_priority_score", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(limit);

  if (status) query = query.eq("status", status);
  if (fitTier) query = query.eq("fit_tier", fitTier);

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, count: data?.length ?? 0, offers: data });
}

export async function POST(req: NextRequest) {
  const guard = requireAdmin(req);
  if (guard) return guard;

  const body = await req.json().catch(() => null);
  const parsed = OfferSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid body", issues: parsed.error.issues },
      { status: 400 },
    );
  }
  const input = parsed.data;
  const sb = createAdminClient();

  const userId = await resolveUserId(sb, input);
  if (!userId) {
    return NextResponse.json(
      { error: "cannot resolve user_id (set ALLOWED_EMAIL or send user_id)" },
      { status: 400 },
    );
  }

  const companySlug = input.company
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  const { data: company, error: cErr } = await sb
    .from("companies")
    .upsert(
      { name: input.company, slug: companySlug },
      { onConflict: "slug" },
    )
    .select("*")
    .single();
  if (cErr || !company) {
    return NextResponse.json(
      { error: cErr?.message ?? "company upsert failed" },
      { status: 500 },
    );
  }

  const fit = computeFitScore({
    title: input.title,
    location: input.location,
    country: input.country,
    modality: input.modality,
    description: input.description,
    tags: input.tags,
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
    title: input.title,
    city: input.location,
    source_url: input.source_url,
  });

  // Dedup check
  const { data: existing } = await sb
    .from("offers")
    .select("id")
    .eq("dedup_hash", hash)
    .maybeSingle();
  if (existing) {
    return NextResponse.json({
      ok: true,
      duplicate: true,
      offer_id: existing.id,
      fit,
      priority,
    });
  }

  const { data: inserted, error: insErr } = await sb
    .from("offers")
    .insert({
      user_id: userId,
      company_id: company.id,
      title: input.title,
      location: input.location,
      country: input.country,
      modality: input.modality,
      source: input.source,
      source_url: input.source_url,
      posted_at: input.posted_at,
      deadline: input.deadline,
      fit_score: fit.total,
      company_quality_score: quality.total,
      opportunity_priority_score: priority,
      fit_tier: fit.tier,
      status: input.status,
      why_it_matches: input.why_it_matches,
      recommended_action: input.recommended_action,
      risks: input.risks,
      tags: input.tags,
      dedup_hash: hash,
    })
    .select("id")
    .single();

  if (insErr || !inserted) {
    return NextResponse.json(
      { error: insErr?.message ?? "insert failed" },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    offer_id: inserted.id,
    fit_breakdown: fit,
    quality_breakdown: quality,
    priority,
  });
}
