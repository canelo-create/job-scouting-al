import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const EventSchema = z.object({
  title: z.string().min(2),
  kind: z
    .enum(["entrevista", "follow_up", "deadline", "reunion", "preparacion", "otro"])
    .default("entrevista"),
  starts_at: z.string(),
  ends_at: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  meeting_url: z.string().url().optional().nullable(),
  notes: z.string().optional().nullable(),
  offer_id: z.string().uuid().optional().nullable(),
  user_email: z.string().email().optional(),
});

export async function GET(req: NextRequest) {
  const guard = requireAdmin(req);
  if (guard) return guard;
  const sb = createAdminClient();
  const { data } = await sb
    .from("events")
    .select("id, title, kind, starts_at, ends_at, location, meeting_url, offer_id, notes, created_at")
    .order("starts_at", { ascending: true });
  return NextResponse.json({ ok: true, count: data?.length ?? 0, events: data ?? [] });
}

export async function POST(req: NextRequest) {
  const guard = requireAdmin(req);
  if (guard) return guard;

  const body = await req.json().catch(() => null);
  const parsed = EventSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid body", issues: parsed.error.issues },
      { status: 400 },
    );
  }
  const input = parsed.data;
  const sb = createAdminClient();

  const email = input.user_email ?? process.env.ALLOWED_EMAIL;
  if (!email) {
    return NextResponse.json({ error: "no user_email + no ALLOWED_EMAIL" }, { status: 400 });
  }
  const { data: usersData } = await sb.auth.admin.listUsers();
  const owner = usersData?.users.find(
    (u) => u.email?.toLowerCase() === email.toLowerCase(),
  );
  if (!owner) {
    return NextResponse.json({ error: "owner user not found" }, { status: 404 });
  }

  const startsAt = new Date(input.starts_at);
  if (Number.isNaN(startsAt.getTime())) {
    return NextResponse.json({ error: "invalid starts_at date" }, { status: 400 });
  }

  const { data, error } = await sb
    .from("events")
    .insert({
      user_id: owner.id,
      title: input.title,
      kind: input.kind,
      starts_at: startsAt.toISOString(),
      ends_at: input.ends_at ? new Date(input.ends_at).toISOString() : null,
      location: input.location ?? null,
      meeting_url: input.meeting_url ?? null,
      notes: input.notes ?? null,
      offer_id: input.offer_id ?? null,
    })
    .select("id, starts_at")
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: error?.message ?? "insert failed" },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, event_id: data.id, starts_at: data.starts_at });
}
