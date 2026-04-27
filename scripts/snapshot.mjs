import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(process.cwd());
const OUT_MD =
  process.argv[2] ??
  "C:\\Users\\lince\\OneDrive\\Desktop\\job-scouting-al-snapshot.md";

const EXCLUDE_DIRS = new Set([
  "node_modules",
  ".next",
  ".git",
  ".vercel",
  ".temp",
  ".branches",
]);
const EXCLUDE_FILES = new Set([
  ".env",
  ".env.local",
  ".env.development",
  ".env.production",
  "package-lock.json",
  "next-env.d.ts",
  ".DS_Store",
  "Thumbs.db",
]);
const INCLUDE_EXT = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".mjs",
  ".json",
  ".css",
  ".sql",
  ".md",
  ".svg",
  ".webmanifest",
  ".html",
]);
const TEXT_NO_EXT = new Set([".gitignore", ".gitkeep", ".eslintrc.json"]);

const EXT_TO_LANG = {
  ".ts": "typescript",
  ".tsx": "tsx",
  ".js": "javascript",
  ".mjs": "javascript",
  ".json": "json",
  ".css": "css",
  ".sql": "sql",
  ".md": "markdown",
  ".svg": "xml",
  ".webmanifest": "json",
  ".html": "html",
};

function walk(dir, acc = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (EXCLUDE_DIRS.has(entry.name)) continue;
      walk(full, acc);
    } else {
      if (EXCLUDE_FILES.has(entry.name)) continue;
      const ext = path.extname(entry.name).toLowerCase();
      if (INCLUDE_EXT.has(ext) || TEXT_NO_EXT.has(entry.name)) {
        acc.push(full);
      }
    }
  }
  return acc;
}

const files = walk(ROOT).sort();

function rel(p) {
  return path.relative(ROOT, p).replace(/\\/g, "/");
}

const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, "package.json"), "utf8"));

let md = `# Job Scouting AL — Code Snapshot

**Proyecto:** ${pkg.name} v${pkg.version}
**Generado:** ${new Date().toISOString()}
**Archivos:** ${files.length}

Portal personal post-MBA de búsqueda de empleo de Andrés Lince García (Canelo).
Next.js 14 + TypeScript + Tailwind v4 + shadcn/ui + Supabase + Anthropic + SerpApi + Vercel.

---

## Índice

`;

// Group files by top-level folder
const groups = new Map();
for (const f of files) {
  const r = rel(f);
  const top = r.split("/")[0].includes(".") ? "(root)" : r.split("/")[0];
  if (!groups.has(top)) groups.set(top, []);
  groups.get(top).push(r);
}

for (const [group, list] of [...groups.entries()].sort()) {
  md += `\n### \`${group}\`\n\n`;
  for (const f of list) {
    md += `- [\`${f}\`](#${f.replace(/[^a-z0-9]/gi, "-").toLowerCase()})\n`;
  }
}

md += `\n---\n\n## Archivos\n\n`;

for (const f of files) {
  const r = rel(f);
  const ext = path.extname(f).toLowerCase();
  const lang = EXT_TO_LANG[ext] ?? "";
  const content = fs.readFileSync(f, "utf8");
  const anchor = r.replace(/[^a-z0-9]/gi, "-").toLowerCase();
  md += `\n### \`${r}\`\n<a id="${anchor}"></a>\n\n\`\`\`${lang}\n${content}\n\`\`\`\n`;
}

fs.writeFileSync(OUT_MD, md, "utf8");
console.log(
  `✓ Wrote ${files.length} files → ${OUT_MD} (${Math.round(md.length / 1024)} KB)`,
);
