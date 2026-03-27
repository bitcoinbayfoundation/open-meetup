import { config } from "dotenv";
config({ path: ".env" });
config({ path: ".env.local", override: true });

import { Pool } from "pg";
import { readFileSync, readdirSync } from "fs";
import { join } from "path";

const connectionString = process.env.POSTGRES_URL;

if (!connectionString) {
  console.error("❌ POSTGRES_URL is not set. Add it to your .env file.");
  process.exit(1);
}

const pool = new Pool({
  connectionString,
  ssl: connectionString.includes("localhost") ? undefined : { rejectUnauthorized: false },
});

async function migrate() {
  const migrationsDir = join(process.cwd(), "migrations");
  const files = readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  if (files.length === 0) {
    console.log("No migration files found.");
    return;
  }

  console.log(`Running ${files.length} migration(s)...\n`);

  for (const file of files) {
    const sql = readFileSync(join(migrationsDir, file), "utf-8");
    console.log(`  → ${file}`);
    try {
      await pool.query(sql);
      console.log(`    ✓ done`);
    } catch (err) {
      console.error(`    ✗ failed:`, (err as Error).message);
      process.exit(1);
    }
  }

  console.log("\n✓ All migrations applied.");
  await pool.end();
}

migrate();
