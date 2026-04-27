// One-off batch ingest of curated jobs via admin API.
// Usage: COWORK_ADMIN_TOKEN=xxx PORTAL_URL=https://... node scripts/seed-batch.mjs

const TOKEN = process.env.COWORK_ADMIN_TOKEN;
const URL_BASE = process.env.PORTAL_URL ?? "https://job-scouting-al.vercel.app";
if (!TOKEN) {
  console.error("COWORK_ADMIN_TOKEN missing");
  process.exit(1);
}

const JOBS = [
  // Madrid
  { title: "Strategy & Expansion Manager", company: "Fever", location: "Madrid, España", country: "ES", modality: "hibrido", source: "linkedin-curated", tags: ["madrid", "starred"] },
  { title: "Graduate Program Strategy & Value Creation – Sept 2026", company: "KPMG España", location: "Madrid, España", country: "ES", modality: "hibrido", source: "linkedin-curated", tags: ["madrid", "starred", "post-mba"] },
  { title: "Consultant, MBA Internship 2026/27", company: "McKinsey & Company", location: "Madrid, España", country: "ES", modality: "hibrido", source: "linkedin-curated", tags: ["madrid", "mbb", "internship"] },
  { title: "Senior Analyst – BCG Vantage (Org Design, Ops & Cost Excellence)", company: "Boston Consulting Group", location: "Madrid, España", country: "ES", modality: "hibrido", source: "linkedin-curated", tags: ["madrid", "mbb"] },
  { title: "Transformation Manager – BCG Vantage", company: "Boston Consulting Group", location: "Madrid, España", country: "ES", modality: "hibrido", source: "linkedin-curated", tags: ["madrid", "mbb"] },
  { title: "Consultant, Business Transformation & Strategy", company: "FTI Consulting", location: "Madrid, España", country: "ES", modality: "hibrido", source: "linkedin-curated", tags: ["madrid"] },
  { title: "Consultant, Advisors & Consulting Services, Strategy & Transformation", company: "Mastercard", location: "Madrid, España", country: "ES", modality: "hibrido", source: "linkedin-curated", tags: ["madrid"] },
  { title: "Consulting Manager", company: "Visa", location: "Madrid, España", country: "ES", modality: "hibrido", source: "linkedin-curated", tags: ["madrid"] },
  { title: "Strategy & Operations Manager", company: "Revolut", location: "Madrid, España", country: "ES", modality: "hibrido", source: "linkedin-curated", tags: ["madrid", "fintech"] },
  { title: "Operations & Strategy Associate", company: "Northius", location: "Madrid, España", country: "ES", modality: "hibrido", source: "linkedin-curated", tags: ["madrid"] },
  { title: "Integration & Transformation Manager", company: "Expedia Group", location: "Madrid, España", country: "ES", modality: "hibrido", source: "linkedin-curated", tags: ["madrid"] },
  { title: "AI Commercial Enablement Lead", company: "Ebury", location: "Madrid, España", country: "ES", modality: "hibrido", source: "linkedin-curated", tags: ["madrid", "ai"] },
  { title: "Deployment Strategist", company: "HappyRobot", location: "Madrid, España", country: "ES", modality: "hibrido", source: "linkedin-curated", tags: ["madrid", "ai"] },
  { title: "Project Manager – CX & MarTech", company: "Amaris Consulting", location: "Madrid, España", country: "ES", modality: "remoto", source: "linkedin-curated", tags: ["madrid", "remote"] },
  { title: "Project Manager & PMO – Innovación y Transformación Digital", company: "Air Europa", location: "Madrid, España", country: "ES", modality: "hibrido", source: "linkedin-curated", tags: ["madrid"] },
  { title: "(Senior) Project Manager – Procurement / Supply Chain", company: "Inverto (BCG Company)", location: "Madrid, España", country: "ES", modality: "hibrido", source: "linkedin-curated", tags: ["madrid", "mbb"] },
  { title: "Team Lead Proyectos Digitales", company: "Deloitte", location: "Madrid, España", country: "ES", modality: "hibrido", source: "linkedin-curated", tags: ["madrid"] },
  { title: "Project Manager – Customer Advocacy Lead", company: "Hitachi Energy", location: "Madrid, España", country: "ES", modality: "hibrido", source: "linkedin-curated", tags: ["madrid"] },
  // Bogotá
  { title: "Consultant, MBA Internship Colombia 2027", company: "Boston Consulting Group", location: "Bogotá, Colombia", country: "CO", modality: "hibrido", source: "linkedin-curated", tags: ["bogota", "starred", "mbb", "internship"] },
  { title: "Consultant, Strategy & Transformation", company: "Mastercard", location: "Bogotá, Colombia", country: "CO", modality: "hibrido", source: "linkedin-curated", tags: ["bogota"] },
  { title: "Chief of Staff (AI & Operations)", company: "Cloud9", location: "Bogotá, Colombia", country: "CO", modality: "hibrido", source: "linkedin-curated", tags: ["bogota", "starred", "ai", "chief-of-staff"] },
  { title: "Gerencia de Innovación y Renovación PURINA", company: "Nestlé", location: "Bogotá, Colombia", country: "CO", modality: "hibrido", source: "linkedin-curated", tags: ["bogota"] },
  { title: "Growth Specialist", company: "Lulo bank", location: "Bogotá, Colombia", country: "CO", modality: "hibrido", source: "linkedin-curated", tags: ["bogota", "fintech"] },
  { title: "(Senior) Research Consultant – Americas", company: "Appinio", location: "Bogotá, Colombia", country: "CO", modality: "hibrido", source: "linkedin-curated", tags: ["bogota"] },
  { title: "Project Manager", company: "JLL", location: "Bogotá, Colombia", country: "CO", modality: "hibrido", source: "linkedin-curated", tags: ["bogota"] },
  { title: "Project Manager", company: "Claire Joster", location: "Bogotá, Colombia", country: "CO", modality: "hibrido", source: "linkedin-curated", tags: ["bogota"] },
  { title: "Project Manager Bilingüe", company: "NTT DATA Europe & Latam", location: "Bogotá, Colombia", country: "CO", modality: "hibrido", source: "linkedin-curated", tags: ["bogota"] },
  { title: "Project Manager Bilingüe", company: "OSYA", location: "Bogotá, Colombia", country: "CO", modality: "hibrido", source: "linkedin-curated", tags: ["bogota"] },
  { title: "Project Manager – Social & Influencer Operations", company: "Findasense", location: "Bogotá, Colombia", country: "CO", modality: "hibrido", source: "linkedin-curated", tags: ["bogota"] },
  { title: "Operations Manager (1265 – Colombia)", company: "Bionic Talent", location: "Bogotá, Colombia", country: "CO", modality: "remoto", source: "linkedin-curated", tags: ["bogota", "remote"] },
  { title: "JEFE MERCADO", company: "Coca-Cola FEMSA", location: "Bogotá, Colombia", country: "CO", modality: "presencial", source: "linkedin-curated", tags: ["bogota"] },
];

console.log(`Posting ${JOBS.length} jobs to ${URL_BASE}/api/admin/offers\n`);

let inserted = 0;
let duplicates = 0;
let failed = 0;
const tier = { alto: 0, medio: 0, bajo: 0, descartado: 0 };

for (const job of JOBS) {
  try {
    const res = await fetch(`${URL_BASE}/api/admin/offers`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(job),
    });
    const body = await res.json();
    if (!res.ok) {
      failed++;
      console.log(`✗ ${job.company} / ${job.title} → HTTP ${res.status} ${JSON.stringify(body).slice(0, 200)}`);
      continue;
    }
    if (body.duplicate) {
      duplicates++;
      console.log(`= ${job.company} / ${job.title} (dup)`);
    } else {
      inserted++;
      const fitTotal = body.fit_breakdown?.total ?? "?";
      const fitT = body.fit_breakdown?.tier ?? "?";
      const pri = body.priority ?? "?";
      tier[fitT] = (tier[fitT] ?? 0) + 1;
      console.log(`✓ ${job.company} / ${job.title} → fit ${fitTotal} (${fitT}) · priority ${pri}`);
    }
  } catch (e) {
    failed++;
    console.log(`✗ ${job.company} / ${job.title} → ${e.message}`);
  }
}

console.log(`\nSummary: ${inserted} inserted · ${duplicates} dups · ${failed} failed`);
console.log(`Tiers: ${JSON.stringify(tier)}`);
