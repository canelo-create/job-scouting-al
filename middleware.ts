import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

const PUBLIC_PATHS = ["/login", "/auth/callback"];

const BYPASS_PREFIXES = [
  "/api/cron",
  "/api/admin",
  "/api/extension",
  "/api/webhook",
  "/_next",
  "/favicon",
  "/icon",
  "/manifest",
];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (BYPASS_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const allowed = process.env.ALLOWED_EMAIL;

  // Dev shim: Supabase not configured → let through so we can iterate on the
  // Shell locally. Once env vars are set, the single-user lock kicks in.
  if (!url || !anon) {
    const res = NextResponse.next();
    res.headers.set("x-auth-mode", "dev-shim");
    return res;
  }

  let response = NextResponse.next({ request: req });

  const supabase = createServerClient(url, anon, {
    cookies: {
      getAll() {
        return req.cookies.getAll();
      },
      setAll(list) {
        list.forEach(({ name, value }) => req.cookies.set(name, value));
        response = NextResponse.next({ request: req });
        list.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isPublic = PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );

  if (!user && !isPublic) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (user && allowed && user.email?.toLowerCase() !== allowed.toLowerCase()) {
    await supabase.auth.signOut();
    return new NextResponse("Forbidden — single-user portal", { status: 403 });
  }

  if (user && pathname === "/login") {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon.svg|manifest.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff2?)$).*)",
  ],
};
