# Job Scouting AL

Portal personal de búsqueda de empleo post-MBA de Andrés Lince García (Canelo).
**Single-user. No comercial. No se publica.** PWA instalable desde iPhone.

## Stack

Next.js 14 (App Router) + TypeScript strict + Tailwind v4 + shadcn/ui (base-nova) +
Supabase (Auth + Postgres) + Anthropic Claude + Google Calendar + SerpApi + Resend +
Vercel (hosting + cron).

## Estado

Día 1 — scaffold local. Shell + tablero + middleware + schema DB listos.
Deploy a Vercel pendiente hasta que todas las env vars estén provisionadas.

## Setup local

```bash
cp .env.example .env.local
# Rellenar las variables — ver §5 del prompt maestro.

npm install
npm run dev
```

Sin `.env.local` configurado, el middleware entra en **dev-shim mode** (se saltea
la autenticación) para poder validar el Shell. Una vez con Supabase configurado,
el single-user lock se activa automáticamente.

## Scripts

- `npm run dev` — dev server en :3000
- `npm run build` — build de producción
- `npm run lint` — ESLint
- `npm run typecheck` — TS sin emit

## Estructura

Ver `app/`, `components/`, `lib/`, `supabase/migrations/`. El spec completo está
en `specs/PROMPT-MAESTRO.md` (si lo copiaste al repo).

## Quién lo mantiene

- **Constructor:** Claude Code local (Surface Pro).
- **Director estratégico:** Cowork (Claude Desktop).
- Acceso de Cowork vía `/api/admin/*` protegido por `COWORK_ADMIN_TOKEN`.
