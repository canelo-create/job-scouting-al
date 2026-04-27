import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { getAuthedUser } from "@/lib/auth/require-user";
import AddEventForm from "@/components/calendar/AddEventForm";
import EventList, { type EventItem } from "@/components/calendar/EventList";

export const dynamic = "force-dynamic";

async function loadEvents(userId: string): Promise<EventItem[]> {
  if (!isSupabaseConfigured()) return [];
  const sb = createAdminClient();
  const { data } = await sb
    .from("events")
    .select("id, title, kind, starts_at, ends_at, location, meeting_url, offer_id, notes")
    .eq("user_id", userId)
    .gte("starts_at", new Date(Date.now() - 24 * 3600 * 1000).toISOString())
    .order("starts_at", { ascending: true })
    .limit(100);
  return (data ?? []) as EventItem[];
}

async function loadOffers(userId: string) {
  if (!isSupabaseConfigured()) return [];
  const sb = createAdminClient();
  const { data } = await sb
    .from("offers")
    .select("id, title, companies(name)")
    .eq("user_id", userId)
    .in("status", ["pendiente", "investigar", "aplicado", "entrevistando", "oferta"])
    .order("opportunity_priority_score", { ascending: false, nullsFirst: false })
    .limit(60);
  return (data ?? []).map((o) => ({
    id: o.id as string,
    title: o.title as string,
    company: (o.companies as { name?: string } | null)?.name ?? null,
  }));
}

export default async function CalendarioPage() {
  const user = await getAuthedUser();
  const [events, offers] = user
    ? await Promise.all([loadEvents(user.id), loadOffers(user.id)])
    : [[], []];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-heading text-xl font-semibold">Calendario</h2>
          <p className="text-sm text-muted-foreground">
            Entrevistas, follow-ups y deadlines. Manual por ahora — sync con
            Google Calendar más adelante.
          </p>
        </div>
        <AddEventForm offers={offers} />
      </div>

      <EventList events={events} />
    </div>
  );
}
