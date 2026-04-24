import type { BaseCV } from "@/lib/profile/base-cv";
import type { Offer } from "@/lib/offers/types";

export function buildCoverLetterPrompt(opts: {
  baseCV: BaseCV;
  offer: Offer & { company_name?: string | null; description?: string | null };
  language?: "es" | "en";
}): { system: string; user: string } {
  const lang = opts.language ?? "en";
  const targetLanguage =
    lang === "es" ? "Spanish (Castilian)" : "English (professional)";

  const system = `You are writing a tight, sincere cover letter for a post-MBA candidate applying to a specific role.

Tone:
- Confident but not arrogant.
- Specific, not generic.
- Hooks with a relevant concrete data point from the candidate's experience.
- No clichés ("I am a passionate professional...", "Dear Hiring Manager...", etc. are OK only if genuinely needed).

Constraints:
- 220-280 words total.
- 3 paragraphs:
  1. Hook: why THIS role at THIS company lights up the candidate.
  2. Proof: 2-3 concrete, relevant achievements from the CV mapped to what the role needs.
  3. Close: what the candidate would bring in the first 3 months + invitation to chat.
- Address to "Hiring Team" unless company has obvious format.
- Language: ${targetLanguage}.
- Output plain markdown. No preamble.
- Do NOT invent facts. Every metric or achievement must exist in the base CV.`;

  const offerBlock = [
    `TITLE: ${opts.offer.title}`,
    opts.offer.company_name ? `COMPANY: ${opts.offer.company_name}` : "",
    opts.offer.location ? `LOCATION: ${opts.offer.location}` : "",
    opts.offer.description ? `\nDESCRIPTION:\n${opts.offer.description}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const user = `TARGET OFFER
============
${offerBlock}

BASE CV
=======
${JSON.stringify(opts.baseCV, null, 2)}

TASK: Write the cover letter per the spec in the system prompt.`;

  return { system, user };
}
