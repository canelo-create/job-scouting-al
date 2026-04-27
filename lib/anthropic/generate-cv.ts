import { llmComplete } from "@/lib/llm/client";
import { buildCvAdaptPrompt } from "./prompts/cv-adapt";
import { buildCoverLetterPrompt } from "./prompts/cover-letter";
import type { BaseCV } from "@/lib/profile/base-cv";
import type { Offer } from "@/lib/offers/types";

export async function generateAdaptedCv(opts: {
  baseCV: BaseCV;
  offer: Offer & { company_name?: string | null; description?: string | null };
  language?: "es" | "en";
}): Promise<{ markdown: string; tokens: number; provider: string; model: string }> {
  const { system, user } = buildCvAdaptPrompt(opts);
  const res = await llmComplete({ system, user, maxTokens: 2500 });
  return {
    markdown: res.text,
    tokens: res.promptTokens + res.outputTokens,
    provider: res.provider,
    model: res.model,
  };
}

export async function generateCoverLetter(opts: {
  baseCV: BaseCV;
  offer: Offer & { company_name?: string | null; description?: string | null };
  language?: "es" | "en";
}): Promise<{ markdown: string; tokens: number; provider: string; model: string }> {
  const { system, user } = buildCoverLetterPrompt(opts);
  const res = await llmComplete({ system, user, maxTokens: 800 });
  return {
    markdown: res.text,
    tokens: res.promptTokens + res.outputTokens,
    provider: res.provider,
    model: res.model,
  };
}
