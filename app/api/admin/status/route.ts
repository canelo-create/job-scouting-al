import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { GRADUATION_DATE, runwayDays } from "@/lib/constants";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const guard = requireAdmin(req);
  if (guard) return guard;

  const sb = createAdminClient();

  const [
    { count: totalOffers },
    { count: pendientes },
    { count: aplicados },
    { count: entrevistando },
    { count: ofertasCount },
    { data: nextEvent },
    { data: lastRun },
    { data: streak },
    { data: profile },
  ] = await Promise.all([
    sb.from("offers").select("*", { count: "exact", head: true }),
    sb
      .from("offers")
      .select("*", { count: "exact", head: true })
      .eq("status", "pendiente"),
    sb
      .from("offers")
      .select("*", { count: "exact", head: true })
      .eq("status", "aplicado"),
    sb
      .from("offers")
      .select("*", { count: "exact", head: true })
      .eq("status", "entrevistando"),
    sb
      .from("offers")
      .select("*", { count: "exact", head: true })
      .eq("status", "oferta"),
    sb
      .from("events")
      .select("id, title, kind, starts_at, offer_id")
      .gt("starts_at", new Date().toISOString())
      .order("starts_at", { ascending: true })
      .limit(1)
      .maybeSingle(),
    sb
      .from("scrape_runs")
      .select("id, kind, status, new_offers, total_results, started_at, summary_md")
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    sb.from("streaks").select("*").limit(1).maybeSingle(),
    sb.from("candidate_profile").select("user_id, updated_at").limit(1).maybeSingle(),
  ]);

  return NextResponse.json({
    ok: true,
    generated_at: new Date().toISOString(),
    runway_days: runwayDays(GRADUATION_DATE),
    profile_seeded: Boolean(profile),
    pipeline: {
      total: totalOffers ?? 0,
      pendientes: pendientes ?? 0,
      aplicados: aplicados ?? 0,
      entrevistando: entrevistando ?? 0,
      ofertas: ofertasCount ?? 0,
    },
    next_event: nextEvent,
    last_scrape: lastRun,
    streak: streak,
  });
}
