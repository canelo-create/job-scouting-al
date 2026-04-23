// Post-deploy configuration:
// 1. Set/update NEXT_PUBLIC_APP_URL + GOOGLE_REDIRECT_URI in Vercel to prod URL
// 2. Update Supabase auth site_url + redirect allow list via Management API

const VERCEL_TOKEN = process.env.VERCEL_TOKEN;
const SUPABASE_TOKEN = process.env.SUPABASE_ACCESS_TOKEN;
const PROD_URL = process.env.PROD_URL || "https://job-scouting-al.vercel.app";
const TEAM_SLUG = "canelo-creates-projects";
const PROJECT = "job-scouting-al";
const SB_REF = "gpmtjucshtbrbddjrptj";

if (!VERCEL_TOKEN || !SUPABASE_TOKEN) {
  console.error("Missing VERCEL_TOKEN or SUPABASE_ACCESS_TOKEN");
  process.exit(1);
}

console.log(`→ Production URL: ${PROD_URL}\n`);

// Resolve Vercel team
const teamsRes = await fetch("https://api.vercel.com/v2/teams", {
  headers: { Authorization: `Bearer ${VERCEL_TOKEN}` },
});
const teamsData = await teamsRes.json();
const team = teamsData.teams.find((t) => t.slug === TEAM_SLUG);
console.log(`Vercel team: ${team.id}\n`);

// --- VERCEL: ensure envs are set correctly for prod ---
const targetEnvs = {
  NEXT_PUBLIC_APP_URL: { value: PROD_URL, plain: true },
  GOOGLE_REDIRECT_URI: {
    value: `${PROD_URL}/api/google/oauth-callback`,
    plain: false,
  },
};

// List existing envs
const listRes = await fetch(
  `https://api.vercel.com/v10/projects/${PROJECT}/env?teamId=${team.id}`,
  { headers: { Authorization: `Bearer ${VERCEL_TOKEN}` } },
);
const { envs } = await listRes.json();

for (const [key, { value, plain }] of Object.entries(targetEnvs)) {
  // Remove existing (all targets)
  const existing = envs.filter((e) => e.key === key);
  for (const e of existing) {
    await fetch(
      `https://api.vercel.com/v9/projects/${PROJECT}/env/${e.id}?teamId=${team.id}`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${VERCEL_TOKEN}` },
      },
    );
  }
  // Add fresh
  const res = await fetch(
    `https://api.vercel.com/v10/projects/${PROJECT}/env?teamId=${team.id}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${VERCEL_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        key,
        value,
        type: plain ? "plain" : "encrypted",
        target: ["production", "preview", "development"],
      }),
    },
  );
  console.log(res.ok ? `  ✓ ${key} → ${value}` : `  ✗ ${key} ${await res.text()}`);
}

// --- SUPABASE: site_url + redirect allow list ---
console.log("\n→ Supabase auth config");

const cfgRes = await fetch(
  `https://api.supabase.com/v1/projects/${SB_REF}/config/auth`,
  { headers: { Authorization: `Bearer ${SUPABASE_TOKEN}` } },
);
const currentCfg = await cfgRes.json();

const redirectList = new Set([
  "http://localhost:3000/auth/callback",
  "http://localhost:3000/api/google/oauth-callback",
  `${PROD_URL}/auth/callback`,
  `${PROD_URL}/api/google/oauth-callback`,
]);
if (currentCfg.uri_allow_list) {
  currentCfg.uri_allow_list.split(",").forEach((u) => redirectList.add(u.trim()));
}

const updateRes = await fetch(
  `https://api.supabase.com/v1/projects/${SB_REF}/config/auth`,
  {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${SUPABASE_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      site_url: PROD_URL,
      uri_allow_list: [...redirectList].filter(Boolean).join(","),
    }),
  },
);
if (updateRes.ok) {
  console.log(`  ✓ site_url = ${PROD_URL}`);
  console.log(`  ✓ redirect URIs:`);
  [...redirectList].forEach((u) => console.log(`      ${u}`));
} else {
  console.error("  ✗", await updateRes.text());
}

console.log("\nDone.");
