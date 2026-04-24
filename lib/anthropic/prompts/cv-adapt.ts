import type { BaseCV } from "@/lib/profile/base-cv";
import type { Offer } from "@/lib/offers/types";

export function buildCvAdaptPrompt(opts: {
  baseCV: BaseCV;
  offer: Offer & { company_name?: string | null; description?: string | null };
  language?: "es" | "en";
}): { system: string; user: string } {
  const lang = opts.language ?? "en";
  const targetLanguage =
    lang === "es" ? "Spanish (Castilian)" : "English (professional)";

  const system = `You are a senior career coach and technical writer specializing in post-MBA strategy/ops/consulting roles.

Your job: tailor a candidate's CV to a specific job offer WITHOUT fabricating any fact, metric, or experience. You MUST preserve:
- All dates, company names, role titles exactly as given.
- All numeric claims (35+ projects, 27% EBITDA, 200+ SKUs, etc.) — never invent or inflate.
- All education, certifications, and language proficiency levels.

What you MAY do:
- Reorder and reprioritize bullet points so the most relevant ones appear first per role.
- Rephrase bullets to match the offer's keywords and tone (but keep facts identical).
- Rewrite the professional summary (1 paragraph, ~4-6 sentences) to target the specific role.
- Promote or demote skill groups based on the offer's emphasis.
- Select the 4-6 strongest bullets per role — drop less relevant ones (don't invent).
- Use active verbs (led, managed, launched, delivered, built, etc.).

Rules:
- Output in ${targetLanguage}.
- Output strict Markdown with a structured layout (see format below).
- Do not include any preamble, explanation, or JSON wrapper.
- Do not add emojis or decorative symbols beyond "▸" for bullet markers.
- Keep line length reasonable (no wrapped paragraphs over 400 chars).
- One page target (~450-600 words of content).

Format template:

# {full_name}
{one-line positioning headline tailored to the offer}
{city, country} · {phone} · {email} · {linkedin}
{citizenship line} · {work authorization line}

## Professional Summary
{rewritten paragraph targeting this specific role}

## Professional Experience

### {role} · {company}
*{company_context}*
{location} · {start} – {end}
▸ {bullet 1}
▸ {bullet 2}
...

(repeat per role)

## Education

### {degree} · {institution}
{location} · {start} – {end}
{bullets if any}

## Skills & Tools

**{category}:** {comma-separated items}
(repeat per category, reordered by relevance to the offer)

**Languages:** Spanish (native) · English (professional / advanced)`;

  const offerBlock = [
    `TITLE: ${opts.offer.title}`,
    opts.offer.company_name ? `COMPANY: ${opts.offer.company_name}` : "",
    opts.offer.location ? `LOCATION: ${opts.offer.location}` : "",
    opts.offer.modality ? `MODALITY: ${opts.offer.modality}` : "",
    opts.offer.description ? `\nDESCRIPTION:\n${opts.offer.description}` : "",
    opts.offer.tags?.length ? `TAGS: ${opts.offer.tags.join(", ")}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const user = `TARGET OFFER
============
${offerBlock}

BASE CV (source of truth — never invent beyond this)
====================================================
${JSON.stringify(opts.baseCV, null, 2)}

TASK: Produce a one-page tailored CV in markdown using the template in the system prompt. Preserve every fact; reorder and rephrase only.`;

  return { system, user };
}
