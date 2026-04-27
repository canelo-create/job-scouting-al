"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth/require-user";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/server";

const EventSchema = z.object({
  title: z.string().min(2).max(200),
  kind: z.enum(["entrevista", "follow_up", "deadline", "reunion", "preparacion", "otro"]),
  starts_at: z.string().min(10),
  ends_at: z.string().optional().nullable(),
  location: z.string().max(300).optional().nullable(),
  meeting_url: z.string().url().optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
  offer_id: z.string().uuid().optional().nullable(),
});

export type CreateEventResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

export async function createEvent(formData: FormData): Promise<CreateEventResult> {
  if (!isSupabaseConfigured()) return { ok: false, error: "Supabase no configurado" };
  const user = await requireUser();
  if (user.isDev) return { ok: false, error: "dev shim" };

  const startsRaw = String(formData.get("starts_at") ?? "");
  const endsRaw = String(formData.get("ends_at") ?? "");
  const offerIdRaw = String(formData.get("offer_id") ?? "");

  const raw = {
    title: formData.get("title"),
    kind: formData.get("kind") || "entrevista",
    starts_at: startsRaw ? new Date(startsRaw).toISOString() : "",
    ends_at: endsRaw ? new Date(endsRaw).toISOString() : null,
    location: formData.get("location") || null,
    meeting_url: formData.get("meeting_url") || null,
    notes: formData.get("notes") || null,
    offer_id: offerIdRaw && offerIdRaw !== "none" ? offerIdRaw : null,
  };

  const parsed = EventSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "invalid" };
  }

  const sb = createAdminClient();
  const { data, error } = await sb
    .from("events")
    .insert({ user_id: user.id, ...parsed.data })
    .select("id")
    .single();
  if (error || !data) return { ok: false, error: error?.message ?? "insert failed" };

  revalidatePath("/calendario");
  revalidatePath("/");
  if (parsed.data.offer_id) revalidatePath(`/pipeline/${parsed.data.offer_id}`);
  return { ok: true, id: data.id };
}

export async function deleteEvent(eventId: string): Promise<{ ok: boolean; error?: string }> {
  if (!isSupabaseConfigured()) return { ok: false, error: "no supabase" };
  const user = await requireUser();
  if (user.isDev) return { ok: false, error: "dev shim" };
  const sb = createAdminClient();
  const { error } = await sb.from("events").delete().eq("id", eventId).eq("user_id", user.id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/calendario");
  revalidatePath("/");
  return { ok: true };
}
