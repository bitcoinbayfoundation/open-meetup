import { config } from "dotenv";
config({ path: ".env.local" });

import { put } from "@vercel/blob";
import { readFileSync, writeFileSync, readdirSync, statSync } from "fs";
import { join, extname } from "path";

const PUBLIC = join(process.cwd(), "public");
const MANIFEST_PATH = join(process.cwd(), "lib", "asset-manifest.json");

// Extensions to migrate (large binary files)
const MIGRATE_EXTS = new Set([
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
  ".gif",
  ".pdf",
  ".mp4",
]);

// Files/dirs to keep in git (small SVGs, nav logo)
const KEEP_LOCAL = new Set([
  "/brand/logo.png",
  "/brand/kit/bitcoin-bay-gradient-mark.svg",
  "/brand/supporters/blockspaces.svg",
  "/brand/supporters/coinflip.svg",
  "/brand/supporters/unchained.svg",
  "/events/soiree/bg.svg",
]);

function collectFiles(dir: string, base: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(dir)) {
    if (entry === ".DS_Store") continue;
    const full = join(dir, entry);
    const rel = `${base}/${entry}`;
    if (statSync(full).isDirectory()) {
      files.push(...collectFiles(full, rel));
    } else {
      const ext = extname(entry).toLowerCase();
      if (MIGRATE_EXTS.has(ext) && !KEEP_LOCAL.has(rel)) {
        files.push(rel);
      }
    }
  }
  return files;
}

async function main() {
  const files = collectFiles(PUBLIC, "");
  console.log(`Found ${files.length} files to migrate\n`);

  const manifest: Record<string, string> = {};
  let uploaded = 0;
  let failed = 0;

  for (const relPath of files) {
    const localPath = join(PUBLIC, relPath);
    const file = readFileSync(localPath);
    const blobPath = `site${relPath}`;

    try {
      const blob = await put(blobPath, file, { access: "public" });
      manifest[relPath] = blob.url;
      uploaded++;
      console.log(`✓ ${relPath} → ${blob.url}`);
    } catch (err) {
      failed++;
      console.error(`✗ ${relPath}: ${err}`);
    }
  }

  writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2));
  console.log(`\nDone: ${uploaded} uploaded, ${failed} failed`);
  console.log(`Manifest written to ${MANIFEST_PATH}`);
}

main().catch(console.error);
