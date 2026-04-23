import { createAdminClient } from "@/lib/supabase/admin";
import { CANDIDATE_PROFILE } from "./seed-data";

/**
 * Insert the candidate profile row for a user if it doesn't exist yet.
 * Idempotent — safe to call on every server page.
 */
export async function ensureCandidateProfile(userId: string): Promise<void> {
  const sb = createAdminClient();
  const { data, error: selErr } = await sb
    .from("candidate_profile")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();
  if (selErr) {
    console.error("[profile.ensure] select error", selErr);
    return;
  }
  if (data) return;
  const { error } = await sb.from("candidate_profile").insert({
    user_id: userId,
    data: CANDIDATE_PROFILE,
  });
  if (error) {
    console.error("[profile.ensure] insert error", error);
  }
}

/** Insert the streaks row for a user if it doesn't exist. */
export async function ensureStreak(userId: string): Promise<void> {
  const sb = createAdminClient();
  const { data, error: selErr } = await sb
    .from("streaks")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();
  if (selErr) return;
  if (data) return;
  await sb.from("streaks").insert({
    user_id: userId,
    current_days: 0,
    longest_days: 0,
    weekly_goal: { applications: 5, follow_ups: 3, case_prep: 2 },
  });
}
