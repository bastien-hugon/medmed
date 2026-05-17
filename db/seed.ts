import { readdir, readFile, stat } from "node:fs/promises";
import { join } from "node:path";
import { config as loadEnv } from "dotenv";
import { neon } from "@neondatabase/serverless";
import { CardSchema, type Card } from "../lib/schemas";

loadEnv({ path: ".env.local" });
loadEnv({ path: ".env" });

const url = process.env.NEON_DB_DATABASE_URL_UNPOOLED ?? process.env.NEON_DB_DATABASE_URL;
if (!url) {
  console.error("NEON_DB_DATABASE_URL[_UNPOOLED] not set");
  process.exit(1);
}
const sql = neon(url);

const ROOT = join(process.cwd(), "content", "cards");

async function walk(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const out: string[] = [];
  for (const e of entries) {
    // Skip "pending" directories — these are LLM-generated cards awaiting human review
    if (e.isDirectory() && e.name === "pending") continue;
    const p = join(dir, e.name);
    if (e.isDirectory()) {
      out.push(...(await walk(p)));
    } else if (e.isFile() && e.name.endsWith(".json")) {
      out.push(p);
    }
  }
  return out;
}

function extraFor(card: Card): Record<string, unknown> | null {
  if (card.kind === "qcm-vignette") {
    return { choices: card.choices };
  }
  if (card.kind === "sct") {
    return { hypothesis: card.hypothesis, new_info: card.new_info };
  }
  return null;
}

function expectedFor(card: Card): unknown {
  if (card.kind === "lesson") return [];
  if (card.kind === "sct") return [card.expected];
  return card.expected;
}

async function upsertCard(card: Card): Promise<"inserted" | "updated"> {
  const now = Date.now();
  const extra = extraFor(card);
  const expected = expectedFor(card);
  const media = card.media && card.media.length > 0 ? card.media : null;

  const existing = (await sql`SELECT id FROM cards WHERE id = ${card.id}`) as Array<{ id: string }>;

  await sql`
    INSERT INTO cards (
      id, kind, prompt, expected, rationale, tags, difficulty, source,
      illness_script_id, extra, media, status, created_at, updated_at
    )
    VALUES (
      ${card.id}, ${card.kind}, ${card.prompt},
      ${JSON.stringify(expected)}::jsonb, ${card.rationale},
      ${JSON.stringify(card.tags)}::jsonb, ${card.difficulty},
      ${JSON.stringify(card.source)}::jsonb,
      ${card.illness_script_id ?? null},
      ${extra ? JSON.stringify(extra) : null}::jsonb,
      ${media ? JSON.stringify(media) : null}::jsonb,
      ${card.status ?? "active"}, ${now}, ${now}
    )
    ON CONFLICT (id) DO UPDATE SET
      kind = EXCLUDED.kind,
      prompt = EXCLUDED.prompt,
      expected = EXCLUDED.expected,
      rationale = EXCLUDED.rationale,
      tags = EXCLUDED.tags,
      difficulty = EXCLUDED.difficulty,
      source = EXCLUDED.source,
      illness_script_id = EXCLUDED.illness_script_id,
      extra = EXCLUDED.extra,
      media = EXCLUDED.media,
      status = EXCLUDED.status,
      updated_at = EXCLUDED.updated_at
  `;
  return existing.length > 0 ? "updated" : "inserted";
}

async function run() {
  try {
    await stat(ROOT);
  } catch {
    console.log(`No content directory at ${ROOT} — nothing to seed.`);
    return;
  }
  const files = await walk(ROOT);
  console.log(`Found ${files.length} card files`);

  let inserted = 0;
  let updated = 0;
  let failed = 0;

  for (const file of files) {
    try {
      const text = await readFile(file, "utf8");
      const parsed = JSON.parse(text);
      const card = CardSchema.parse(parsed);
      const result = await upsertCard(card);
      if (result === "inserted") inserted++;
      else updated++;
      console.log(`  ${result === "inserted" ? "+" : "~"} ${card.id}`);
    } catch (err) {
      failed++;
      console.error(`  ✗ ${file}:`, err instanceof Error ? err.message : err);
    }
  }
  console.log(`\nSeed done: ${inserted} inserted, ${updated} updated, ${failed} failed.`);
  if (failed > 0) process.exit(1);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
