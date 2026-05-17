import { config as loadEnv } from "dotenv";
import { neon } from "@neondatabase/serverless";

loadEnv({ path: ".env.local", quiet: true });
loadEnv({ path: ".env", quiet: true });

const url = process.env.NEON_DB_DATABASE_URL_UNPOOLED ?? process.env.NEON_DB_DATABASE_URL;
if (!url) {
  console.error("NEON_DB_DATABASE_URL[_UNPOOLED] not set");
  process.exit(1);
}
const sql = neon(url);

async function run() {
  // Cascade: deletes reviews + fsrs_state via FK ON DELETE CASCADE
  const r = await sql.query("DELETE FROM cards RETURNING id");
  console.log(`Cleared ${r.length} card(s) and dependent reviews/fsrs_state`);
  const orphan = await sql.query(
    "DELETE FROM sessions WHERE ended_at IS NULL AND id NOT IN (SELECT DISTINCT session_id FROM reviews) RETURNING id",
  );
  console.log(`Cleared ${orphan.length} orphan session(s)`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
