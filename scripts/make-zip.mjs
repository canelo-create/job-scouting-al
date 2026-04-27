import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

const ROOT = path.resolve(process.cwd());
const OUT =
  process.argv[2] ??
  "C:\\Users\\lince\\OneDrive\\Desktop\\job-scouting-al-source.zip";

const EXCLUDE_DIRS = new Set([
  "node_modules",
  ".next",
  ".vercel",
  ".git",
  ".turbo",
]);
const EXCLUDE_FILES = new Set([
  ".env",
  ".env.local",
  "package-lock.json",
  "next-env.d.ts",
]);

const STAGE = "C:\\temp\\jsal-stage\\job-scouting-al";
const STAGE_ROOT = "C:\\temp\\jsal-stage";
if (fs.existsSync(STAGE_ROOT)) fs.rmSync(STAGE_ROOT, { recursive: true, force: true });
fs.mkdirSync(STAGE, { recursive: true });

let fileCount = 0;

function copyRec(src, dst) {
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    if (entry.isDirectory() && EXCLUDE_DIRS.has(entry.name)) continue;
    if (EXCLUDE_FILES.has(entry.name)) continue;
    const srcFull = path.join(src, entry.name);
    const dstFull = path.join(dst, entry.name);
    if (entry.isDirectory()) {
      fs.mkdirSync(dstFull, { recursive: true });
      copyRec(srcFull, dstFull);
    } else {
      fs.copyFileSync(srcFull, dstFull);
      fileCount++;
    }
  }
}

console.log("Copying filtered tree to stage...");
copyRec(ROOT, STAGE);
console.log(`Staged ${fileCount} files`);

if (fs.existsSync(OUT)) fs.rmSync(OUT);

console.log("Creating zip with PowerShell Compress-Archive...");
const ps = `Compress-Archive -Path '${STAGE}' -DestinationPath '${OUT}' -CompressionLevel Optimal`;
execSync(`powershell.exe -NoProfile -Command "${ps}"`, { stdio: "inherit" });

fs.rmSync(STAGE_ROOT, { recursive: true, force: true });
const sz = fs.statSync(OUT).size;
console.log(`\n✓ ${OUT} (${Math.round(sz / 1024)} KB, ${fileCount} files)`);
