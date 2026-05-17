import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { CardSchema } from "../lib/schemas.ts";

const dir = "content/cards/depistage-cancer/pending";
let ok = 0, ko = 0;
for (const f of readdirSync(dir).sort()) {
  const p = path.join(dir, f);
  const j = JSON.parse(readFileSync(p, "utf8"));
  const r = CardSchema.safeParse(j);
  if (r.success) { ok++; console.log("OK ", f); }
  else { ko++; console.log("KO ", f, JSON.stringify(r.error.issues, null, 2)); }
}
console.log("\nTotal:", ok, "OK,", ko, "KO");
