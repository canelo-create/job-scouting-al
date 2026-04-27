/**
 * Curated registry of job-board platforms.
 * Verdict tiers:
 *   api          → public REST/JSON API, can ingest programmatically (no auth)
 *   rss          → public RSS/Atom feed
 *   ats-public   → ATS-backed (Greenhouse / Lever / Ashby / Workable) — public per-company API
 *   scrape       → no API, HTML scrape possible (ToS may apply)
 *   manual       → no API, no clean scrape — Chrome extension capture only
 *   not-board    → not a job-board product (founder programs, VC portfolios)
 */

export type SourceVerdict =
  | "api"
  | "rss"
  | "ats-public"
  | "scrape"
  | "manual"
  | "not-board";

export type SourceEntry = {
  id: string;
  name: string;
  url: string;
  enfoque: string;
  verdict: SourceVerdict;
  endpoint?: string;
  notes?: string;
  priority: 1 | 2 | 3;
};

export const SOURCES: SourceEntry[] = [
  {
    id: "torre",
    name: "Torre.co",
    url: "https://torre.co/",
    enfoque: "Startups LATAM (fuerte Colombia)",
    verdict: "api",
    endpoint: "POST https://search.torre.co/opportunities/_search",
    notes: "Probado: 2265 results en query 'Strategy'. Free, no auth.",
    priority: 1,
  },
  {
    id: "remoteok",
    name: "Remote OK",
    url: "https://remoteok.com/",
    enfoque: "Roles 100% remotos globales",
    verdict: "api",
    endpoint: "GET https://remoteok.com/api",
    notes: "Free JSON. Requiere link-back en ToS. UA recomendado.",
    priority: 1,
  },
  {
    id: "getonboard",
    name: "Get on Board",
    url: "https://www.getonbrd.com/",
    enfoque: "Tech & startups LATAM",
    verdict: "api",
    endpoint: "GET https://www.getonbrd.com/api/v0/categories/{cat}/jobs",
    notes: "Free, public. Categorías: business-administration, programming, etc.",
    priority: 1,
  },
  {
    id: "anthropic",
    name: "Anthropic Careers",
    url: "https://www.anthropic.com/careers",
    enfoque: "Aplicar directo (AI lab)",
    verdict: "ats-public",
    endpoint:
      "GET https://boards-api.greenhouse.io/v1/boards/anthropic/jobs",
    notes: "Greenhouse public. Free.",
    priority: 1,
  },
  {
    id: "wellfound",
    name: "Wellfound (ex-AngelList)",
    url: "https://wellfound.com/jobs?role=Strategy&locations=Madrid",
    enfoque: "Startups globales — Strategy en Madrid",
    verdict: "manual",
    notes: "API solo para recruiters (paid). Scraping bloqueado por ToS + Cloudflare. Captura via Chrome extension.",
    priority: 2,
  },
  {
    id: "ycombinator-waas",
    name: "Y Combinator Work at a Startup",
    url: "https://www.workatastartup.com/",
    enfoque: "Startups del portfolio YC",
    verdict: "manual",
    notes: "No API pública. Auth de YC requerido para muchas vistas. Captura manual.",
    priority: 2,
  },
  {
    id: "welcome-to-the-jungle",
    name: "Welcome to the Jungle",
    url: "https://www.welcometothejungle.com/en/jobs",
    enfoque: "Startups y scale-ups España",
    verdict: "scrape",
    notes: "API privada. HTML estructurado scrapeable (Next.js __NEXT_DATA__). Otta vive acá ahora.",
    priority: 2,
  },
  {
    id: "aijobs-net",
    name: "AI Jobs (aijobs.net)",
    url: "https://aijobs.net/",
    enfoque: "Roles globales AI/ML",
    verdict: "scrape",
    notes: "Sin RSS público. HTML scrape posible. Filtro por location en URL.",
    priority: 2,
  },
  {
    id: "eu-startups",
    name: "EU-Startups Jobs",
    url: "https://www.eu-startups.com/jobs/",
    enfoque: "Ecosistema startup europeo",
    verdict: "rss",
    endpoint: "https://www.eu-startups.com/jobs/feed/",
    notes: "RSS bloqueado por WAF a curl. Necesita UA real + posible Cloudflare bypass.",
    priority: 3,
  },
  {
    id: "yc-jobs-ops",
    name: "YC Jobs — Operations Manager",
    url: "https://www.ycombinator.com/jobs/role/operations-manager",
    enfoque: "Roles Ops en startups YC",
    verdict: "scrape",
    notes: "HTML público scrapeable. Pre-render de Next.js.",
    priority: 2,
  },
  {
    id: "mercor",
    name: "Mercor",
    url: "https://work.mercor.com/",
    enfoque: "AI labs (Anthropic, OpenAI, Scale)",
    verdict: "manual",
    notes: "Invite + OAuth. Sin API pública. Captura manual / no automatizable.",
    priority: 3,
  },
  {
    id: "otta",
    name: "Otta (Welcome to the Jungle)",
    url: "https://app.welcometothejungle.com/otta",
    enfoque: "Curado, tech roles Europa",
    verdict: "manual",
    notes: "Migrado a Welcome to the Jungle. Auth requerido para feed personalizado.",
    priority: 3,
  },
  {
    id: "antler",
    name: "Antler",
    url: "https://www.antler.co/apply",
    enfoque: "Venture builder Madrid + LATAM",
    verdict: "not-board",
    notes: "Programa de fundadores (no job board). Aplicar como founder, no consume nuestro pipeline.",
    priority: 3,
  },
  {
    id: "entrepreneur-first",
    name: "Entrepreneur First",
    url: "https://www.joinef.com/apply",
    enfoque: "Programa fundadores Iberia",
    verdict: "not-board",
    notes: "Mismo caso que Antler. Aplicar separado.",
    priority: 3,
  },
  {
    id: "magma-partners",
    name: "Magma Partners Jobs",
    url: "https://www.magmapartners.com/jobs/",
    enfoque: "Bolsa empleo VC LATAM",
    verdict: "scrape",
    notes: "Página estática. HTML scrape simple.",
    priority: 2,
  },
  {
    id: "atlantico-vc",
    name: "Atlántico VC Portfolio",
    url: "https://www.atlantico.vc/jobs",
    enfoque: "Startups LATAM portfolio",
    verdict: "scrape",
    notes: "Página estática. HTML scrape simple.",
    priority: 2,
  },
  {
    id: "latitud",
    name: "Latitud Jobs",
    url: "https://jobs.latitud.com/",
    enfoque: "Startups LATAM (founders network)",
    verdict: "scrape",
    notes: "Sin API pública detectable. HTML scrape posible.",
    priority: 2,
  },
  {
    id: "builtin",
    name: "Built In",
    url: "https://builtin.com/jobs",
    enfoque: "Tech roles globales",
    verdict: "scrape",
    notes: "Sin API ni RSS público. Cloudflare suave. Scrape posible con UA real.",
    priority: 3,
  },
  {
    id: "eu-remote-jobs",
    name: "EU Remote Jobs",
    url: "https://euremotejobs.com/",
    enfoque: "Roles remotos en Europa",
    verdict: "rss",
    notes: "WordPress. RSS típicamente en /feed/. Por verificar.",
    priority: 2,
  },
  {
    id: "honeypot",
    name: "Honeypot",
    url: "https://www.honeypot.io/",
    enfoque: "Tech-focused EU",
    verdict: "manual",
    notes: "Auth obligatorio para ver vacantes. No automatizable.",
    priority: 3,
  },
  {
    id: "openai-careers",
    name: "OpenAI Careers",
    url: "https://openai.com/careers/",
    enfoque: "Aplicar directo (AI lab)",
    verdict: "scrape",
    notes: "No usa Greenhouse/Lever público. Workable o custom. Scrape de la página.",
    priority: 2,
  },
];

export const PRIORITY_LABEL: Record<1 | 2 | 3, string> = {
  1: "Tier 1 — integrable ahora",
  2: "Tier 2 — scrape/extension futuro",
  3: "Tier 3 — manual o no aplica",
};

export const VERDICT_LABEL: Record<SourceVerdict, string> = {
  api: "API pública",
  rss: "RSS/Atom",
  "ats-public": "ATS público (Greenhouse/Lever)",
  scrape: "Web scrape",
  manual: "Solo manual / Chrome extension",
  "not-board": "No es job board",
};
