"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/require-user";
import { runScout, type ScoutSummary } from "@/lib/serpapi/scout";

export async function runScoutNow(): Promise<
  { ok: true; summary: ScoutSummary } | { ok: false; error: string }
> {
  const user = await requireUser();
  if (user.isDev) return { ok: false, error: "No disponible en dev shim" };
  try {
    const summary = await runScout({ maxSearches: 3, minRemaining: 5 });
    revalidatePath("/radar");
    revalidatePath("/pipeline");
    revalidatePath("/");
    return { ok: true, summary };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : String(e),
    };
  }
}
