// Backfill une fois après la migration 002 : calcule concept_key pour les cartes
// existantes en utilisant la même règle que le seed (lib/concept.ts).
import { config as loadEnv } from "dotenv";
import { neon } from "@neondatabase/serverless";
import { conceptKey } from "../lib/concept";

loadEnv({ path: ".env.local", quiet: true });
loadEnv({ path: ".env", quiet: true });

const url = process.env.NEON_DB_DATABASE_URL_UNPOOLED ?? process.env.NEON_DB_DATABASE_URL;
if (!url) {
  console.error("NEON_DB_DATABASE_URL[_UNPOOLED] not set");
  process.exit(1);
}
const sql = neon(url);

async function run() {
  const cards = (await sql.query(
    "SELECT id FROM cards WHERE concept_key IS NULL",
  )) as Array<{ id: string }>;

  console.log(`Backfilling concept_key for ${cards.length} cards...`);
  let updated = 0;
  const unmatched: string[] = [];

  for (const c of cards) {
    const key = conceptKey(c.id);
    if (key === null) {
      unmatched.push(c.id);
      continue;
    }
    await sql.query("UPDATE cards SET concept_key = $1 WHERE id = $2", [key, c.id]);
    updated++;
  }

  console.log(`✓ Updated ${updated} cards`);
  if (unmatched.length > 0) {
    console.log(`⚠ ${unmatched.length} cards with non-matching id pattern (concept_key stays NULL):`);
    unmatched.slice(0, 10).forEach((id) => console.log(`  ${id}`));
    if (unmatched.length > 10) console.log(`  ... +${unmatched.length - 10}`);
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
