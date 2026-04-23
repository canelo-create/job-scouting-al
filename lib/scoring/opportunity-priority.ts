/**
 * opportunity_priority_score (0-100): composite that ranks actionable priority.
 * Formula: 0.5 * fit + 0.3 * company_quality + 0.2 * weighted(learning, comp, network, founder_rel).
 * Spec §11.
 */

export type PriorityHeuristics = {
  learning?: number;
  comp?: number;
  network?: number;
  founderRelevance?: number;
};

export function computeOpportunityPriority(
  fit: number,
  companyQuality: number,
  h: PriorityHeuristics = {},
): number {
  const learning = h.learning ?? 50;
  const comp = h.comp ?? 50;
  const network = h.network ?? 50;
  const founder = h.founderRelevance ?? 50;
  const extras = (learning + comp + network + founder) / 4;
  const total = 0.5 * fit + 0.3 * companyQuality + 0.2 * extras;
  return Math.round(Math.min(100, Math.max(0, total)));
}

/** Sort offers by priority descending, tie-break by fit then company_quality. */
export function prioritySorter<
  T extends { opportunity_priority_score?: number | null; fit_score?: number | null; company_quality_score?: number | null },
>(a: T, b: T): number {
  const pa = a.opportunity_priority_score ?? 0;
  const pb = b.opportunity_priority_score ?? 0;
  if (pb !== pa) return pb - pa;
  const fa = a.fit_score ?? 0;
  const fb = b.fit_score ?? 0;
  if (fb !== fa) return fb - fa;
  return (b.company_quality_score ?? 0) - (a.company_quality_score ?? 0);
}
