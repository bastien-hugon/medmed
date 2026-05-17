import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

let _sql: NeonQueryFunction<false, false> | null = null;

export function db(): NeonQueryFunction<false, false> {
  if (_sql) return _sql;
  const url = process.env.NEON_DB_DATABASE_URL;
  if (!url) throw new Error("NEON_DB_DATABASE_URL is not set");
  _sql = neon(url);
  return _sql;
}
