import { randomUUID } from "node:crypto";
import { db } from "./db";
import type { CardRow } from "./cards";

// Topic dérivé du tag sdd[0] côté DB (matche la query topicsAvailable).
export type DrillTopic = {
  topic: string;
  introduced: number; // nb de cartes non-lesson déjà introduites
};

// Renvoie les topics ayant ≥ 1 carte non-lesson déjà introduite (= dans fsrs_state).
// Sert au sélecteur de la page /drill.
export async function getDrillTopics(): Promise<DrillTopic[]> {
  const sql = db();
  const rows = (await sql`
    SELECT
      (c.tags->'sdd'->>0) AS topic,
      COUNT(*)::int AS introduced
    FROM cards c
    JOIN fsrs_state f ON f.card_id = c.id
    WHERE c.status = 'active' AND c.kind != 'lesson'
    GROUP BY topic
    HAVING COUNT(*) > 0
    ORDER BY topic
  `) as Array<{ topic: string; introduced: number }>;
  return rows.filter((r) => r.topic !== null);
}

// Pick aléatoire de N cartes parmi les topics sélectionnés, déjà introduites.
// Exclut les lessons (le mode drill teste, ne lit pas).
export async function pickDrillBatch(
  topics: string[],
  limit: number = 15,
): Promise<CardRow[]> {
  if (topics.length === 0) return [];
  const sql = db();
  return (await sql`
    SELECT c.*, f.due, f.last_reviewed
    FROM cards c
    JOIN fsrs_state f ON f.card_id = c.id
    WHERE c.status = 'active'
      AND c.kind != 'lesson'
      AND (c.tags->'sdd'->>0) = ANY(${topics}::text[])
    ORDER BY random()
    LIMIT ${limit}
  `) as unknown as CardRow[];
}

export type DrillAttemptInput = {
  drillSessionId: string;
  cardId: string;
  correct: 0 | 1;
  durationMs: number;
};

export async function recordDrillAttempt(input: DrillAttemptInput): Promise<void> {
  const sql = db();
  await sql`
    INSERT INTO drill_attempts (id, drill_session_id, card_id, correct, duration_ms, attempted_at)
    VALUES (${randomUUID()}, ${input.drillSessionId}, ${input.cardId},
            ${input.correct}, ${input.durationMs}, ${Date.now()})
  `;
}

export type DrillTopicStats = {
  topic: string;
  attempts: number;
  correct: number;
  accuracy: number; // 0..1
  level: "good" | "mid" | "weak";
};

function levelFromAccuracy(acc: number): "good" | "mid" | "weak" {
  if (acc >= 0.8) return "good";
  if (acc >= 0.5) return "mid";
  return "weak";
}

// Stats pour une session drill précise (afficher à la fin).
export async function getDrillSessionStats(
  drillSessionId: string,
): Promise<{
  total: number;
  correct: number;
  byTopic: DrillTopicStats[];
}> {
  const sql = db();
  const totals = (await sql`
    SELECT COUNT(*)::int AS total, SUM(correct)::int AS correct
    FROM drill_attempts WHERE drill_session_id = ${drillSessionId}
  `) as Array<{ total: number; correct: number | null }>;
  const t = totals[0] ?? { total: 0, correct: 0 };

  const byTopic = (await sql`
    SELECT
      (c.tags->'sdd'->>0) AS topic,
      COUNT(*)::int AS attempts,
      SUM(da.correct)::int AS correct
    FROM drill_attempts da
    JOIN cards c ON c.id = da.card_id
    WHERE da.drill_session_id = ${drillSessionId}
    GROUP BY topic
    ORDER BY topic
  `) as Array<{ topic: string; attempts: number; correct: number }>;

  return {
    total: t.total,
    correct: t.correct ?? 0,
    byTopic: byTopic.map((b) => {
      const acc = b.attempts > 0 ? b.correct / b.attempts : 0;
      return {
        topic: b.topic,
        attempts: b.attempts,
        correct: b.correct,
        accuracy: acc,
        level: levelFromAccuracy(acc),
      };
    }),
  };
}

// Stats cumulées historique (toutes les drills confondues).
export async function getDrillHistoryStats(): Promise<DrillTopicStats[]> {
  const sql = db();
  const rows = (await sql`
    SELECT
      (c.tags->'sdd'->>0) AS topic,
      COUNT(*)::int AS attempts,
      SUM(da.correct)::int AS correct
    FROM drill_attempts da
    JOIN cards c ON c.id = da.card_id
    GROUP BY topic
    HAVING COUNT(*) > 0
    ORDER BY topic
  `) as Array<{ topic: string; attempts: number; correct: number }>;
  return rows.map((r) => {
    const acc = r.attempts > 0 ? r.correct / r.attempts : 0;
    return {
      topic: r.topic,
      attempts: r.attempts,
      correct: r.correct,
      accuracy: acc,
      level: levelFromAccuracy(acc),
    };
  });
}
