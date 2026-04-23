import { NextResponse, type NextRequest } from "next/server";

/**
 * Guard admin API routes with COWORK_ADMIN_TOKEN.
 * Returns NextResponse 401 if missing/invalid, null if authorized.
 */
export function requireAdmin(req: NextRequest): NextResponse | null {
  const header = req.headers.get("authorization") ?? "";
  const token = header.replace(/^Bearer\s+/i, "");
  const expected = process.env.COWORK_ADMIN_TOKEN;
  if (!expected) {
    return NextResponse.json(
      { error: "admin token not configured" },
      { status: 500 },
    );
  }
  if (!token || token !== expected) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  return null;
}

export function requireCron(req: NextRequest): NextResponse | null {
  // Vercel cron sends 'authorization: Bearer <CRON_SECRET>'
  const header = req.headers.get("authorization") ?? "";
  const token = header.replace(/^Bearer\s+/i, "");
  const expected = process.env.CRON_SECRET;
  if (!expected) {
    return NextResponse.json(
      { error: "cron secret not configured" },
      { status: 500 },
    );
  }
  if (!token || token !== expected) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  return null;
}
