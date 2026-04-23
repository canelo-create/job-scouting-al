import fs from "node:fs";
import path from "node:path";

const PROJECT_REF = process.env.SUPABASE_PROJECT_REF || "gpmtjucshtbrbddjrptj";
const TOKEN = process.env.SUPABASE_ACCESS_TOKEN;

if (!TOKEN) {
  console.error("SUPABASE_ACCESS_TOKEN missing");
  process.exit(1);
}

const migrationFile =
  process.argv[2] ?? "supabase/migrations/0001_init.sql";
const sql = fs.readFileSync(migrationFile, "utf8");

console.log(`→ Running ${path.basename(migrationFile)} (${sql.length} chars) on ${PROJECT_REF}`);

const res = await fetch(
  `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
  {
    method: "POST",
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query: sql }),
  },
);

const body = await res.text();
console.log(`HTTP ${res.status}`);
if (res.ok) {
  console.log("✓ Migration applied successfully");
  console.log("Response:", body.slice(0, 500));
} else {
  console.error("✗ Migration failed");
  console.error(body);
  process.exit(1);
}
