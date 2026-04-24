import { type NextRequest, NextResponse } from "next/server";
import { getAuthedUser } from "@/lib/auth/require-user";
import { createAdminClient } from "@/lib/supabase/admin";
import { buildCvDocx } from "@/lib/docx/build-cv";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const user = await getAuthedUser();
  if (!user) return new NextResponse("unauthorized", { status: 401 });

  const sb = createAdminClient();
  const { data } = await sb
    .from("cv_documents")
    .select("id, kind, version, content_md, offer_id, created_at, offers(title, companies(name))")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!data) return new NextResponse("not found", { status: 404 });

  const doc = data as unknown as {
    id: string;
    kind: string;
    version: number;
    content_md: string;
    offer_id: string | null;
    offers:
      | { title: string; companies: { name: string }[] | { name: string } | null }
      | Array<{
          title: string;
          companies: { name: string }[] | { name: string } | null;
        }>
      | null;
  };

  const offers = Array.isArray(doc.offers) ? doc.offers[0] : doc.offers;
  const companies = offers
    ? Array.isArray(offers.companies)
      ? offers.companies[0]
      : offers.companies
    : null;

  const buf = await buildCvDocx(doc.content_md);
  const safeName = (companies?.name ?? "base")
    .replace(/[^a-zA-Z0-9]/g, "_")
    .slice(0, 30);
  const filename = `${doc.kind}_Andres_Lince_${safeName}_v${doc.version}.docx`;

  return new NextResponse(new Uint8Array(buf), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
