// Update 31 existing offers with real URLs + insert 27 new startup/scale-up jobs.
// Usage:
//   COWORK_ADMIN_TOKEN=xxx \
//   NEXT_PUBLIC_SUPABASE_URL=xxx \
//   SUPABASE_SERVICE_ROLE_KEY=xxx \
//   PORTAL_URL=https://job-scouting-al.vercel.app \
//   node scripts/update-and-add.mjs

import { createHash } from "node:crypto";

const TOKEN = process.env.COWORK_ADMIN_TOKEN;
const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const PORTAL = process.env.PORTAL_URL ?? "https://job-scouting-al.vercel.app";

if (!TOKEN || !SB_URL || !SB_KEY) {
  console.error("Missing env: COWORK_ADMIN_TOKEN / NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

// --- dedup hash (mirrors lib/dedup) ---
function normalize(s) {
  if (!s) return "";
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\b(jr|sr|i|ii|iii|iv|v)\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
}
function normalizeUrl(url) {
  if (!url) return "";
  try {
    const u = new URL(url);
    u.search = "";
    u.hash = "";
    return `${u.hostname}${u.pathname.replace(/\/+$/, "")}`.toLowerCase();
  } catch {
    return url.toLowerCase().split("?")[0].split("#")[0].replace(/\/+$/, "");
  }
}
function dedupHash({ company, title, city, source_url }) {
  const parts = [normalize(company), normalize(title), normalize(city), normalizeUrl(source_url)].join("|");
  return createHash("sha256").update(parts).digest("hex");
}

// --- supabase REST helpers (service role bypasses RLS) ---
async function sbGet(path) {
  const res = await fetch(`${SB_URL}/rest/v1/${path}`, {
    headers: {
      apikey: SB_KEY,
      Authorization: `Bearer ${SB_KEY}`,
    },
  });
  return res.json();
}
async function sbPatch(path, body) {
  const res = await fetch(`${SB_URL}/rest/v1/${path}`, {
    method: "PATCH",
    headers: {
      apikey: SB_KEY,
      Authorization: `Bearer ${SB_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`PATCH ${path}: HTTP ${res.status} ${text}`);
  }
  return res.json();
}

// --- PHASE 1: URL updates for existing 31 ---
const URL_UPDATES = [
  ["Fever", "Strategy & Expansion Manager", "https://careers.feverup.com/jobs/4578171101/regional-real-estate-expansion-manager/"],
  ["KPMG España", "Graduate Program Strategy & Value Creation – Sept 2026", "https://es.linkedin.com/jobs/view/graduate-program-strategy-value-creation-strategy-madrid-septiembre-2026-at-kpmg-espa%C3%B1a-4356182621"],
  ["McKinsey & Company", "Consultant, MBA Internship 2026/27", "https://www.mckinsey.com/careers/search-jobs?countries=Spain"],
  ["Boston Consulting Group", "Senior Analyst – BCG Vantage (Org Design, Ops & Cost Excellence)", "https://careers.bcg.com/global/en/job/57233/Senior-Analyst-BCG-Vantage-Organization-Design-Operating-Model"],
  ["Boston Consulting Group", "Transformation Manager – BCG Vantage", "https://careers.bcg.com/global/en/job/57900/Transformation-Manager-BCG-Vantage"],
  ["FTI Consulting", "Consultant, Business Transformation & Strategy", "https://fticonsult.referrals.selectminds.com/FTIEMEAcareers/page/spain-opportunities-at-fti-consulting-1247"],
  ["Mastercard", "Consultant, Advisors & Consulting Services, Strategy & Transformation", "https://careers.mastercard.com/us/en/job/R-236753/Associate-Managing-Consultant-Advisors-Strategy-Transformation"],
  ["Visa", "Consulting Manager", "https://www.visa.es/es_es/jobs/REF72175V"],
  ["Revolut", "Strategy & Operations Manager", "https://www.revolut.com/careers/position/e4b7c063-41c5-4afc-8031-2323db04b9f7/"],
  ["Northius", "Operations & Strategy Associate", "https://empleo.northius.com/jobs"],
  ["Expedia Group", "Integration & Transformation Manager", "https://jobs.traveltechessentialist.com/companies/expedia/jobs/76030289-integration-transformation-manager"],
  ["Ebury", "AI Commercial Enablement Lead", "https://www.ziprecruiter.co.uk/jobs/502562880-ai-commercial-enablement-lead-client-management-at-ebury"],
  ["HappyRobot", "Deployment Strategist", "https://es.linkedin.com/jobs/view/deployment-strategist-at-happyrobot-4318418203"],
  ["Amaris Consulting", "Project Manager – CX & MarTech", "https://careers.amaris.com/jobs"],
  ["Air Europa", "Project Manager & PMO – Innovación y Transformación Digital", "https://www.glassdoor.com/job-listing/innovation-and-transformation-project-manager-mro-air-europa-JV_IC2664239_KO0,49_KE50,60.htm?jl=1009749403951"],
  ["Inverto (BCG Company)", "(Senior) Project Manager – Procurement / Supply Chain", "https://www.linkedin.com/jobs/view/bcg-inverto-senior-project-manager-procurement-at-boston-consulting-group-bcg-4151848377"],
  ["Deloitte", "Team Lead Proyectos Digitales", "https://es.linkedin.com/jobs/view/team-lead-proyectos-digitales-at-deloitte-3760442288"],
  ["Hitachi Energy", "Project Manager – Customer Advocacy Lead", "https://www.hitachienergy.com/careers/open-jobs/details/JID3-188439"],
  ["Boston Consulting Group", "Consultant, MBA Internship Colombia 2027", "https://careers.bcg.com/global/en/job/54359/Consultant-MBA-Internship-Colombia-2027"],
  ["Mastercard", "Consultant, Strategy & Transformation", "https://careers.mastercard.com/us/en/job/R-245810/Associate-Managing-Consultant-Advisors-Consulting-Services-Strategy-Transformation"],
  ["Cloud9", "Chief of Staff (AI & Operations)", "https://thecloud9home.com/job-openings/"],
  ["Nestlé", "Gerencia de Innovación y Renovación PURINA", "https://jobdetails.nestle.com/job/Bogota-Gerencia-de-Innovaci%C3%B3n-y-Renovaci%C3%B3n-PURINA/1385985633/"],
  ["Lulo bank", "Growth Specialist", "https://co.linkedin.com/jobs/view/growth-planner-at-lulo-bank-3447507263"],
  ["Appinio", "(Senior) Research Consultant – Americas", "https://job-boards.eu.greenhouse.io/appinio"],
  ["JLL", "Project Manager", "https://co.linkedin.com/jobs/jll-empleos-bogot%C3%A1"],
  ["Claire Joster", "Project Manager", "https://www.linkedin.com/jobs/view/project-manager-at-claire-joster-4401655925"],
  ["NTT DATA Europe & Latam", "Project Manager Bilingüe", "https://co.linkedin.com/jobs/ntt-data-empleos"],
  ["OSYA", "Project Manager Bilingüe", "https://co.linkedin.com/jobs/osya-empleos-bogot%C3%A1"],
  ["Findasense", "Project Manager – Social & Influencer Operations", "https://jobs.workable.com/view/cVkQ6m1y9gUUbJEtxoh94H/hybrid-project-manager---social-&-influencer-operations-in-bogot%C3%A1-at-findasense"],
  ["Bionic Talent", "Operations Manager (1265 – Colombia)", "https://careers.bionictalent.com/jobs/7633373-operations-manager-1265-colombia"],
  ["Coca-Cola FEMSA", "JEFE MERCADO", "https://www.linkedin.com/company/coca-cola-femsa/jobs/"],
];

console.log(`\n=== PHASE 1: Update URLs on ${URL_UPDATES.length} existing offers ===\n`);

let updated = 0;
let notFound = 0;

for (const [company, title, url] of URL_UPDATES) {
  // Find offer by joining companies.name + offers.title
  const offers = await sbGet(
    `offers?select=id,location,companies!inner(name)&companies.name=eq.${encodeURIComponent(company)}&title=eq.${encodeURIComponent(title)}`,
  );
  if (!Array.isArray(offers) || offers.length === 0) {
    console.log(`? ${company} / ${title} → not found in DB`);
    notFound++;
    continue;
  }
  const offer = offers[0];
  const newHash = dedupHash({
    company,
    title,
    city: offer.location,
    source_url: url,
  });
  try {
    await sbPatch(`offers?id=eq.${offer.id}`, {
      source_url: url,
      dedup_hash: newHash,
    });
    console.log(`✓ ${company} / ${title}`);
    updated++;
  } catch (e) {
    console.log(`✗ ${company} / ${title} → ${e.message}`);
  }
}

console.log(`\nPhase 1 done: ${updated} updated · ${notFound} not found\n`);

// --- PHASE 2: insert 27 new startup/scale-up jobs ---
const NEW_JOBS = [
  // Madrid Startups & Scale-ups
  { title: "AI & Operations Strategy Associate", company: "Fever", location: "Madrid, España", country: "ES", modality: "hibrido", source: "linkedin-curated-startups", source_url: "https://www.linkedin.com/jobs/view/4403757278", tags: ["madrid", "starred", "scale-up", "ai"] },
  { title: "Strategy & Transformation Associate", company: "Fever", location: "Madrid, España", country: "ES", modality: "hibrido", source: "linkedin-curated-startups", source_url: "https://www.linkedin.com/jobs/view/4403751344", tags: ["madrid", "starred", "scale-up"] },
  { title: "Operations Transformation & AI Associate", company: "Fever", location: "Madrid, España", country: "ES", modality: "hibrido", source: "linkedin-curated-startups", source_url: "https://www.linkedin.com/jobs/view/4403752335", tags: ["madrid", "starred", "scale-up", "ai"] },
  { title: "Strategy & Operations Associate", company: "Fever", location: "Madrid, España", country: "ES", modality: "hibrido", source: "linkedin-curated-startups", source_url: "https://www.linkedin.com/jobs/view/4390046077", tags: ["madrid", "scale-up"] },
  { title: "Strategy & Expansion Manager", company: "Fever", location: "Madrid, España", country: "ES", modality: "hibrido", source: "linkedin-curated-startups", source_url: "https://www.linkedin.com/jobs/view/4405120857", tags: ["madrid", "scale-up"] },
  { title: "Marketing Strategy Manager", company: "Fever", location: "Madrid, España", country: "ES", modality: "hibrido", source: "linkedin-curated-startups", source_url: "https://www.linkedin.com/jobs/view/4376216112", tags: ["madrid", "scale-up"] },
  { title: "Junior Project Manager", company: "Fever", location: "Madrid, España", country: "ES", modality: "hibrido", source: "linkedin-curated-startups", source_url: "https://www.linkedin.com/jobs/view/4398271606", tags: ["madrid", "scale-up"] },
  { title: "Strategy & Operations Manager", company: "Revolut", location: "Madrid, España", country: "ES", modality: "hibrido", source: "linkedin-curated-startups", source_url: "https://www.linkedin.com/jobs/view/4355190956", tags: ["madrid", "fintech", "scale-up"] },
  { title: "AI Commercial Enablement Lead", company: "Ebury", location: "Madrid, España", country: "ES", modality: "hibrido", source: "linkedin-curated-startups", source_url: "https://www.linkedin.com/jobs/view/4405892254", tags: ["madrid", "fintech", "ai", "scale-up"] },
  { title: "Deployment Strategist", company: "HappyRobot", location: "Madrid, España", country: "ES", modality: "hibrido", source: "linkedin-curated-startups", source_url: "https://www.linkedin.com/jobs/view/4318418203", tags: ["madrid", "ai", "series-a"] },
  { title: "Account Manager – Regions", company: "Glovo", location: "Madrid, España", country: "ES", modality: "hibrido", source: "linkedin-curated-startups", source_url: "https://www.linkedin.com/jobs/view/4404729705", tags: ["madrid", "scale-up", "delivery-hero"] },
  { title: "Customer Experience Excellence Specialist", company: "Cabify", location: "Madrid, España", country: "ES", modality: "hibrido", source: "linkedin-curated-startups", source_url: "https://www.linkedin.com/jobs/view/4397714672", tags: ["madrid", "scale-up"] },
  { title: "Operations & Strategy Associate", company: "Northius", location: "Madrid, España", country: "ES", modality: "hibrido", source: "linkedin-curated-startups", source_url: "https://www.linkedin.com/jobs/view/4382792699", tags: ["madrid", "edtech"] },
  { title: "Chief of Staff", company: "Redegal", location: "Madrid, España", country: "ES", modality: "hibrido", source: "linkedin-curated-startups", source_url: "https://www.linkedin.com/jobs/view/4402254646", tags: ["madrid", "tech", "chief-of-staff"] },
  // Bogotá Startups & Scale-ups
  { title: "Chief of Staff (AI & Operations)", company: "Cloud9", location: "Bogotá, Colombia", country: "CO", modality: "hibrido", source: "linkedin-curated-startups", source_url: "https://www.linkedin.com/jobs/view/4407170173", tags: ["bogota", "starred", "ai", "chief-of-staff"] },
  { title: "Strategy and Operations Manager", company: "Uber", location: "Bogotá, Colombia", country: "CO", modality: "hibrido", source: "linkedin-curated-startups", source_url: "https://www.linkedin.com/jobs/view/4400634779", tags: ["bogota", "starred", "scale-up"] },
  { title: "Sales Operations Manager", company: "Rappi", location: "Bogotá, Colombia", country: "CO", modality: "hibrido", source: "linkedin-curated-startups", source_url: "https://www.linkedin.com/jobs/view/4405858034", tags: ["bogota", "scale-up", "unicorn"] },
  { title: "SP&A Senior Manager", company: "Rappi", location: "Bogotá, Colombia", country: "CO", modality: "hibrido", source: "linkedin-curated-startups", source_url: "https://www.linkedin.com/jobs/view/4388482734", tags: ["bogota", "scale-up", "unicorn"] },
  { title: "Rappiads Operations Manager", company: "Rappi", location: "Bogotá, Colombia", country: "CO", modality: "hibrido", source: "linkedin-curated-startups", source_url: "https://www.linkedin.com/jobs/view/4403258038", tags: ["bogota", "scale-up", "unicorn"] },
  { title: "Turbo Supply Chain Manager", company: "Rappi", location: "Bogotá, Colombia", country: "CO", modality: "hibrido", source: "linkedin-curated-startups", source_url: "https://www.linkedin.com/jobs/view/4406831052", tags: ["bogota", "scale-up", "unicorn"] },
  { title: "Growth Specialist", company: "Lulo bank", location: "Bogotá, Colombia", country: "CO", modality: "hibrido", source: "linkedin-curated-startups", source_url: "https://www.linkedin.com/jobs/view/4403680598", tags: ["bogota", "fintech"] },
  { title: "Growth Specialist – Cuentas de Ahorro", company: "Lulo bank", location: "Bogotá, Colombia", country: "CO", modality: "hibrido", source: "linkedin-curated-startups", source_url: "https://www.linkedin.com/jobs/view/4405711044", tags: ["bogota", "fintech"] },
  { title: "Product Manager – Payments Gateway", company: "Bold.co", location: "Bogotá, Colombia", country: "CO", modality: "hibrido", source: "linkedin-curated-startups", source_url: "https://www.linkedin.com/jobs/view/4396351474", tags: ["bogota", "fintech", "series-c"] },
  { title: "Business Development Analyst", company: "Bold.co", location: "Bogotá, Colombia", country: "CO", modality: "hibrido", source: "linkedin-curated-startups", source_url: "https://www.linkedin.com/jobs/view/4399455365", tags: ["bogota", "fintech", "series-c"] },
  { title: "Partnership Manager (Payments)", company: "LaFinteca", location: "Bogotá, Colombia", country: "CO", modality: "hibrido", source: "linkedin-curated-startups", source_url: "https://www.linkedin.com/jobs/view/4407182692", tags: ["bogota", "fintech"] },
  { title: "Growth Specialist", company: "Stealth Startup", location: "Bogotá, Colombia", country: "CO", modality: "hibrido", source: "linkedin-curated-startups", source_url: "https://www.linkedin.com/jobs/view/4405024026", tags: ["bogota", "early-stage"] },
  { title: "Jefe de Estrategia y Proyectos", company: "Brigard Urrutia", location: "Bogotá, Colombia", country: "CO", modality: "hibrido", source: "linkedin-curated-startups", source_url: "https://www.linkedin.com/jobs/view/4400714076", tags: ["bogota", "legal-tech"] },
];

console.log(`=== PHASE 2: POST ${NEW_JOBS.length} new startup/scale-up jobs ===\n`);

let inserted = 0;
let dups = 0;
let failed = 0;
const tier = { alto: 0, medio: 0, bajo: 0, descartado: 0 };

for (const job of NEW_JOBS) {
  try {
    const res = await fetch(`${PORTAL}/api/admin/offers`, {
      method: "POST",
      headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify(job),
    });
    const body = await res.json();
    if (!res.ok) {
      failed++;
      console.log(`✗ ${job.company} / ${job.title} → HTTP ${res.status}`);
      continue;
    }
    if (body.duplicate) {
      dups++;
      console.log(`= ${job.company} / ${job.title} (dup)`);
    } else {
      inserted++;
      const t = body.fit_breakdown?.tier ?? "?";
      tier[t] = (tier[t] ?? 0) + 1;
      console.log(`✓ ${job.company} / ${job.title} → fit ${body.fit_breakdown?.total} (${t}) · pri ${body.priority}`);
    }
  } catch (e) {
    failed++;
    console.log(`✗ ${job.company} / ${job.title} → ${e.message}`);
  }
}

console.log(`\nPhase 2 done: ${inserted} inserted · ${dups} dups · ${failed} failed`);
console.log(`Tiers (new only): ${JSON.stringify(tier)}`);
