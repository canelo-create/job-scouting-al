import { CheckCircle2, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAuthedUser } from "@/lib/auth/require-user";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { GRADUATION_DATE, runwayDays } from "@/lib/constants";
import SignOutButton from "@/components/common/SignOutButton";

export const dynamic = "force-dynamic";

const INTEGRATIONS = [
  { key: "NEXT_PUBLIC_SUPABASE_URL", label: "Supabase URL", secret: false },
  { key: "SUPABASE_SERVICE_ROLE_KEY", label: "Supabase service role", secret: true },
  { key: "SERPAPI_KEY", label: "SerpApi", secret: true },
  { key: "ANTHROPIC_API_KEY", label: "Anthropic", secret: true },
  { key: "GOOGLE_CLIENT_ID", label: "Google OAuth client_id", secret: true },
  { key: "GOOGLE_CLIENT_SECRET", label: "Google OAuth client_secret", secret: true },
  { key: "RESEND_API_KEY", label: "Resend", secret: true },
  { key: "ADZUNA_APP_ID", label: "Adzuna app_id", secret: true },
  { key: "ADZUNA_APP_KEY", label: "Adzuna app_key", secret: true },
  { key: "COWORK_ADMIN_TOKEN", label: "Cowork admin token", secret: true },
  { key: "CRON_SECRET", label: "Cron secret", secret: true },
  { key: "ALLOWED_EMAIL", label: "Single-user email lock", secret: false },
] as const;

export default async function AjustesPage() {
  const user = await getAuthedUser();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="font-heading text-xl font-semibold">Ajustes</h2>
        <p className="text-sm text-muted-foreground">
          Estado del portal + integraciones.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Sesión</CardTitle>
        </CardHeader>
        <CardContent>
          {user ? (
            <div className="flex flex-col gap-3 text-sm">
              <dl className="grid grid-cols-2 gap-x-4 gap-y-1">
                <dt className="text-muted-foreground">Email</dt>
                <dd className="truncate">{user.email}</dd>
                <dt className="text-muted-foreground">User ID</dt>
                <dd className="truncate text-[11px] font-mono">{user.id}</dd>
                <dt className="text-muted-foreground">Modo</dt>
                <dd>{user.isDev ? "dev shim" : "producción"}</dd>
                <dt className="text-muted-foreground">Supabase</dt>
                <dd>{isSupabaseConfigured() ? "conectado" : "no configurado"}</dd>
                <dt className="text-muted-foreground">Runway</dt>
                <dd>{runwayDays(GRADUATION_DATE)} días hasta 2026-07-20</dd>
              </dl>
              {!user.isDev ? <SignOutButton /> : null}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No hay sesión activa.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Integraciones</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="divide-y divide-border text-sm">
            {INTEGRATIONS.map((i) => {
              const value = process.env[i.key];
              const configured = Boolean(value);
              return (
                <li
                  key={i.key}
                  className="flex items-center justify-between py-2"
                >
                  <div>
                    <p className="font-medium">{i.label}</p>
                    <p className="text-[11px] text-muted-foreground">{i.key}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {i.secret && configured ? (
                      <span className="text-[11px] text-muted-foreground">
                        [set · {(value ?? "").length} chars]
                      </span>
                    ) : configured ? (
                      <span className="max-w-[16ch] truncate text-[11px] text-muted-foreground">
                        {value}
                      </span>
                    ) : null}
                    {configured ? (
                      <CheckCircle2 className="size-4 text-fit-alto" />
                    ) : (
                      <XCircle className="size-4 text-muted-foreground/50" />
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
