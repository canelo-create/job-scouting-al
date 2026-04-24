import { getAnthropic, DEFAULT_MODEL } from "./client";
import { buildCvAdaptPrompt } from "./prompts/cv-adapt";
import { buildCoverLetterPrompt } from "./prompts/cover-letter";
import type { BaseCV } from "@/lib/profile/base-cv";
import type { Offer } from "@/lib/offers/types";

export async function generateAdaptedCv(opts: {
  baseCV: BaseCV;
  offer: Offer & { company_name?: string | null; description?: string | null };
  language?: "es" | "en";
}): Promise<{ markdown: string; tokens: number }> {
  const client = getAnthropic();
  const { system, user } = buildCvAdaptPrompt(opts);
  const res = await client.messages.create({
    model: DEFAULT_MODEL,
    max_tokens: 2500,
    system,
    messages: [{ role: "user", content: user }],
  });
  const text = res.content
    .filter((b) => b.type === "text")
    .map((b) => (b as { type: "text"; text: string }).text)
    .join("\n");
  return {
    markdown: text,
    tokens: (res.usage?.input_tokens ?? 0) + (res.usage?.output_tokens ?? 0),
  };
}

export async function generateCoverLetter(opts: {
  baseCV: BaseCV;
  offer: Offer & { company_name?: string | null; description?: string | null };
  language?: "es" | "en";
}): Promise<{ markdown: string; tokens: number }> {
  const client = getAnthropic();
  const { system, user } = buildCoverLetterPrompt(opts);
  const res = await client.messages.create({
    model: DEFAULT_MODEL,
    max_tokens: 800,
    system,
    messages: [{ role: "user", content: user }],
  });
  const text = res.content
    .filter((b) => b.type === "text")
    .map((b) => (b as { type: "text"; text: string }).text)
    .join("\n");
  return {
    markdown: text,
    tokens: (res.usage?.input_tokens ?? 0) + (res.usage?.output_tokens ?? 0),
  };
}
