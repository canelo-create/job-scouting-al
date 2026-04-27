// Add or update Vercel env vars from CLI args.
// Usage:
//   VERCEL_TOKEN=xxx node scripts/add-vercel-env.mjs KEY1=value1 KEY2=value2

const TOKEN = process.env.VERCEL_TOKEN;
const TEAM_SLUG = "canelo-creates-projects";
const PROJECT = "job-scouting-al";

if (!TOKEN) {
  console.error("VERCEL_TOKEN missing");
  process.exit(1);
}

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error("Provide KEY=VALUE pairs");
  process.exit(1);
}

const teamsRes = await fetch("https://api.vercel.com/v2/teams", {
  headers: { Authorization: `Bearer ${TOKEN}` },
});
const { teams } = await teamsRes.json();
const team = teams.find((t) => t.slug === TEAM_SLUG);

const listRes = await fetch(
  `https://api.vercel.com/v10/projects/${PROJECT}/env?teamId=${team.id}`,
  { headers: { Authorization: `Bearer ${TOKEN}` } },
);
const { envs } = await listRes.json();

for (const arg of args) {
  const idx = arg.indexOf("=");
  if (idx === -1) continue;
  const key = arg.slice(0, idx);
  const value = arg.slice(idx + 1);

  // Remove existing
  for (const e of envs.filter((x) => x.key === key)) {
    await fetch(
      `https://api.vercel.com/v9/projects/${PROJECT}/env/${e.id}?teamId=${team.id}`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${TOKEN}` },
      },
    );
  }

  const isPublic = key.startsWith("NEXT_PUBLIC_");
  const r = await fetch(
    `https://api.vercel.com/v10/projects/${PROJECT}/env?teamId=${team.id}`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        key,
        value,
        type: isPublic ? "plain" : "encrypted",
        target: ["production", "preview", "development"],
      }),
    },
  );
  console.log(r.ok ? `✓ ${key}` : `✗ ${key} ${await r.text()}`);
}
