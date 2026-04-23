import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const IntelSchema = z.object({
  title: z.string().min(1).max(200),
  body_md: z.string().min(1).max(8000),
});

/**
 * Leave a note from Cowork that shows up on the Tablero "Nota Cowork" card.
 * Implementation: insert into activity_log with kind='cowork_intel'.
 */
export async function POST(req: NextRequest) {
  const guard = requireAdmin(req);
  if (guard) return guard;

  const body = await req.json().catch(() => null);
  const parsed = IntelSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid body", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const sb = createAdminClient();
  const email = process.env.ALLOWED_EMAIL;
  if (!email) {
    return NextResponse.json({ error: "ALLOWED_EMAIL missing" }, { status: 500 });
  }
  const { data } = await sb.auth.admin.listUsers();
  const owner = data?.users.find(
    (u) => u.email?.toLowerCase() === email.toLowerCase(),
  );
  if (!owner) {
    return NextResponse.json({ error: "owner user not found" }, { status: 404 });
  }

  const { data: inserted, error } = await sb
    .from("activity_log")
    .insert({
      user_id: owner.id,
      kind: "cowork_intel",
      meta: { title: parsed.data.title, body_md: parsed.data.body_md },
    })
    .select("id, at")
    .single();

  if (error || !inserted) {
    return NextResponse.json(
      { error: error?.message ?? "insert failed" },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, id: inserted.id, at: inserted.at });
}

export async function GET(req: NextRequest) {
  const guard = requireAdmin(req);
  if (guard) return guard;
  const sb = createAdminClient();
  const { data } = await sb
    .from("activity_log")
    .select("id, at, meta")
    .eq("kind", "cowork_intel")
    .order("at", { ascending: false })
    .limit(20);
  return NextResponse.json({ ok: true, notes: data ?? [] });
}
