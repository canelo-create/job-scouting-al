"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireUser } from "@/lib/auth/require-user";
import { computeDedupHash } from "@/lib/dedup";
import {
  computeCompanyQuality,
  computeFitScore,
  computeOpportunityPriority,
} from "@/lib/scoring";
import { isSupabaseConfigured } from "@/lib/supabase/server";

const OfferCreateSchema = z.object({
  title: z.string().min(2).max(200),
  company: z.string().min(1).max(200),
  location: z.string().max(200).optional().nullable(),
  country: z.string().max(60).optional().nullable(),
  modality: z
    .enum(["remoto", "hibrido", "presencial", "hibrido-remoto", "unknown"])
    .optional()
    .nullable(),
  source: z.string().max(60).optional().nullable(),
  source_url: z.string().url().optional().nullable(),
  description: z.string().optional().nullable(),
  tags: z.array(z.string()).optional().default([]),
});

export type CreateOfferResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

export async function createOffer(formData: FormData): Promise<CreateOfferResult> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "Supabase no configurado" };
  }
  const user = await requireUser();
  if (user.isDev) {
    return { ok: false, error: "No puedes crear ofertas en dev shim" };
  }

  const raw = {
    title: formData.get("title"),
    company: formData.get("company"),
    location: formData.get("location") || null,
    country: formData.get("country") || null,
    modality: formData.get("modality") || null,
    source: formData.get("source") || "manual",
    source_url: formData.get("source_url") || null,
    description: formData.get("description") || null,
    tags: [],
  };

  const parsed = OfferCreateSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "invalid" };
  }
  const input = parsed.data;

  const sb = createAdminClient();

  // Upsert company
  const companySlug = input.company
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  const { data: company, error: companyErr } = await sb
    .from("companies")
    .upsert(
      { name: input.company, slug: companySlug },
      { onConflict: "slug", ignoreDuplicates: false },
    )
    .select("id, name, domain, official_site, careers_page, size, funding_stage, recent_news")
    .single();
  if (companyErr || !company) {
    return { ok: false, error: companyErr?.message ?? "company upsert failed" };
  }

  // Scoring
  const fit = computeFitScore({
    title: input.title,
    location: input.location ?? undefined,
    country: input.country ?? undefined,
    modality: input.modality ?? undefined,
    description: input.description ?? undefined,
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

  const dedupHash = computeDedupHash({
    company: company.name,
    title: input.title,
    city: input.location,
    source_url: input.source_url,
  });

  const { data: inserted, error: insertErr } = await sb
    .from("offers")
    .insert({
      user_id: user.id,
      company_id: company.id,
      title: input.title,
      location: input.location,
      country: input.country,
      modality: input.modality ?? "unknown",
      source: input.source,
      source_url: input.source_url,
      fit_score: fit.total,
      company_quality_score: quality.total,
      opportunity_priority_score: priority,
      fit_tier: fit.tier,
      status: "pendiente",
      tags: input.tags,
      dedup_hash: dedupHash,
    })
    .select("id")
    .single();

  if (insertErr || !inserted) {
    return { ok: false, error: insertErr?.message ?? "insert failed" };
  }

  revalidatePath("/pipeline");
  revalidatePath("/");
  return { ok: true, id: inserted.id };
}

const StatusSchema = z.enum([
  "pendiente",
  "investigar",
  "aplicado",
  "entrevistando",
  "oferta",
  "rechazado",
  "archivado",
]);

export async function updateOfferStatus(
  offerId: string,
  status: string,
): Promise<{ ok: boolean; error?: string }> {
  if (!isSupabaseConfigured()) return { ok: false, error: "no supabase" };
  const user = await requireUser();
  if (user.isDev) return { ok: false, error: "dev shim" };
  const parsed = StatusSchema.safeParse(status);
  if (!parsed.success) return { ok: false, error: "invalid status" };

  const sb = createAdminClient();
  const applied_at =
    parsed.data === "aplicado" ? new Date().toISOString() : undefined;
  const { error } = await sb
    .from("offers")
    .update({
      status: parsed.data,
      last_touched_at: new Date().toISOString(),
      ...(applied_at ? { applied_at } : {}),
    })
    .eq("id", offerId)
    .eq("user_id", user.id);

  if (error) return { ok: false, error: error.message };

  // Log activity
  if (parsed.data === "aplicado") {
    await sb.from("activity_log").insert({
      user_id: user.id,
      kind: "applied",
      offer_id: offerId,
    });
  } else if (parsed.data === "entrevistando") {
    await sb.from("activity_log").insert({
      user_id: user.id,
      kind: "interviewed",
      offer_id: offerId,
    });
  }

  revalidatePath("/pipeline");
  revalidatePath(`/pipeline/${offerId}`);
  revalidatePath("/");
  return { ok: true };
}

export async function markAsAppliedAction(
  offerId: string,
): Promise<{ ok: boolean; error?: string }> {
  return updateOfferStatus(offerId, "aplicado");
}

export async function deleteOffer(offerId: string): Promise<void> {
  if (!isSupabaseConfigured()) return;
  const user = await requireUser();
  if (user.isDev) return;
  const sb = createAdminClient();
  await sb.from("offers").delete().eq("id", offerId).eq("user_id", user.id);
  revalidatePath("/pipeline");
  redirect("/pipeline");
}
