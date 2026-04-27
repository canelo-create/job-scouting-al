// Insert 19 AI/Automation curated jobs via admin API.
const TOKEN = process.env.COWORK_ADMIN_TOKEN;
const PORTAL = process.env.PORTAL_URL ?? "https://job-scouting-al.vercel.app";
if (!TOKEN) { console.error("COWORK_ADMIN_TOKEN missing"); process.exit(1); }

const JOBS = [
  // Madrid AI / Automation
  { title: "Senior Customer Success Operations EMEA", company: "n8n", location: "Madrid, España", country: "ES", modality: "remoto", source: "linkedin-curated-ai", source_url: "https://www.linkedin.com/jobs/view/4404100712", tags: ["madrid", "starred", "ai", "automation", "n8n", "remote"] },
  { title: "AI Engineering Manager (Remote Europe)", company: "n8n", location: "Madrid, España", country: "ES", modality: "remoto", source: "linkedin-curated-ai", source_url: "https://www.linkedin.com/jobs/view/4401089807", tags: ["madrid", "ai", "automation", "n8n", "remote"] },
  { title: "Freelance n8n Workflow Developer – AI Trainer", company: "Mindrift", location: "Madrid, España", country: "ES", modality: "remoto", source: "linkedin-curated-ai", source_url: "https://www.linkedin.com/jobs/view/4406869026", tags: ["madrid", "starred", "ai", "automation", "n8n", "freelance"] },
  { title: "AI Transformation & Implementation Lead", company: "Nextlane", location: "Madrid, España", country: "ES", modality: "hibrido", source: "linkedin-curated-ai", source_url: "https://www.linkedin.com/jobs/view/4387830256", tags: ["madrid", "starred", "ai", "saas", "scale-up"] },
  { title: "AI Product Manager (Revenue / Customer Success)", company: "Ebury", location: "Madrid, España", country: "ES", modality: "hibrido", source: "linkedin-curated-ai", source_url: "https://www.linkedin.com/jobs/view/4406101024", tags: ["madrid", "ai", "fintech", "scale-up"] },
  { title: "AI Agents Solutions Architect – Compliance", company: "Kraken", location: "Madrid, España", country: "ES", modality: "remoto", source: "linkedin-curated-ai", source_url: "https://www.linkedin.com/jobs/view/4388578156", tags: ["madrid", "ai", "crypto", "scale-up"] },
  { title: "AI Growth & Agentic Orchestration Expert", company: "SUSE", location: "Madrid, España", country: "ES", modality: "hibrido", source: "linkedin-curated-ai", source_url: "https://www.linkedin.com/jobs/view/4401966778", tags: ["madrid", "ai", "tech"] },
  { title: "Strategic AI Transformation Manager", company: "Santander", location: "Madrid, España", country: "ES", modality: "hibrido", source: "linkedin-curated-ai", source_url: "https://www.linkedin.com/jobs/view/4389905328", tags: ["madrid", "ai", "banking"] },
  { title: "AI Transformation Manager", company: "KPMG España", location: "Madrid, España", country: "ES", modality: "hibrido", source: "linkedin-curated-ai", source_url: "https://www.linkedin.com/jobs/view/4338184022", tags: ["madrid", "ai", "consulting", "big4"] },
  { title: "Growth Strategy & Operations Manager", company: "Airalo", location: "Madrid, España", country: "ES", modality: "hibrido", source: "linkedin-curated-ai", source_url: "https://www.linkedin.com/jobs/view/4395986814", tags: ["madrid", "travel-tech", "scale-up"] },
  { title: "Sales Operations Business Partner", company: "Deel", location: "Madrid, España", country: "ES", modality: "remoto", source: "linkedin-curated-ai", source_url: "https://www.linkedin.com/jobs/view/4403777982", tags: ["madrid", "hr-tech", "unicorn"] },
  { title: "Growth Operations Manager", company: "MAKE (Banking)", location: "Madrid, España", country: "ES", modality: "hibrido", source: "linkedin-curated-ai", source_url: "https://www.linkedin.com/jobs/view/4405008204", tags: ["madrid", "fintech"] },
  { title: "Senior Enterprise AI Consultant", company: "Plain Concepts", location: "Madrid, España", country: "ES", modality: "hibrido", source: "linkedin-curated-ai", source_url: "https://www.linkedin.com/jobs/view/4406848698", tags: ["madrid", "ai", "consulting"] },
  // Bogotá AI / Automation
  { title: "AI Operations Manager", company: "DevSavant", location: "Bogotá, Colombia", country: "CO", modality: "hibrido", source: "linkedin-curated-ai", source_url: "https://www.linkedin.com/jobs/view/4400292939", tags: ["bogota", "starred", "ai", "startup"] },
  { title: "Strategy Consultant – AI Training & Evaluation", company: "Mindrift", location: "Bogotá, Colombia", country: "CO", modality: "remoto", source: "linkedin-curated-ai", source_url: "https://www.linkedin.com/jobs/view/4407414840", tags: ["bogota", "starred", "ai", "freelance"] },
  { title: "AI Product Manager", company: "TP (Teleperformance)", location: "Bogotá, Colombia", country: "CO", modality: "hibrido", source: "linkedin-curated-ai", source_url: "https://www.linkedin.com/jobs/view/4403130240", tags: ["bogota", "ai", "tech"] },
  { title: "AI Marketing Operations Specialist", company: "Hire With Near", location: "Bogotá, Colombia", country: "CO", modality: "remoto", source: "linkedin-curated-ai", source_url: "https://www.linkedin.com/jobs/view/4404394227", tags: ["bogota", "ai", "marketing-tech"] },
  { title: "Conversational AI Delivery Manager", company: "Foundever", location: "Bogotá, Colombia", country: "CO", modality: "hibrido", source: "linkedin-curated-ai", source_url: "https://www.linkedin.com/jobs/view/4386576803", tags: ["bogota", "ai", "cx-tech"] },
  { title: "LATAM Internship – Project Mgmt AI & Salesforce", company: "Salesforce", location: "Bogotá, Colombia", country: "CO", modality: "hibrido", source: "linkedin-curated-ai", source_url: "https://www.linkedin.com/jobs/view/4401791797", tags: ["bogota", "ai", "internship", "tech"] },
];

console.log(`Posting ${JOBS.length} AI/Automation jobs to ${PORTAL}/api/admin/offers\n`);

let inserted = 0, dups = 0, failed = 0;
const tier = { alto: 0, medio: 0, bajo: 0, descartado: 0 };

for (const job of JOBS) {
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

console.log(`\nDone: ${inserted} inserted · ${dups} dups · ${failed} failed`);
console.log(`Tiers: ${JSON.stringify(tier)}`);
