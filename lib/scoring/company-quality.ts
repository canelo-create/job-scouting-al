/**
 * company_quality_score (0-100): legitimacy + stability + presence + careers infra.
 * Spec §11. Heuristic — downstream modules will enrich with real intel.
 */

export type CompanyInput = {
  name: string;
  domain?: string | null;
  official_site?: string | null;
  careers_page?: string | null;
  size?: string | null;
  funding_stage?: string | null;
  recent_news?: Array<{ type?: string; title?: string; date?: string }> | null;
};

export type CompanyQualityBreakdown = {
  total: number;
  legitimacy: number;
  growth: number;
  presence: number;
  ats: number;
  news: number;
  signal: "strong" | "mixed" | "weak" | "unclear";
};

const ATS_DOMAINS = [
  "greenhouse.io",
  "lever.co",
  "ashbyhq.com",
  "myworkdayjobs.com",
  "workable.com",
  "smartrecruiters.com",
  "bamboohr.com",
];

function scoreLegitimacy(c: CompanyInput): number {
  let s = 0;
  if (c.official_site) s += 10;
  if (c.domain && c.domain.length > 2) s += 10;
  if (c.careers_page) s += 5;
  return Math.min(25, s);
}

function scoreGrowth(c: CompanyInput): number {
  const stage = (c.funding_stage ?? "").toLowerCase();
  if (stage.includes("series c") || stage.includes("series d") || stage.includes("public")) return 25;
  if (stage.includes("series b")) return 22;
  if (stage.includes("series a")) return 18;
  if (stage.includes("seed")) return 12;
  if (c.size === "enterprise") return 20;
  if (c.size === "scaleup") return 18;
  if (c.size === "startup") return 12;
  return 8;
}

function scorePresence(): number {
  // Placeholder until we have LinkedIn / reviews enrichment.
  return 12;
}

function scoreATS(c: CompanyInput): number {
  const careers = (c.careers_page ?? "").toLowerCase();
  if (!careers) return 4;
  if (ATS_DOMAINS.some((d) => careers.includes(d))) return 15;
  return 10;
}

function scoreNews(c: CompanyInput): number {
  const news = c.recent_news ?? [];
  if (!news.length) return 8;
  let s = 8;
  for (const n of news) {
    const t = `${n.type ?? ""} ${n.title ?? ""}`.toLowerCase();
    if (t.includes("layoff") || t.includes("despid") || t.includes("bankrupt")) s -= 10;
    if (t.includes("funding") || t.includes("raised") || t.includes("series")) s += 5;
    if (t.includes("launch") || t.includes("acquisition")) s += 3;
  }
  return Math.max(0, Math.min(15, s));
}

function qualitySignal(total: number): CompanyQualityBreakdown["signal"] {
  if (total >= 75) return "strong";
  if (total >= 50) return "mixed";
  if (total >= 25) return "weak";
  return "unclear";
}

export function computeCompanyQuality(c: CompanyInput): CompanyQualityBreakdown {
  const legitimacy = scoreLegitimacy(c);
  const growth = scoreGrowth(c);
  const presence = scorePresence();
  const ats = scoreATS(c);
  const news = scoreNews(c);
  const total = Math.min(100, legitimacy + growth + presence + ats + news);
  return {
    total,
    legitimacy,
    growth,
    presence,
    ats,
    news,
    signal: qualitySignal(total),
  };
}
