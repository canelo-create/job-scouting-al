import {
  Radar,
  Kanban,
  CalendarDays,
  Flame,
  Activity,
  MessageSquare,
} from "lucide-react";
import DashboardCard from "@/components/common/DashboardCard";
import RunwayBanner from "@/components/layout/RunwayBanner";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { getAuthedUser } from "@/lib/auth/require-user";
import { ensureCandidateProfile, ensureStreak } from "@/lib/profile/ensure";
import { format } from "date-fns";

export const dynamic = "force-dynamic";

async function loadMetrics(userId: string) {
  if (!isSupabaseConfigured()) {
    return {
      newToday: 0,
      activePipeline: 0,
      nextEvent: null as { title: string; starts_at: string } | null,
      streak: 0,
      lastScrape: null as { new_offers: number } | null,
      coworkNote: null as { title: string; at: string } | null,
    };
  }
  const sb = createAdminClient();
  const since = new Date();
  since.setHours(0, 0, 0, 0);

  const [
    newTodayRes,
    activeRes,
    nextEventRes,
    streakRes,
    lastScrapeRes,
    coworkNoteRes,
  ] = await Promise.all([
    sb
      .from("offers")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("created_at", since.toISOString()),
    sb
      .from("offers")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .in("status", ["aplicado", "entrevistando"]),
    sb
      .from("events")
      .select("title, starts_at")
      .eq("user_id", userId)
      .gt("starts_at", new Date().toISOString())
      .order("starts_at", { ascending: true })
      .limit(1)
      .maybeSingle(),
    sb
      .from("streaks")
      .select("current_days")
      .eq("user_id", userId)
      .maybeSingle(),
    sb
      .from("scrape_runs")
      .select("new_offers")
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    sb
      .from("activity_log")
      .select("meta, at")
      .eq("user_id", userId)
      .eq("kind", "cowork_intel")
      .order("at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const coworkNote = coworkNoteRes.data
    ? {
        title:
          (coworkNoteRes.data.meta as { title?: string } | null)?.title ??
          "Nota sin título",
        at: coworkNoteRes.data.at as string,
      }
    : null;

  return {
    newToday: newTodayRes.count ?? 0,
    activePipeline: activeRes.count ?? 0,
    nextEvent: (nextEventRes.data as { title: string; starts_at: string } | null) ?? null,
    streak: streakRes.data?.current_days ?? 0,
    lastScrape: (lastScrapeRes.data as { new_offers: number } | null) ?? null,
    coworkNote,
  };
}

export default async function Dashboard() {
  const user = await getAuthedUser();
  if (user && !user.isDev && isSupabaseConfigured()) {
    await Promise.all([ensureCandidateProfile(user.id), ensureStreak(user.id)]);
  }
  const metrics = user ? await loadMetrics(user.id) : null;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="font-heading text-xl font-semibold">Tablero</h2>
        <p className="text-sm text-muted-foreground">
          Resumen de hoy. Click en cada tarjeta para detalle.
        </p>
      </div>

      <RunwayBanner />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <DashboardCard
          title="Radar hoy"
          value={metrics?.newToday ?? 0}
          hint={
            metrics?.lastScrape
              ? `${metrics.lastScrape.new_offers} del último scrape`
              : "El cron corre 08:00 CET"
          }
          href="/radar"
          icon={Radar}
        />
        <DashboardCard
          title="Pipeline activo"
          value={metrics?.activePipeline ?? 0}
          hint="Aplicado + entrevistando"
          href="/pipeline"
          icon={Kanban}
          tone="primary"
        />
        <DashboardCard
          title="Próximo evento"
          value={metrics?.nextEvent ? format(new Date(metrics.nextEvent.starts_at), "dd MMM") : "—"}
          hint={metrics?.nextEvent?.title ?? "Sin entrevistas agendadas"}
          href="/calendario"
          icon={CalendarDays}
        />
        <DashboardCard
          title="Streak"
          value={metrics?.streak ?? 0}
          hint="Días seguidos con actividad"
          href="/progreso"
          icon={Flame}
          tone="warn"
        />
        <DashboardCard
          title="Quota SerpApi"
          value="—"
          hint="Se actualiza en cada scrape"
          href="/radar"
          icon={Activity}
        />
        <DashboardCard
          title="Nota Cowork"
          value={metrics?.coworkNote?.title ?? "Sin notas"}
          hint={
            metrics?.coworkNote
              ? format(new Date(metrics.coworkNote.at), "dd MMM HH:mm")
              : "Cowork dejará notas vía /api/admin/intel"
          }
          icon={MessageSquare}
        />
      </div>
    </div>
  );
}
