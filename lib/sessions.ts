import { randomUUID } from "node:crypto";
import { db } from "./db";

export type SessionRow = {
  id: string;
  started_at: number;
  ended_at: number | null;
  metrics: unknown;
  llm_notes: string | null;
};

export type ReviewInput = {
  cardId: string;
  sessionId: string;
  rating: 1 | 2 | 3 | 4;
  confidence: number | null;
  correct: 0 | 1 | null;
  durationMs: number;
};

export async function createSession(): Promise<string> {
  const sql = db();
  const id = randomUUID();
  await sql`INSERT INTO sessions (id, started_at) VALUES (${id}, ${Date.now()})`;
  return id;
}

export async function getSession(id: string): Promise<SessionRow | null> {
  const sql = db();
  const rows = (await sql`SELECT * FROM sessions WHERE id = ${id}`) as unknown as SessionRow[];
  return rows[0] ?? null;
}

export async function recordReview(input: ReviewInput): Promise<void> {
  const sql = db();
  await sql`
    INSERT INTO reviews (id, card_id, session_id, rating, confidence, correct, duration_ms, reviewed_at)
    VALUES (
      ${randomUUID()}, ${input.cardId}, ${input.sessionId}, ${input.rating},
      ${input.confidence}, ${input.correct}, ${input.durationMs}, ${Date.now()}
    )
  `;
}

export type SessionStats = {
  cards_total: number;
  cards_correct: number;
  cards_gradeable: number;
  confidence_avg: number | null;
  calibration_delta: number | null;
  duration_ms: number;
  retests: number;
};

// Aggrège les reviews en stats de session.
// - cards_total : nombre total de reviews enregistrés (inclut retests)
// - cards_gradeable : reviews où correct est 0 ou 1 (exclut lessons)
// - calibration_delta : moyenne (confidence/5 - correct), entre -1 et 1
//   positif = surconfiance, négatif = sous-confiance, ~0 = bien calibré
// - retests : nombre de cartes vues 2+ fois dans la session
async function computeStats(id: string): Promise<SessionStats> {
  const sql = db();
  const rows = (await sql`
    SELECT
      COUNT(*)::int AS cards_total,
      SUM(CASE WHEN correct = 1 THEN 1 ELSE 0 END)::int AS cards_correct,
      COUNT(*) FILTER (WHERE correct IS NOT NULL)::int AS cards_gradeable,
      AVG(confidence::float) AS confidence_avg,
      AVG((confidence::float / 5.0) - correct::float)
        FILTER (WHERE confidence IS NOT NULL AND correct IS NOT NULL) AS calibration_delta,
      COALESCE(SUM(duration_ms), 0)::int AS duration_ms,
      (COUNT(*) - COUNT(DISTINCT card_id))::int AS retests
    FROM reviews WHERE session_id = ${id}
  `) as Array<{
    cards_total: number;
    cards_correct: number;
    cards_gradeable: number;
    confidence_avg: number | null;
    calibration_delta: number | null;
    duration_ms: number;
    retests: number;
  }>;
  const s = rows[0];
  return {
    cards_total: s?.cards_total ?? 0,
    cards_correct: s?.cards_correct ?? 0,
    cards_gradeable: s?.cards_gradeable ?? 0,
    confidence_avg: s?.confidence_avg ?? null,
    calibration_delta: s?.calibration_delta ?? null,
    duration_ms: s?.duration_ms ?? 0,
    retests: s?.retests ?? 0,
  };
}

export async function getSessionStats(id: string): Promise<SessionStats> {
  return computeStats(id);
}

export async function endSession(id: string): Promise<void> {
  const sql = db();
  const ended_at = Date.now();
  const stats = await computeStats(id);
  await sql`
    UPDATE sessions
    SET ended_at = ${ended_at}, metrics = ${JSON.stringify(stats)}::jsonb
    WHERE id = ${id}
  `;
}

export async function getRecentSessions(limit: number = 7): Promise<SessionRow[]> {
  const sql = db();
  return (await sql`
    SELECT * FROM sessions
    WHERE ended_at IS NOT NULL
    ORDER BY started_at DESC
    LIMIT ${limit}
  `) as unknown as SessionRow[];
}

export async function get7DayStats(): Promise<{
  sessions: number;
  cards_total: number;
  cards_correct: number;
  cards_gradeable: number;
  total_duration_ms: number;
}> {
  const sql = db();
  const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const rows = (await sql`
    SELECT
      COUNT(DISTINCT s.id)::int AS sessions,
      COUNT(r.id)::int AS cards_total,
      SUM(CASE WHEN r.correct = 1 THEN 1 ELSE 0 END)::int AS cards_correct,
      COUNT(*) FILTER (WHERE r.correct IS NOT NULL)::int AS cards_gradeable,
      COALESCE(SUM(r.duration_ms), 0)::int AS total_duration_ms
    FROM sessions s
    LEFT JOIN reviews r ON r.session_id = s.id
    WHERE s.started_at >= ${cutoff}
  `) as Array<{
    sessions: number;
    cards_total: number;
    cards_gradeable: number;
    cards_correct: number;
    total_duration_ms: number;
  }>;
  return (
    rows[0] ?? {
      sessions: 0,
      cards_total: 0,
      cards_correct: 0,
      cards_gradeable: 0,
      total_duration_ms: 0,
    }
  );
}
