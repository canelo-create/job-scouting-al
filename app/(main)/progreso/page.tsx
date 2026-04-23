import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { getAuthedUser } from "@/lib/auth/require-user";
import WeeklyRings from "@/components/progress/WeeklyRings";
import FunnelChart from "@/components/progress/FunnelChart";
import { Flame } from "lucide-react";

export const dynamic = "force-dynamic";

async function loadActivity(userId: string) {
  if (!isSupabaseConfigured()) {
    return { applied: 0, followUp: 0, casePrep: 0 };
  }
  const sb = createAdminClient();
  const weekAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();
  const { data } = await sb
    .from("activity_log")
    .select("kind, at")
    .eq("user_id", userId)
    .gte("at", weekAgo);
  const rows = data ?? [];
  return {
    applied: rows.filter((r) => r.kind === "applied").length,
    followUp: rows.filter((r) => r.kind === "followed_up").length,
    casePrep: rows.filter((r) => r.kind === "case_prep" || r.kind === "interviewed")
      .length,
  };
}

async function loadFunnel(userId: string) {
  if (!isSupabaseConfigured()) {
    return { pendiente: 0, aplicado: 0, entrevistando: 0, oferta: 0, aceptado: 0 };
  }
  const sb = createAdminClient();
  const statuses = [
    "pendiente",
    "aplicado",
    "entrevistando",
    "oferta",
    "archivado",
  ] as const;
  const results = await Promise.all(
    statuses.map((s) =>
      sb
        .from("offers")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("status", s),
    ),
  );
  return {
    pendiente: results[0].count ?? 0,
    aplicado: results[1].count ?? 0,
    entrevistando: results[2].count ?? 0,
    oferta: results[3].count ?? 0,
    aceptado: results[4].count ?? 0,
  };
}

async function loadStreak(userId: string) {
  if (!isSupabaseConfigured()) {
    return { current_days: 0, longest_days: 0 };
  }
  const sb = createAdminClient();
  const { data } = await sb
    .from("streaks")
    .select("current_days, longest_days")
    .eq("user_id", userId)
    .maybeSingle();
  return data ?? { current_days: 0, longest_days: 0 };
}

export default async function ProgresoPage() {
  const user = await getAuthedUser();
  if (!user) return null;

  const [activity, funnel, streak] = await Promise.all([
    loadActivity(user.id),
    loadFunnel(user.id),
    loadStreak(user.id),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="font-heading text-xl font-semibold">Progreso</h2>
        <p className="text-sm text-muted-foreground">
          Señales de actividad y conversión. Se actualizan automáticamente.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Esta semana</CardTitle>
        </CardHeader>
        <CardContent>
          <WeeklyRings
            rings={[
              {
                label: "Aplicaciones",
                value: activity.applied,
                target: 5,
                color: "#22D3EE",
              },
              {
                label: "Follow-ups",
                value: activity.followUp,
                target: 3,
                color: "#F97316",
              },
              {
                label: "Case prep",
                value: activity.casePrep,
                target: 2,
                color: "#22C55E",
              },
            ]}
          />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-[2fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Funnel</CardTitle>
          </CardHeader>
          <CardContent>
            <FunnelChart
              stages={[
                { label: "Pendiente", count: funnel.pendiente, color: "#8B9199" },
                { label: "Aplicado", count: funnel.aplicado, color: "#F97316" },
                {
                  label: "Entrevistando",
                  count: funnel.entrevistando,
                  color: "#22D3EE",
                },
                { label: "Oferta", count: funnel.oferta, color: "#22C55E" },
                { label: "Cerrado", count: funnel.aceptado, color: "#4ADE80" },
              ]}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Flame className="size-4 text-canelo-orange" /> Streak
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-heading text-3xl font-semibold">
              {streak.current_days}
              <span className="text-sm font-normal text-muted-foreground">
                {" "}
                días
              </span>
            </p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Longest: {streak.longest_days} días.
            </p>
            {streak.current_days === 0 ? (
              <p className="mt-3 text-xs text-muted-foreground">
                Hoy todavía no sumaste. Agregá una oferta o aplicá a una.
              </p>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
