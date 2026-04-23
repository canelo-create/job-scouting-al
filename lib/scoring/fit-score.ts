/**
 * fit_score (0-100): alignment of a job offer with Canelo's target profile.
 * Spec §11. Pure function.
 */

export type FitInput = {
  title: string;
  location?: string | null;
  country?: string | null;
  modality?: string | null;
  description?: string | null;
  tags?: string[] | null;
};

export type FitBreakdown = {
  total: number;
  title: number;
  geo: number;
  seniority: number;
  function: number;
  transfer: number;
  aiBonus: number;
  tier: "alto" | "medio" | "bajo" | "descartado";
};

const PRIMARY_ROLES = [
  "strategy associate",
  "strategy manager",
  "consultant",
  "associate consultant",
  "business operations",
  "bizops",
  "growth operations",
  "operations manager",
  "project manager",
  "program manager",
  "chief of staff",
  "founder's associate",
  "founders associate",
  "ai implementation",
  "ai transformation",
  "ai operations",
  "startup operations",
  "commercial strategy",
  "gtm strategy",
  "strategic partnerships",
  "venture operations",
];

const SECONDARY_ROLES = [
  "innovation",
  "transformation",
  "internal strategy",
  "expansion",
  "product operations",
  "product strategy",
];

const DOWNRANK_ROLES = [
  "intern",
  "internship",
  "trainee",
  "graduate program",
  "becario",
  "becaria",
];

const SENIOR_OVERSHOOT = [
  "vp ",
  "vice president",
  "head of",
  "director of",
  "chief ",
  "cto",
  "cfo",
  "ceo",
];

const AI_KEYWORDS = [
  "ai",
  "gen ai",
  "genai",
  "llm",
  "automation",
  "agent",
  "copilot",
  "claude",
  "gpt",
];

function includesAny(haystack: string, needles: string[]): boolean {
  const low = haystack.toLowerCase();
  return needles.some((n) => low.includes(n));
}

function countMatches(haystack: string, needles: string[]): number {
  const low = haystack.toLowerCase();
  return needles.filter((n) => low.includes(n)).length;
}

function scoreGeo(location?: string | null, country?: string | null, modality?: string | null): number {
  const loc = `${location ?? ""} ${country ?? ""}`.toLowerCase();
  const mod = (modality ?? "").toLowerCase();
  if (loc.includes("madrid")) return 20;
  if (loc.includes("bogot") || loc.includes("colombia")) return 17;
  if (mod.includes("remot") && (loc.includes("spain") || loc.includes("españ") || loc.includes("es"))) return 15;
  if (mod.includes("remot") && (loc.includes("colombia") || loc.includes("co"))) return 14;
  if (loc.includes("barcelona") || loc.includes("valencia") || loc.includes("sevilla")) return 12;
  if (mod.includes("remot")) return 10;
  if (loc.includes("españa") || loc.includes("spain")) return 10;
  if (loc.includes("eu") || loc.includes("europe")) return 6;
  return 3;
}

function scoreTitle(title: string): number {
  const low = title.toLowerCase();
  if (includesAny(low, DOWNRANK_ROLES)) return 5;
  if (includesAny(low, SENIOR_OVERSHOOT)) return 10;
  const primaryHits = countMatches(low, PRIMARY_ROLES);
  if (primaryHits >= 2) return 35;
  if (primaryHits === 1) return 30;
  const secondaryHits = countMatches(low, SECONDARY_ROLES);
  if (secondaryHits >= 1) return 20;
  return 12;
}

function scoreSeniority(title: string): number {
  const low = title.toLowerCase();
  if (includesAny(low, SENIOR_OVERSHOOT)) return 4;
  if (includesAny(low, DOWNRANK_ROLES)) return 4;
  if (low.includes("senior") || low.includes("lead")) return 10;
  if (low.includes("associate") || low.includes("manager") || low.includes("specialist")) return 15;
  if (low.includes("analyst") || low.includes("consultant")) return 13;
  return 10;
}

function scoreFunction(title: string, description?: string | null): number {
  const hay = `${title} ${description ?? ""}`.toLowerCase();
  const functions = ["strategy", "consulting", "operations", "product", "growth"];
  const hits = countMatches(hay, functions);
  return Math.min(15, 5 + hits * 3);
}

function scoreTransfer(title: string, description?: string | null): number {
  const hay = `${title} ${description ?? ""}`.toLowerCase();
  let score = 3;
  if (hay.includes("mba")) score += 3;
  if (hay.includes("cross-functional") || hay.includes("cross functional")) score += 2;
  if (hay.includes("b2b") || hay.includes("enterprise")) score += 1;
  if (hay.includes("fmcg") || hay.includes("consumer goods")) score += 1;
  return Math.min(10, score);
}

function scoreAiBonus(title: string, description?: string | null, tags?: string[] | null): number {
  const hay = `${title} ${description ?? ""} ${(tags ?? []).join(" ")}`.toLowerCase();
  return includesAny(hay, AI_KEYWORDS) ? 5 : 0;
}

export function fitTier(total: number): FitBreakdown["tier"] {
  if (total >= 70) return "alto";
  if (total >= 45) return "medio";
  if (total >= 25) return "bajo";
  return "descartado";
}

export function computeFitScore(offer: FitInput): FitBreakdown {
  const title = scoreTitle(offer.title);
  const geo = scoreGeo(offer.location, offer.country, offer.modality);
  const seniority = scoreSeniority(offer.title);
  const func = scoreFunction(offer.title, offer.description);
  const transfer = scoreTransfer(offer.title, offer.description);
  const aiBonus = scoreAiBonus(offer.title, offer.description, offer.tags);
  const total = Math.min(100, title + geo + seniority + func + transfer + aiBonus);
  return {
    total,
    title,
    geo,
    seniority,
    function: func,
    transfer,
    aiBonus,
    tier: fitTier(total),
  };
}
