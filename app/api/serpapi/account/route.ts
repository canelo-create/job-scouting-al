import { NextResponse } from "next/server";
import { getAccount } from "@/lib/serpapi/quota";
import { getAuthedUser } from "@/lib/auth/require-user";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getAuthedUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  try {
    const acc = await getAccount();
    return NextResponse.json({ ok: true, account: acc });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : String(e) },
      { status: 500 },
    );
  }
}
