export type OfferStatus =
  | "pendiente"
  | "investigar"
  | "aplicado"
  | "entrevistando"
  | "oferta"
  | "rechazado"
  | "archivado";

export type FitTier = "alto" | "medio" | "bajo" | "descartado";

export type Modality =
  | "remoto"
  | "hibrido"
  | "presencial"
  | "hibrido-remoto"
  | "unknown";

export type Offer = {
  id: string;
  user_id: string;
  title: string;
  location: string | null;
  country: string | null;
  modality: Modality | null;
  contract_type: string | null;
  salary_min: number | null;
  salary_max: number | null;
  currency: string | null;
  source: string | null;
  source_url: string | null;
  posted_at: string | null;
  deadline: string | null;
  fit_score: number | null;
  company_quality_score: number | null;
  opportunity_priority_score: number | null;
  fit_tier: FitTier | null;
  status: OfferStatus;
  why_it_matches: string | null;
  risks: string[] | null;
  recommended_action: string | null;
  tags: string[] | null;
  dedup_hash: string | null;
  applied_at: string | null;
  last_touched_at: string;
  created_at: string;
  legacy_id: number | null;
  company_id: string | null;
};

export const STATUS_LABELS: Record<OfferStatus, string> = {
  pendiente: "Pendiente",
  investigar: "Investigar",
  aplicado: "Aplicado",
  entrevistando: "Entrevistando",
  oferta: "Oferta",
  rechazado: "Rechazado",
  archivado: "Archivado",
};

export const STATUS_ORDER: OfferStatus[] = [
  "pendiente",
  "investigar",
  "aplicado",
  "entrevistando",
  "oferta",
  "rechazado",
  "archivado",
];

export const FIT_TIER_LABELS: Record<FitTier, string> = {
  alto: "Alto",
  medio: "Medio",
  bajo: "Bajo",
  descartado: "Descartado",
};
