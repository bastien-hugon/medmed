import { randomUUID } from "node:crypto";
import { db } from "./db";
import type { CardRow } from "./cards";

// Topic dérivé du tag sdd[0]. Le drill ne sert QUE les concepts déjà vus
// (= concept_key avec au moins 1 carte introduite, lesson ou quiz).
// Champs :
//   - drilable : cartes non-lesson dont le concept a été touché → pool drill réel
//   - introduced : cartes non-lesson déjà passées en fsrs_state (sous-ensemble)
//   - total : cartes non-lesson totales du topic (info contextuelle)
export type DrillTopic = {
  topic: string;
  drilable: number;
  introduced: number;
  total: number;
};

export async function getDrillTopics(): Promise<DrillTopic[]> {
  const sql = db();
  const rows = (await sql`
    WITH seen_concepts AS (
      SELECT DISTINCT c.concept_key
      FROM cards c
      JOIN fsrs_state f ON f.card_id = c.id
      WHERE c.status = 'active' AND c.concept_key IS NOT NULL
    )
    SELECT
      (c.tags->'sdd'->>0) AS topic,
      COUNT(*) FILTER (
        WHERE c.kind != 'lesson'
          AND c.concept_key IS NOT NULL
          AND c.concept_key IN (SELECT concept_key FROM seen_concepts)
      )::int AS drilable,
      COUNT(f.card_id) FILTER (WHERE c.kind != 'lesson')::int AS introduced,
      COUNT(*) FILTER (WHERE c.kind != 'lesson')::int AS total
    FROM cards c
    LEFT JOIN fsrs_state f ON f.card_id = c.id
    WHERE c.status = 'active'
    GROUP BY topic
    HAVING COUNT(*) FILTER (
      WHERE c.kind != 'lesson'
        AND c.concept_key IS NOT NULL
        AND c.concept_key IN (SELECT concept_key FROM seen_concepts)
    ) > 0
    ORDER BY topic
  `) as Array<{ topic: string; drilable: number; introduced: number; total: number }>;
  return rows.filter((r) => r.topic !== null);
}

// Pick N cartes non-lesson au hasard parmi les CONCEPTS DÉJÀ VUS (= dont au moins
// une carte est dans fsrs_state) pour les topics sélectionnés.
// Une carte est "drilable" si son concept_key est dans le set des concepts vus —
// pas besoin que la carte elle-même soit introduite, tant que son concept l'est.
// Ça étend naturellement le pool (toutes les questions liées à un concept déjà
// abordé deviennent dispo) sans déborder sur des concepts pas encore touchés.
export async function pickDrillBatch(
  topics: string[],
  limit: number = 15,
): Promise<CardRow[]> {
  if (topics.length === 0) return [];
  const sql = db();
  return (await sql`
    WITH seen_concepts AS (
      SELECT DISTINCT c.concept_key
      FROM cards c
      JOIN fsrs_state f ON f.card_id = c.id
      WHERE c.status = 'active' AND c.concept_key IS NOT NULL
    )
    SELECT c.*, f.due, f.last_reviewed
    FROM cards c
    LEFT JOIN fsrs_state f ON f.card_id = c.id
    WHERE c.status = 'active'
      AND c.kind != 'lesson'
      AND c.concept_key IS NOT NULL
      AND c.concept_key IN (SELECT concept_key FROM seen_concepts)
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

// Streak de jours consécutifs avec ≥ 1 drill (depuis aujourd'hui ou hier).
export type DrillStreak = {
  current: number;
  longest: number;
  lastDrillAt: number | null;
  totalDays: number;
};

export async function getDrillStreak(): Promise<DrillStreak> {
  const sql = db();
  const rows = (await sql`
    SELECT DATE(to_timestamp(attempted_at / 1000)) AS day,
           MAX(attempted_at)::bigint AS last_ms
    FROM drill_attempts
    GROUP BY day
    ORDER BY day DESC
  `) as Array<{ day: string; last_ms: string }>;

  if (rows.length === 0) {
    return { current: 0, longest: 0, lastDrillAt: null, totalDays: 0 };
  }

  const days = rows.map((r) => new Date(r.day + "T00:00:00Z").getTime());
  const DAY_MS = 86400000;
  const today = Math.floor(Date.now() / DAY_MS) * DAY_MS;
  const yesterday = today - DAY_MS;

  // Streak en cours : on accepte que la dernière soit aujourd'hui ou hier
  let current = 0;
  if (days[0] === today || days[0] === yesterday) {
    let expected = days[0];
    for (const d of days) {
      if (d === expected) {
        current++;
        expected -= DAY_MS;
      } else {
        break;
      }
    }
  }

  // Plus longue streak historique
  let longest = 1;
  let run = 1;
  for (let i = 1; i < days.length; i++) {
    if (days[i - 1] - days[i] === DAY_MS) {
      run++;
    } else {
      longest = Math.max(longest, run);
      run = 1;
    }
  }
  longest = Math.max(longest, run);

  return {
    current,
    longest,
    lastDrillAt: rows[0] ? Number(rows[0].last_ms) : null,
    totalDays: rows.length,
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
