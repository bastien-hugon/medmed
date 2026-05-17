import { readdir, rename, stat } from "node:fs/promises";
import { join } from "node:path";

const arg = process.argv[2];
if (!arg) {
  console.error("Usage: tsx db/approve.ts <topic>");
  console.error("Example: tsx db/approve.ts hta");
  console.error("Moves every file from content/cards/<topic>/pending/ to content/cards/<topic>/");
  process.exit(1);
}

const TOPIC_DIR = join(process.cwd(), "content", "cards", arg);
const PENDING_DIR = join(TOPIC_DIR, "pending");

async function run() {
  try {
    await stat(PENDING_DIR);
  } catch {
    console.error(`No pending dir at ${PENDING_DIR}`);
    process.exit(1);
  }

  const entries = await readdir(PENDING_DIR, { withFileTypes: true });
  const files = entries.filter((e) => e.isFile() && e.name.endsWith(".json"));

  if (files.length === 0) {
    console.log("No pending cards to approve.");
    return;
  }

  for (const f of files) {
    const from = join(PENDING_DIR, f.name);
    const to = join(TOPIC_DIR, f.name);
    await rename(from, to);
    console.log(`✓ ${f.name}`);
  }
  console.log(`\nApproved ${files.length} card(s). Run \`npm run db:seed\` to push to Neon.`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
