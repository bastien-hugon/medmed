import { db } from "./db";
import type { Card, Media } from "./schemas";

export type CardRow = {
  id: string;
  kind: Card["kind"];
  prompt: string;
  expected: unknown;
  rationale: string;
  tags: Card["tags"];
  difficulty: 1 | 2 | 3;
  source: Card["source"];
  illness_script_id: string | null;
  extra: Record<string, unknown> | null;
  media: Media[] | null;
  status: "active" | "pending-review" | "retired";
  due: number | null;
  last_reviewed: number | null;
};

export async function countDue(now: number = Date.now()): Promise<number> {
  const sql = db();
  const rows = (await sql`
    SELECT COUNT(*)::int AS n
    FROM cards c
    JOIN fsrs_state f ON f.card_id = c.id
    WHERE c.status = 'active' AND f.due <= ${now}
  `) as Array<{ n: number }>;
  return rows[0]?.n ?? 0;
}

export async function countNew(): Promise<number> {
  const sql = db();
  const rows = (await sql`
    SELECT COUNT(*)::int AS n
    FROM cards c
    LEFT JOIN fsrs_state f ON f.card_id = c.id
    WHERE c.status = 'active' AND f.card_id IS NULL
  `) as Array<{ n: number }>;
  return rows[0]?.n ?? 0;
}

export async function countActive(): Promise<number> {
  const sql = db();
  const rows = (await sql`SELECT COUNT(*)::int AS n FROM cards WHERE status = 'active'`) as Array<{
    n: number;
  }>;
  return rows[0]?.n ?? 0;
}

export async function getDueCards(limit: number, now: number = Date.now()): Promise<CardRow[]> {
  const sql = db();
  return (await sql`
    SELECT c.*, f.due, f.last_reviewed
    FROM cards c
    JOIN fsrs_state f ON f.card_id = c.id
    WHERE c.status = 'active' AND f.due <= ${now}
    ORDER BY f.due ASC
    LIMIT ${limit}
  `) as unknown as CardRow[];
}

export async function getNewCards(limit: number): Promise<CardRow[]> {
  const sql = db();
  return (await sql`
    SELECT c.*, NULL::bigint AS due, NULL::bigint AS last_reviewed
    FROM cards c
    LEFT JOIN fsrs_state f ON f.card_id = c.id
    WHERE c.status = 'active' AND f.card_id IS NULL
    ORDER BY c.difficulty ASC, c.created_at ASC
    LIMIT ${limit}
  `) as unknown as CardRow[];
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Extrait un identifiant de concept depuis un id de carte.
// Ex: "hta-c1-l05-systolique-diastolique" → "hta-c1-05"
//     "hta-c1-q05-systolique"             → "hta-c1-05"
// Permet de regrouper lesson + quiz du même concept dans une session.
function conceptKey(cardId: string): string {
  const m = cardId.match(/^(.+?-c\d+)-[lqs](\d+)/);
  return m ? `${m[1]}-${m[2]}` : cardId;
}

// Groupe les cartes par concept, lesson en premier dans chaque groupe.
// Préserve la cohérence pédagogique même quand on shuffle au niveau supérieur.
function groupByConceptOrdered(cards: CardRow[]): CardRow[][] {
  const groups = new Map<string, CardRow[]>();
  for (const c of cards) {
    const key = conceptKey(c.id);
    const list = groups.get(key);
    if (list) list.push(c);
    else groups.set(key, [c]);
  }
  for (const list of groups.values()) {
    list.sort((a, b) => {
      if (a.kind === "lesson" && b.kind !== "lesson") return -1;
      if (a.kind !== "lesson" && b.kind === "lesson") return 1;
      return a.id.localeCompare(b.id);
    });
  }
  return [...groups.values()];
}

export async function getReviewedCardIdsInSession(sessionId: string): Promise<string[]> {
  const sql = db();
  const rows = (await sql`
    SELECT DISTINCT card_id FROM reviews WHERE session_id = ${sessionId}
  `) as Array<{ card_id: string }>;
  return rows.map((r) => r.card_id);
}

const MASTERY_THRESHOLD = 0.8;

export async function getCurrentLayerDifficulty(): Promise<number | null> {
  const sql = db();
  const rows = (await sql`
    WITH stats AS (
      SELECT
        c.difficulty,
        COUNT(*)::int AS total,
        COUNT(f.card_id)::int AS seen,
        COALESCE(SUM(CASE WHEN (f.state->>'state')::int >= 2 THEN 1 ELSE 0 END), 0)::int AS mastered
      FROM cards c
      LEFT JOIN fsrs_state f ON f.card_id = c.id
      WHERE c.status = 'active'
      GROUP BY c.difficulty
    )
    SELECT difficulty
    FROM stats
    WHERE total > 0
      AND (seen < total OR (mastered::float / total) < ${MASTERY_THRESHOLD})
    ORDER BY difficulty ASC
    LIMIT 1
  `) as Array<{ difficulty: number }>;
  return rows[0]?.difficulty ?? null;
}

export async function getNewCardsAtDifficulty(
  difficulty: number,
  limit: number,
): Promise<CardRow[]> {
  const sql = db();
  return (await sql`
    SELECT c.*, NULL::bigint AS due, NULL::bigint AS last_reviewed
    FROM cards c
    LEFT JOIN fsrs_state f ON f.card_id = c.id
    WHERE c.status = 'active' AND f.card_id IS NULL AND c.difficulty = ${difficulty}
    ORDER BY c.created_at ASC
    LIMIT ${limit}
  `) as unknown as CardRow[];
}

export async function pickSessionBatch(
  target: number = 20,
  excludeIds: string[] = [],
): Promise<CardRow[]> {
  const dueLimit = 80;
  const newLimit = 15;
  const exclude = new Set(excludeIds);

  // 1. Due cards (toutes difficultés — déjà introduites)
  const due = await getDueCards(dueLimit);
  const filteredDue = due
    .filter((c) => !exclude.has(c.id))
    .slice(0, Math.ceil(target * 0.7));

  // 2. New cards: uniquement depuis la couche courante (gating)
  const remaining = Math.max(target - filteredDue.length, 0);
  const newCap = Math.min(remaining, newLimit);
  let filteredNew: CardRow[] = [];

  if (newCap > 0) {
    const currentDifficulty = await getCurrentLayerDifficulty();
    if (currentDifficulty !== null) {
      const fresh = await getNewCardsAtDifficulty(currentDifficulty, newCap);
      filteredNew = fresh.filter((c) => !exclude.has(c.id)).slice(0, newCap);
    }
  }

  // Dues : on shuffle les GROUPES de concept (pour varier d'un jour à l'autre)
  // mais on préserve l'ordre lesson → quiz à l'intérieur de chaque groupe
  // (BLUEPRINT pilier #2 / Partie 1bis : pas 2 lessons consécutives sans quiz).
  const dueGroups = groupByConceptOrdered(filteredDue);
  const dueOrdered = shuffle(dueGroups).flat();
  // Nouvelles : déjà ordonnées par created_at ASC (= ordre alphabétique du seed,
  // donc lesson avant quiz du même concept).
  return [...dueOrdered, ...filteredNew];
}

export async function getFsrsState(cardId: string): Promise<unknown | null> {
  const sql = db();
  const rows = (await sql`SELECT state FROM fsrs_state WHERE card_id = ${cardId}`) as Array<{
    state: unknown;
  }>;
  return rows[0]?.state ?? null;
}

export async function upsertFsrsState(
  cardId: string,
  state: unknown,
  due: number,
  lastReviewed: number,
  lapses: number,
): Promise<void> {
  const sql = db();
  await sql`
    INSERT INTO fsrs_state (card_id, state, due, last_reviewed, lapses)
    VALUES (${cardId}, ${JSON.stringify(state)}::jsonb, ${due}, ${lastReviewed}, ${lapses})
    ON CONFLICT (card_id)
    DO UPDATE SET state = EXCLUDED.state, due = EXCLUDED.due, last_reviewed = EXCLUDED.last_reviewed, lapses = EXCLUDED.lapses
  `;
}
