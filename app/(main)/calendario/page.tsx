import { CalendarDays, Link2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { getAuthedUser } from "@/lib/auth/require-user";
import EmptyState from "@/components/common/EmptyState";
import { format } from "date-fns";

export const dynamic = "force-dynamic";

type EventRow = {
  id: string;
  title: string;
  kind: string;
  starts_at: string;
  ends_at: string | null;
  location: string | null;
  offer_id: string | null;
  prep_tips_md: string | null;
};

async function loadEvents(userId: string): Promise<EventRow[]> {
  if (!isSupabaseConfigured()) return [];
  const sb = createAdminClient();
  const { data } = await sb
    .from("events")
    .select("id, title, kind, starts_at, ends_at, location, offer_id, prep_tips_md")
    .eq("user_id", userId)
    .gte("starts_at", new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString())
    .order("starts_at", { ascending: true })
    .limit(50);
  return (data ?? []) as EventRow[];
}

async function hasGoogleIntegration(userId: string): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  const sb = createAdminClient();
  const { data } = await sb
    .from("google_integrations")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();
  return Boolean(data);
}

export default async function CalendarioPage() {
  const user = await getAuthedUser();
  const events = user ? await loadEvents(user.id) : [];
  const connected = user ? await hasGoogleIntegration(user.id) : false;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="font-heading text-xl font-semibold">Calendario</h2>
        <p className="text-sm text-muted-foreground">
          Entrevistas + recordatorios + tips generados con Anthropic.
        </p>
      </div>

      {!connected ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Link2 className="size-4" /> Conectar Google Calendar
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <p className="text-sm text-muted-foreground">
              OAuth 2.0 con scope `calendar.events` + `calendar.readonly`.
              Cuando agregues un evento `entrevista` acá, se crea en tu GCal con
              tips de prep generados por Claude en la descripción.
            </p>
            <Button asChild size="sm" className="w-fit">
              <Link href="/api/google/oauth-init">Conectar Google Calendar</Link>
            </Button>
            <p className="text-[11px] text-muted-foreground">
              ⚠️ Requiere agregar el redirect URI de producción en Google Cloud Console primero.
            </p>
          </CardContent>
        </Card>
      ) : null}

      {events.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="Sin eventos en la vista"
          description="Una vez con entrevistas agendadas, aparecen acá con tips de prep expandibles."
        />
      ) : (
        <div className="flex flex-col gap-2">
          {events.map((e) => (
            <div
              key={e.id}
              className="rounded-md border border-border bg-card p-3"
            >
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="font-medium">{e.title}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {format(new Date(e.starts_at), "EEE dd MMM · HH:mm")}
                    {e.location ? ` · ${e.location}` : ""}
                  </p>
                </div>
                <span className="rounded-md bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                  {e.kind}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
