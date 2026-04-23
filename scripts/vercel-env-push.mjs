import fs from "node:fs";

const TOKEN = process.env.VERCEL_TOKEN;
const TEAM = process.env.VERCEL_TEAM_SLUG || "canelo-creates-projects";
const PROJECT = process.env.VERCEL_PROJECT_NAME || "job-scouting-al";

if (!TOKEN) {
  console.error("VERCEL_TOKEN missing");
  process.exit(1);
}

// Resolve team id
const teamsRes = await fetch("https://api.vercel.com/v2/teams", {
  headers: { Authorization: `Bearer ${TOKEN}` },
});
const teamsData = await teamsRes.json();
const team = teamsData.teams?.find((t) => t.slug === TEAM);
if (!team) {
  console.error(`Team ${TEAM} not found`);
  process.exit(1);
}
console.log(`→ Team: ${team.slug} (${team.id})`);

const envText = fs.readFileSync(".env.local", "utf8");
const entries = envText
  .split(/\r?\n/)
  .map((l) => l.trim())
  .filter((l) => l && !l.startsWith("#"))
  .map((l) => {
    const idx = l.indexOf("=");
    if (idx === -1) return null;
    return { key: l.slice(0, idx), value: l.slice(idx + 1) };
  })
  .filter(Boolean)
  .filter((e) => e.value.length > 0);

// Skip internal-only vars that shouldn't go to Vercel
const SKIP = new Set([
  "SUPABASE_ACCESS_TOKEN",
  "SUPABASE_PROJECT_REF",
  "VERCEL_TOKEN",
  "NEXT_PUBLIC_APP_URL", // will be set post-deploy with real URL
]);

const filtered = entries.filter((e) => !SKIP.has(e.key));
console.log(`→ Pushing ${filtered.length} env vars to ${PROJECT}`);

// First, clear any existing envs in the project so we don't duplicate
const listRes = await fetch(
  `https://api.vercel.com/v10/projects/${PROJECT}/env?teamId=${team.id}`,
  { headers: { Authorization: `Bearer ${TOKEN}` } },
);
const listData = await listRes.json();
if (listData.envs?.length) {
  console.log(`  Clearing ${listData.envs.length} existing envs`);
  for (const env of listData.envs) {
    await fetch(
      `https://api.vercel.com/v9/projects/${PROJECT}/env/${env.id}?teamId=${team.id}`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${TOKEN}` },
      },
    );
  }
}

let ok = 0;
let failed = [];
for (const { key, value } of filtered) {
  const isPublic = key.startsWith("NEXT_PUBLIC_");
  const res = await fetch(
    `https://api.vercel.com/v10/projects/${PROJECT}/env?teamId=${team.id}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        key,
        value,
        type: isPublic ? "plain" : "encrypted",
        target: ["production", "preview", "development"],
      }),
    },
  );
  if (res.ok) {
    console.log(`  ✓ ${key}`);
    ok++;
  } else {
    const err = await res.text();
    console.log(`  ✗ ${key}: ${res.status} ${err.slice(0, 200)}`);
    failed.push(key);
  }
}

console.log(`\nDone: ${ok}/${filtered.length} pushed. Failed: ${failed.length}`);
if (failed.length) process.exit(1);
