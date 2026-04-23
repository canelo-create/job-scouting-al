import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

/** Dev shim fallback used when Supabase isn't configured locally. */
const DEV_USER_ID = "00000000-0000-0000-0000-000000000001";
const DEV_EMAIL = "dev@local";

export type AuthedUser = {
  id: string;
  email: string;
  isDev: boolean;
};

export async function requireUser(): Promise<AuthedUser> {
  if (!isSupabaseConfigured()) {
    return { id: DEV_USER_ID, email: DEV_EMAIL, isDev: true };
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }
  return { id: user.id, email: user.email ?? "", isDev: false };
}

/** Same as requireUser but returns null instead of redirecting. */
export async function getAuthedUser(): Promise<AuthedUser | null> {
  if (!isSupabaseConfigured()) {
    return { id: DEV_USER_ID, email: DEV_EMAIL, isDev: true };
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  return { id: user.id, email: user.email ?? "", isDev: false };
}
