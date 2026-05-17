import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { config as loadEnv } from "dotenv";
import { neon } from "@neondatabase/serverless";

loadEnv({ path: ".env.local" });
loadEnv({ path: ".env" });

const url = process.env.NEON_DB_DATABASE_URL_UNPOOLED ?? process.env.NEON_DB_DATABASE_URL;
if (!url) {
  console.error("NEON_DB_DATABASE_URL[_UNPOOLED] not set. Did you run `vercel env pull .env.local --environment=production`?");
  process.exit(1);
}

const sql = neon(url);
const MIGRATIONS_DIR = join(process.cwd(), "db", "migrations");

async function run() {
  await sql.query(`CREATE TABLE IF NOT EXISTS migrations (
    name TEXT PRIMARY KEY,
    applied_at BIGINT NOT NULL
  )`);

  const applied = (await sql.query(`SELECT name FROM migrations`)) as Array<{ name: string }>;
  const appliedSet = new Set(applied.map((r) => r.name));

  const files = (await readdir(MIGRATIONS_DIR))
    .filter((f) => f.endsWith(".sql"))
    .sort();

  for (const file of files) {
    if (appliedSet.has(file)) {
      console.log(`✓ ${file} (already applied)`);
      continue;
    }
    const text = await readFile(join(MIGRATIONS_DIR, file), "utf8");
    const statements = text
      .split(";")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    for (const stmt of statements) {
      await sql.query(stmt);
    }
    await sql.query(`INSERT INTO migrations (name, applied_at) VALUES ($1, $2)`, [file, Date.now()]);
    console.log(`✔ ${file} (applied)`);
  }
  console.log("Migrations done.");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
