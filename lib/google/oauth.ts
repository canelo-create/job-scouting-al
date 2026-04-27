/**
 * Google OAuth 2.0 helpers — Authorization Code flow with offline access.
 * Stores tokens in google_integrations table per user.
 */

import { createAdminClient } from "@/lib/supabase/admin";

const AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_URL = "https://oauth2.googleapis.com/token";

export const SCOPES = [
  "https://www.googleapis.com/auth/calendar.readonly",
  "https://www.googleapis.com/auth/calendar.events",
  "openid",
  "email",
  "profile",
];

export function getRedirectUri(): string {
  const explicit = process.env.GOOGLE_REDIRECT_URI;
  if (explicit) return explicit;
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return `${base}/api/google/oauth-callback`;
}

export function buildAuthUrl(state: string): string {
  const id = process.env.GOOGLE_CLIENT_ID;
  if (!id) throw new Error("GOOGLE_CLIENT_ID missing");
  const params = new URLSearchParams({
    client_id: id,
    redirect_uri: getRedirectUri(),
    response_type: "code",
    scope: SCOPES.join(" "),
    access_type: "offline",
    prompt: "consent",
    state,
  });
  return `${AUTH_URL}?${params.toString()}`;
}

export type TokenResponse = {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  scope?: string;
  token_type?: string;
};

export async function exchangeCode(code: string): Promise<TokenResponse> {
  const id = process.env.GOOGLE_CLIENT_ID;
  const secret = process.env.GOOGLE_CLIENT_SECRET;
  if (!id || !secret) throw new Error("Google OAuth env missing");
  const body = new URLSearchParams({
    code,
    client_id: id,
    client_secret: secret,
    redirect_uri: getRedirectUri(),
    grant_type: "authorization_code",
  });
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Google token exchange ${res.status}: ${err.slice(0, 300)}`);
  }
  return res.json();
}

export async function refreshAccessToken(refreshToken: string): Promise<TokenResponse> {
  const id = process.env.GOOGLE_CLIENT_ID;
  const secret = process.env.GOOGLE_CLIENT_SECRET;
  if (!id || !secret) throw new Error("Google OAuth env missing");
  const body = new URLSearchParams({
    refresh_token: refreshToken,
    client_id: id,
    client_secret: secret,
    grant_type: "refresh_token",
  });
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Google token refresh ${res.status}: ${err.slice(0, 300)}`);
  }
  return res.json();
}

export async function saveTokens(
  userId: string,
  tokens: TokenResponse,
): Promise<void> {
  const sb = createAdminClient();
  const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();
  await sb.from("google_integrations").upsert(
    {
      user_id: userId,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token ?? "",
      expires_at: expiresAt,
      scope: tokens.scope ?? SCOPES.join(" "),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );
}

/** Returns valid access token; refreshes if expired. Throws if no integration. */
export async function getValidAccessToken(userId: string): Promise<string> {
  const sb = createAdminClient();
  const { data, error } = await sb
    .from("google_integrations")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("No Google integration for user");
  const expiresAt = new Date(data.expires_at as string).getTime();
  if (expiresAt > Date.now() + 60_000) {
    return data.access_token as string;
  }
  if (!data.refresh_token) {
    throw new Error("Token expired and no refresh_token. Reconnect Google.");
  }
  const refreshed = await refreshAccessToken(data.refresh_token as string);
  // Keep the existing refresh_token if Google didn't return a new one
  await sb
    .from("google_integrations")
    .update({
      access_token: refreshed.access_token,
      expires_at: new Date(Date.now() + refreshed.expires_in * 1000).toISOString(),
      updated_at: new Date().toISOString(),
      ...(refreshed.refresh_token ? { refresh_token: refreshed.refresh_token } : {}),
    })
    .eq("user_id", userId);
  return refreshed.access_token;
}

export async function disconnectGoogle(userId: string): Promise<void> {
  const sb = createAdminClient();
  await sb.from("google_integrations").delete().eq("user_id", userId);
}
