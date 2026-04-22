"use client";

import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const configured = isSupabaseConfigured();

  async function onMagicLink(e: React.FormEvent) {
    e.preventDefault();
    if (!configured) {
      toast.error("Supabase no está configurado. Rellená .env.local primero.");
      return;
    }
    setLoading(true);
    try {
      const supabase = createClient();
      const origin = window.location.origin;
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: `${origin}/auth/callback` },
      });
      if (error) throw error;
      toast.success("Revisá tu email — te enviamos el magic link.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error desconocido";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  async function onGoogle() {
    if (!configured) {
      toast.error("Supabase no está configurado todavía.");
      return;
    }
    const supabase = createClient();
    const origin = window.location.origin;
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${origin}/auth/callback` },
    });
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="font-heading">Job Scouting AL</CardTitle>
          <CardDescription>
            Portal privado de búsqueda de empleo. Single-user.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onMagicLink} className="flex flex-col gap-3">
            <label className="text-xs text-muted-foreground" htmlFor="email">
              Email
            </label>
            <Input
              id="email"
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              disabled={loading}
            />
            <Button type="submit" disabled={loading || !email}>
              {loading ? "Enviando…" : "Enviar magic link"}
            </Button>
          </form>

          <div className="my-4 flex items-center gap-2 text-[11px] text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            o
            <span className="h-px flex-1 bg-border" />
          </div>

          <Button variant="outline" className="w-full" onClick={onGoogle}>
            Continuar con Google
          </Button>

          {!configured ? (
            <div className="mt-4 rounded-md border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
              <p className="mb-2 font-medium text-foreground">Modo dev</p>
              <p className="mb-2">
                Supabase aún no está configurado — el middleware está en shim.
              </p>
              <Link
                href="/"
                className="inline-block rounded-md bg-primary px-2 py-1 text-primary-foreground"
              >
                Entrar al tablero sin login
              </Link>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </main>
  );
}
