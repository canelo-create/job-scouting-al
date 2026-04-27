/**
 * Provider-agnostic LLM client.
 * Supports: gemini (default, free-tier friendly), anthropic.
 * Switch via LLM_PROVIDER env var.
 */

import Anthropic from "@anthropic-ai/sdk";

export type LLMProvider = "gemini" | "anthropic";

export type LLMRequest = {
  system: string;
  user: string;
  maxTokens?: number;
  temperature?: number;
};

export type LLMResponse = {
  text: string;
  promptTokens: number;
  outputTokens: number;
  provider: LLMProvider;
  model: string;
};

export function getLLMProvider(): LLMProvider {
  const explicit = (process.env.LLM_PROVIDER ?? "").toLowerCase() as LLMProvider;
  if (explicit === "anthropic" || explicit === "gemini") return explicit;
  if (process.env.GEMINI_API_KEY) return "gemini";
  if (process.env.ANTHROPIC_API_KEY) return "anthropic";
  return "gemini";
}

export function isLLMConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY) || Boolean(process.env.ANTHROPIC_API_KEY);
}

const GEMINI_DEFAULT_MODEL =
  process.env.GEMINI_MODEL ?? "gemini-2.0-flash";
const ANTHROPIC_DEFAULT_MODEL =
  process.env.ANTHROPIC_MODEL ?? "claude-haiku-4-5";

async function geminiComplete(req: LLMRequest): Promise<LLMResponse> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY missing");
  const model = GEMINI_DEFAULT_MODEL;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
  const body = {
    systemInstruction: {
      role: "system",
      parts: [{ text: req.system }],
    },
    contents: [{ role: "user", parts: [{ text: req.user }] }],
    generationConfig: {
      maxOutputTokens: req.maxTokens ?? 2500,
      temperature: req.temperature ?? 0.5,
    },
  };
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini ${res.status}: ${err.slice(0, 500)}`);
  }
  const data = await res.json();
  const text = (data.candidates?.[0]?.content?.parts ?? [])
    .map((p: { text?: string }) => p.text ?? "")
    .join("");
  return {
    text,
    promptTokens: data.usageMetadata?.promptTokenCount ?? 0,
    outputTokens: data.usageMetadata?.candidatesTokenCount ?? 0,
    provider: "gemini",
    model,
  };
}

let anthropicClient: Anthropic | null = null;

async function anthropicComplete(req: LLMRequest): Promise<LLMResponse> {
  if (!anthropicClient) {
    const key = process.env.ANTHROPIC_API_KEY;
    if (!key) throw new Error("ANTHROPIC_API_KEY missing");
    anthropicClient = new Anthropic({ apiKey: key });
  }
  const model = ANTHROPIC_DEFAULT_MODEL;
  const res = await anthropicClient.messages.create({
    model,
    max_tokens: req.maxTokens ?? 2500,
    temperature: req.temperature ?? 0.5,
    system: req.system,
    messages: [{ role: "user", content: req.user }],
  });
  const text = res.content
    .filter((b) => b.type === "text")
    .map((b) => (b as { type: "text"; text: string }).text)
    .join("\n");
  return {
    text,
    promptTokens: res.usage?.input_tokens ?? 0,
    outputTokens: res.usage?.output_tokens ?? 0,
    provider: "anthropic",
    model,
  };
}

export async function llmComplete(req: LLMRequest): Promise<LLMResponse> {
  const provider = getLLMProvider();
  if (provider === "gemini") return geminiComplete(req);
  return anthropicComplete(req);
}
