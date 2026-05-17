import { CardSchema } from "../lib/schemas.ts";
import { readFileSync, readdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dir = join(__dirname, "..", "content", "cards", "irc", "pending");
const files = readdirSync(dir).filter(f => f.endsWith(".json"));
let ok = 0, fail = 0;
const errors = [];
for (const f of files) {
  const data = JSON.parse(readFileSync(join(dir, f), "utf8"));
  const result = CardSchema.safeParse(data);
  if (result.success) ok++;
  else { fail++; errors.push({ file: f, issues: result.error.issues }); }
}
console.log(`OK: ${ok} / FAIL: ${fail}`);
for (const e of errors) {
  console.log(`-- ${e.file}`);
  for (const i of e.issues) console.log("  ", i.path.join("."), ":", i.message);
}
