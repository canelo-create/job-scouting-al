// Regenerate with: supabase gen types typescript --project-id <id> > lib/supabase/types.ts
// Placeholder until the Supabase project is provisioned.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      candidate_profile: { Row: Record<string, unknown> };
      companies: { Row: Record<string, unknown> };
      offers: { Row: Record<string, unknown> };
      scrape_runs: { Row: Record<string, unknown> };
      events: { Row: Record<string, unknown> };
      cv_documents: { Row: Record<string, unknown> };
      activity_log: { Row: Record<string, unknown> };
      streaks: { Row: Record<string, unknown> };
    };
    Views: Record<string, { Row: Record<string, unknown> }>;
    Functions: Record<string, unknown>;
  };
};
