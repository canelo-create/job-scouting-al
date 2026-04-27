import Link from "next/link";
import { Plus, Kanban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getAuthedUser } from "@/lib/auth/require-user";
import { createAdminClient } from "@/lib/supabase/admin";
import { ensureCandidateProfile, ensureStreak } from "@/lib/profile/ensure";
import OfferListItem from "@/components/pipeline/OfferListItem";
import EmptyState from "@/components/common/EmptyState";
import type { Offer, OfferStatus } from "@/lib/offers/types";
import { STATUS_LABELS, STATUS_ORDER } from "@/lib/offers/types";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type OfferWithCompany = Offer & {
  companies: { name: string } | null;
};

async function loadOffers(userId: string): Promise<OfferWithCompany[]> {
  if (!isSupabaseConfigured()) return [];
  const sb = createAdminClient();
  const { data, error } = await sb
    .from("offers")
    .select("*, companies(name)")
    .eq("user_id", userId)
    .order("opportunity_priority_score", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });
  if (error) {
    console.error("[pipeline] load offers error", error);
    return [];
  }
  return (data ?? []) as unknown as OfferWithCompany[];
}

export default async function PipelinePage() {
  const user = await getAuthedUser();
  if (!user) {
    return (
      <EmptyState
        title="No estás autenticado"
        description="Andá a /login para entrar."
      />
    );
  }

  if (!user.isDev && isSupabaseConfigured()) {
    await Promise.all([ensureCandidateProfile(user.id), ensureStreak(user.id)]);
  }

  const offers = await loadOffers(user.id);

  // Group by status
  const grouped = new Map<OfferStatus, OfferWithCompany[]>();
  for (const s of STATUS_ORDER) grouped.set(s, []);
  for (const o of offers) {
    grouped.get(o.status)?.push(o);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-heading text-xl font-semibold">Pipeline</h2>
          <p className="text-sm text-muted-foreground">
            {offers.length} {offers.length === 1 ? "oferta" : "ofertas"} en total.
          </p>
        </div>
        <Button asChild size="sm">
          <Link href="/pipeline/new">
            <Plus className="size-4" />
            Nueva oferta
          </Link>
        </Button>
      </div>

      {offers.length === 0 ? (
        <EmptyState
          icon={Kanban}
          title="Pipeline vacío"
          description="El cron de Radar corre mañana 08:00 CET. Mientras tanto podés agregar ofertas manualmente o esperar a que Cowork las empuje vía admin API."
          action={
            <Button asChild size="sm">
              <Link href="/pipeline/new">Agregar la primera</Link>
            </Button>
          }
        />
      ) : (
        <div className="flex flex-col gap-6">
          {STATUS_ORDER.map((status) => {
            const list = grouped.get(status) ?? [];
            if (list.length === 0) return null;
            return (
              <section key={status} className="flex flex-col gap-2">
                <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {STATUS_LABELS[status]} · {list.length}
                </h3>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {list.map((offer) => (
                    <OfferListItem
                      key={offer.id}
                      offer={offer}
                      companyName={offer.companies?.name ?? null}
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
