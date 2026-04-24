import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getAuthedUser } from "@/lib/auth/require-user";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAnthropicConfigured } from "@/lib/anthropic/client";
import { generateAdaptedCv, generateCoverLetter } from "@/lib/anthropic/generate-cv";
import { BASE_CV } from "@/lib/profile/base-cv";
import type { Offer } from "@/lib/offers/types";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const Schema = z.object({
  offer_id: z.string().uuid(),
  language: z.enum(["es", "en"]).optional().default("en"),
  kinds: z
    .array(z.enum(["cv", "cover_letter"]))
    .optional()
    .default(["cv", "cover_letter"]),
});

export async function POST(req: NextRequest) {
  const user = await getAuthedUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (user.isDev)
    return NextResponse.json({ error: "dev shim" }, { status: 400 });
  if (!isAnthropicConfigured()) {
    return NextResponse.json(
      {
        error:
          "Anthropic no configurado. Crear key en console.anthropic.com y agregar ANTHROPIC_API_KEY en Vercel env.",
      },
      { status: 503 },
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid body", issues: parsed.error.issues },
      { status: 400 },
    );
  }
  const { offer_id, language, kinds } = parsed.data;

  const sb = createAdminClient();
  const { data: offerRow } = await sb
    .from("offers")
    .select("*, companies(name)")
    .eq("id", offer_id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!offerRow) {
    return NextResponse.json({ error: "offer not found" }, { status: 404 });
  }

  const offer = offerRow as Offer & {
    companies: { name: string } | null;
  };
  const offerWithCompany = {
    ...offer,
    company_name: offer.companies?.name ?? null,
    description: null as string | null,
  };

  const results: Record<string, { id: string; version: number; tokens: number }> = {};

  if (kinds.includes("cv")) {
    const { markdown, tokens } = await generateAdaptedCv({
      baseCV: BASE_CV,
      offer: offerWithCompany,
      language,
    });
    const { data: prev } = await sb
      .from("cv_documents")
      .select("version")
      .eq("user_id", user.id)
      .eq("offer_id", offer_id)
      .eq("kind", "cv")
      .order("version", { ascending: false })
      .limit(1)
      .maybeSingle();
    const version = (prev?.version ?? 0) + 1;
    const { data: inserted } = await sb
      .from("cv_documents")
      .insert({
        user_id: user.id,
        offer_id,
        kind: "cv",
        version,
        content_md: markdown,
      })
      .select("id")
      .single();
    if (inserted) {
      results.cv = { id: inserted.id, version, tokens };
    }
  }

  if (kinds.includes("cover_letter")) {
    const { markdown, tokens } = await generateCoverLetter({
      baseCV: BASE_CV,
      offer: offerWithCompany,
      language,
    });
    const { data: prev } = await sb
      .from("cv_documents")
      .select("version")
      .eq("user_id", user.id)
      .eq("offer_id", offer_id)
      .eq("kind", "cover_letter")
      .order("version", { ascending: false })
      .limit(1)
      .maybeSingle();
    const version = (prev?.version ?? 0) + 1;
    const { data: inserted } = await sb
      .from("cv_documents")
      .insert({
        user_id: user.id,
        offer_id,
        kind: "cover_letter",
        version,
        content_md: markdown,
      })
      .select("id")
      .single();
    if (inserted) {
      results.cover_letter = { id: inserted.id, version, tokens };
    }
  }

  // Log activity
  await sb.from("activity_log").insert({
    user_id: user.id,
    kind: "cv_generated",
    offer_id,
    meta: results,
  });

  return NextResponse.json({ ok: true, results });
}
