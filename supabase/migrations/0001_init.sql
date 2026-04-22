-- Job Scouting AL — initial schema
-- Spec: §7 of the master prompt.
-- RLS enabled across user-scoped tables; companies and scrape_runs are
-- readable by the single authed user and written by service role only.

create extension if not exists "pgcrypto";

-- =========================================================================
-- candidate_profile
-- =========================================================================
create table if not exists public.candidate_profile (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade unique,
  data jsonb not null,
  updated_at timestamptz default now()
);

-- =========================================================================
-- companies
-- =========================================================================
create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique,
  domain text,
  official_site text,
  careers_page text,
  hq_country text,
  size text,
  funding_stage text,
  quality_signal text check (quality_signal in ('strong','mixed','weak','unclear')),
  recent_news jsonb default '[]'::jsonb,
  created_at timestamptz default now()
);

-- =========================================================================
-- offers
-- =========================================================================
create table if not exists public.offers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  legacy_id int,
  company_id uuid references public.companies(id),
  title text not null,
  location text,
  country text,
  modality text check (modality in ('remoto','hibrido','presencial','hibrido-remoto','unknown')),
  contract_type text,
  salary_min numeric,
  salary_max numeric,
  currency text,
  source text,
  source_url text,
  posted_at timestamptz,
  deadline timestamptz,
  fit_score int check (fit_score between 0 and 100),
  company_quality_score int check (company_quality_score between 0 and 100),
  opportunity_priority_score int check (opportunity_priority_score between 0 and 100),
  fit_tier text check (fit_tier in ('alto','medio','bajo','descartado')),
  status text check (status in ('pendiente','investigar','aplicado','entrevistando','oferta','rechazado','archivado')) default 'pendiente',
  why_it_matches text,
  risks text[],
  recommended_action text,
  tags text[] default '{}',
  dedup_hash text unique,
  applied_at timestamptz,
  last_touched_at timestamptz default now(),
  created_at timestamptz default now()
);

create index if not exists offers_status_idx on public.offers(status);
create index if not exists offers_fit_tier_idx on public.offers(fit_tier);
create index if not exists offers_user_id_idx on public.offers(user_id);

-- =========================================================================
-- scrape_runs
-- =========================================================================
create table if not exists public.scrape_runs (
  id uuid primary key default gen_random_uuid(),
  kind text check (kind in ('serpapi_daily','adzuna_sync','remotive_sync','arbeitnow_sync','manual')),
  queries jsonb default '[]'::jsonb,
  engines_used text[] default '{}',
  quota_before int,
  quota_after int,
  new_offers int default 0,
  total_results int default 0,
  status text check (status in ('success','partial','failed')) default 'success',
  error_message text,
  started_at timestamptz default now(),
  finished_at timestamptz,
  summary_md text
);

-- =========================================================================
-- events
-- =========================================================================
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  offer_id uuid references public.offers(id) on delete set null,
  google_event_id text,
  title text not null,
  kind text check (kind in ('entrevista','follow_up','deadline','reunion','preparacion','otro')),
  starts_at timestamptz not null,
  ends_at timestamptz,
  location text,
  meeting_url text,
  prep_tips_md text,
  notes text,
  reminder_24h_sent bool default false,
  reminder_1h_sent bool default false,
  created_at timestamptz default now()
);

create index if not exists events_starts_at_idx on public.events(starts_at);
create index if not exists events_user_id_idx on public.events(user_id);

-- =========================================================================
-- cv_documents
-- =========================================================================
create table if not exists public.cv_documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  offer_id uuid references public.offers(id) on delete set null,
  kind text check (kind in ('cv','cover_letter','elevator_pitch','email_outreach')),
  version int default 1,
  content_md text not null,
  content_docx_path text,
  created_at timestamptz default now()
);

-- =========================================================================
-- activity_log
-- =========================================================================
create table if not exists public.activity_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  kind text not null,
  offer_id uuid references public.offers(id) on delete set null,
  event_id uuid references public.events(id) on delete set null,
  at timestamptz default now(),
  meta jsonb default '{}'::jsonb
);

create index if not exists activity_log_at_idx on public.activity_log(at);

-- =========================================================================
-- streaks
-- =========================================================================
create table if not exists public.streaks (
  user_id uuid primary key references auth.users(id) on delete cascade,
  current_days int default 0,
  longest_days int default 0,
  last_active_on date,
  weekly_goal jsonb default '{"applications":5,"follow_ups":3,"case_prep":2}'::jsonb
);

-- =========================================================================
-- google_integrations (tokens guardados aparte, no dentro de profile.data)
-- =========================================================================
create table if not exists public.google_integrations (
  user_id uuid primary key references auth.users(id) on delete cascade,
  access_token text not null,
  refresh_token text not null,
  expires_at timestamptz not null,
  scope text,
  calendar_id text,
  updated_at timestamptz default now()
);

-- =========================================================================
-- RLS policies
-- =========================================================================
alter table public.candidate_profile enable row level security;
alter table public.offers enable row level security;
alter table public.events enable row level security;
alter table public.cv_documents enable row level security;
alter table public.activity_log enable row level security;
alter table public.streaks enable row level security;
alter table public.google_integrations enable row level security;

drop policy if exists "owner can all" on public.candidate_profile;
create policy "owner can all" on public.candidate_profile
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "owner can all offers" on public.offers;
create policy "owner can all offers" on public.offers
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "owner can all events" on public.events;
create policy "owner can all events" on public.events
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "owner can all cvs" on public.cv_documents;
create policy "owner can all cvs" on public.cv_documents
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "owner can all activity" on public.activity_log;
create policy "owner can all activity" on public.activity_log
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "owner can all streaks" on public.streaks;
create policy "owner can all streaks" on public.streaks
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "owner can all google" on public.google_integrations;
create policy "owner can all google" on public.google_integrations
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- companies & scrape_runs: authenticated read, service role writes.
alter table public.companies enable row level security;
alter table public.scrape_runs enable row level security;

drop policy if exists "auth read companies" on public.companies;
create policy "auth read companies" on public.companies
  for select using (auth.role() = 'authenticated');

drop policy if exists "auth read scrape_runs" on public.scrape_runs;
create policy "auth read scrape_runs" on public.scrape_runs
  for select using (auth.role() = 'authenticated');
