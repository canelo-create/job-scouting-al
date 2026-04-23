import { describe, it, expect } from "vitest";
import {
  computeFitScore,
  computeCompanyQuality,
  computeOpportunityPriority,
  fitTier,
} from "@/lib/scoring";

describe("fitTier", () => {
  it("maps to alto/medio/bajo/descartado", () => {
    expect(fitTier(95)).toBe("alto");
    expect(fitTier(70)).toBe("alto");
    expect(fitTier(55)).toBe("medio");
    expect(fitTier(30)).toBe("bajo");
    expect(fitTier(10)).toBe("descartado");
  });
});

describe("computeFitScore", () => {
  it("high fit for strategy role in Madrid", () => {
    const r = computeFitScore({
      title: "Strategy Associate",
      location: "Madrid, Spain",
      country: "ES",
      modality: "hibrido",
      description: "Post-MBA role, cross-functional.",
    });
    expect(r.total).toBeGreaterThanOrEqual(70);
    expect(r.tier).toBe("alto");
  });

  it("medium fit for product role remote", () => {
    const r = computeFitScore({
      title: "Product Operations Manager",
      location: "Remote",
      modality: "remoto",
    });
    expect(r.total).toBeGreaterThanOrEqual(45);
  });

  it("downranks internships", () => {
    const r = computeFitScore({
      title: "Strategy Intern",
      location: "Madrid",
    });
    expect(r.total).toBeLessThan(60);
  });

  it("senior overshoot gets low title score", () => {
    const r = computeFitScore({
      title: "VP of Strategy",
      location: "Madrid",
    });
    expect(r.title).toBeLessThan(20);
  });

  it("AI keywords add bonus", () => {
    const base = computeFitScore({
      title: "Operations Manager",
      location: "Madrid",
    });
    const withAi = computeFitScore({
      title: "AI Operations Manager",
      location: "Madrid",
      description: "Implement LLM-based automation pipelines.",
    });
    expect(withAi.aiBonus).toBe(5);
    expect(withAi.total).toBeGreaterThan(base.total);
  });
});

describe("computeCompanyQuality", () => {
  it("rewards Series B scaleup with ATS", () => {
    const r = computeCompanyQuality({
      name: "Globant",
      domain: "globant.com",
      official_site: "https://www.globant.com",
      careers_page: "https://boards.greenhouse.io/globant",
      size: "scaleup",
      funding_stage: "public",
    });
    expect(r.total).toBeGreaterThanOrEqual(70);
    expect(r.signal).toMatch(/strong|mixed/);
  });

  it("low score for bare minimum info", () => {
    const r = computeCompanyQuality({ name: "Unknown" });
    expect(r.total).toBeLessThan(40);
  });

  it("layoffs news penalize", () => {
    const r = computeCompanyQuality({
      name: "Struggling",
      domain: "struggling.com",
      recent_news: [{ type: "layoff", title: "500 layoffs" }],
    });
    expect(r.news).toBeLessThan(5);
  });
});

describe("computeOpportunityPriority", () => {
  it("weighs fit 50, quality 30, heuristics 20", () => {
    const p = computeOpportunityPriority(80, 60, {
      learning: 70,
      comp: 60,
      network: 50,
      founderRelevance: 50,
    });
    // 0.5*80 + 0.3*60 + 0.2 * (70+60+50+50)/4 = 40 + 18 + 11.5 = 69.5
    expect(p).toBeGreaterThanOrEqual(68);
    expect(p).toBeLessThanOrEqual(71);
  });

  it("clamps to 0-100", () => {
    expect(computeOpportunityPriority(200, 200)).toBeLessThanOrEqual(100);
    expect(computeOpportunityPriority(-50, -50)).toBeGreaterThanOrEqual(0);
  });
});
