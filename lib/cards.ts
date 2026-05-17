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
export const MASTERY_THRESHOLD_PCT = 80;

export type TopicLayerState = {
  difficulty: number;
  deck: number;
  introduced: number;
  mastered: number;
  masteryPct: number;
  locked: boolean; // verrouillée si la couche précédente n'est pas mastered
};

export type TopicState = {
  topic: string;
  layers: TopicLayerState[];
  totalDeck: number;
  totalIntroduced: number;
  totalMastered: number;
};

// État global par topic : pour chaque couche, deck/introduced/mastered + verrouillage.
// Utilisé sur le dashboard pour montrer "où tu en es" et "ce qui reste à débloquer".
export async function getTopicStates(): Promise<TopicState[]> {
  const sql = db();
  const rows = (await sql`
    SELECT
      (c.tags->'sdd'->>0) AS topic,
      c.difficulty::int AS difficulty,
      COUNT(*)::int AS deck,
      COUNT(f.card_id)::int AS introduced,
      COALESCE(SUM(CASE WHEN (f.state->>'state')::int >= 2 THEN 1 ELSE 0 END), 0)::int AS mastered
    FROM cards c
    LEFT JOIN fsrs_state f ON f.card_id = c.id
    WHERE c.status = 'active'
    GROUP BY topic, c.difficulty
  `) as Array<{
    topic: string | null;
    difficulty: number;
    deck: number;
    introduced: number;
    mastered: number;
  }>;

  const map = new Map<string, TopicState>();
  for (const r of rows) {
    if (!r.topic) continue;
    if (!map.has(r.topic)) {
      map.set(r.topic, {
        topic: r.topic,
        layers: [],
        totalDeck: 0,
        totalIntroduced: 0,
        totalMastered: 0,
      });
    }
    const t = map.get(r.topic)!;
    const masteryPct = r.deck > 0 ? (r.mastered / r.deck) * 100 : 0;
    t.layers.push({
      difficulty: r.difficulty,
      deck: r.deck,
      introduced: r.introduced,
      mastered: r.mastered,
      masteryPct,
      locked: false,
    });
    t.totalDeck += r.deck;
    t.totalIntroduced += r.introduced;
    t.totalMastered += r.mastered;
  }

  // Verrouillage : une couche L est locked si la couche L-1 n'est pas mastered (≥ 80 %)
  for (const state of map.values()) {
    state.layers.sort((a, b) => a.difficulty - b.difficulty);
    for (let i = 1; i < state.layers.length; i++) {
      if (state.layers[i - 1].masteryPct < MASTERY_THRESHOLD_PCT) {
        state.layers[i].locked = true;
      }
    }
  }

  return Array.from(map.values()).sort((a, b) => a.topic.localeCompare(b.topic));
}

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

// Plafond strict de lessons par session : creuser et prendre des notes prend
// du temps. Au-delà, l'attention chute (cf. l'analyse session anxiete qui a été
// skipée par fatigue). Quizzes ne sont pas capés.
export const MAX_LESSONS_PER_SESSION = 4;

function capLessons(cards: CardRow[], maxLessons: number): CardRow[] {
  let n = 0;
  return cards.filter((c) => {
    if (c.kind !== "lesson") return true;
    n++;
    return n <= maxLessons;
  });
}

export async function pickSessionBatch(
  target: number = 10,
  excludeIds: string[] = [],
): Promise<CardRow[]> {
  const dueLimit = 80;
  // On fetch plus de cartes que nécessaire pour pouvoir capper les lessons sans
  // tomber sous le target s'il y a beaucoup de quizzes derrière chaque lesson.
  const newLimit = 25;
  const exclude = new Set(excludeIds);

  // 1. Due cards (toutes difficultés — déjà introduites)
  const due = await getDueCards(dueLimit);
  const filteredDue = due
    .filter((c) => !exclude.has(c.id))
    .slice(0, Math.ceil(target * 0.7));

  // 2. New cards: uniquement depuis la couche courante (gating)
  const remaining = Math.max(target - filteredDue.length, 0);
  const newCap = Math.min(remaining + 5, newLimit); // marge pour le cap lessons
  let filteredNew: CardRow[] = [];

  if (newCap > 0) {
    const currentDifficulty = await getCurrentLayerDifficulty();
    if (currentDifficulty !== null) {
      const fresh = await getNewCardsAtDifficulty(currentDifficulty, newCap);
      filteredNew = fresh.filter((c) => !exclude.has(c.id));
    }
  }

  // Dues : shuffle les GROUPES de concept (pour varier d'un jour à l'autre)
  // mais on préserve l'ordre lesson → quiz à l'intérieur de chaque groupe.
  const dueGroups = groupByConceptOrdered(filteredDue);
  const dueOrdered = shuffle(dueGroups).flat();
  // Nouvelles : déjà ordonnées par created_at ASC (lesson avant quiz du même concept).
  const combined = [...dueOrdered, ...filteredNew];

  // Cap lessons : on garde les MAX_LESSONS_PER_SESSION premières lessons,
  // les autres sont reportées à la prochaine session. Les quizzes "orphelins"
  // (dont la lesson est coupée) sont gardés — la lesson était dans une session
  // précédente ou viendra plus tard, le quiz peut être révisé en attendant.
  const capped = capLessons(combined, MAX_LESSONS_PER_SESSION);

  return capped.slice(0, target);
}

// ---------------- Library (mode lecture, indépendant des sessions FSRS) -----

export type LibraryTopic = {
  topic: string;
  totalLessons: number;
  introducedLessons: number;
};

// Liste TOUS les topics avec ≥ 1 lesson active. Inclut les topics 0 % vus
// (affichés verrouillés). Tri : topics entamés d'abord, puis verrouillés.
export async function getLibraryTopics(): Promise<LibraryTopic[]> {
  const sql = db();
  const rows = (await sql`
    SELECT
      (c.tags->'sdd'->>0) AS topic,
      COUNT(*) FILTER (WHERE c.kind = 'lesson')::int AS total_lessons,
      COUNT(*) FILTER (WHERE c.kind = 'lesson' AND f.card_id IS NOT NULL)::int AS introduced_lessons
    FROM cards c
    LEFT JOIN fsrs_state f ON f.card_id = c.id
    WHERE c.status = 'active'
    GROUP BY topic
    HAVING COUNT(*) FILTER (WHERE c.kind = 'lesson') >= 1
    ORDER BY (COUNT(*) FILTER (WHERE c.kind = 'lesson' AND f.card_id IS NOT NULL) > 0) DESC,
             topic ASC
  `) as Array<{ topic: string | null; total_lessons: number; introduced_lessons: number }>;
  return rows
    .filter((r) => r.topic !== null)
    .map((r) => ({
      topic: r.topic as string,
      totalLessons: r.total_lessons,
      introducedLessons: r.introduced_lessons,
    }));
}

export type LibraryLessonRow = {
  id: string;
  prompt: string;
  rationale: string;
  source: Card["source"];
  tags: Card["tags"];
  difficulty: 1 | 2 | 3;
  media: import("./schemas").Media[] | null;
  introduced: boolean;
};

// Lessons d'un topic donné, avec le flag "introduced" pour griser les non-vues.
export async function getLibraryLessons(topic: string): Promise<LibraryLessonRow[]> {
  const sql = db();
  return (await sql`
    SELECT
      c.id, c.prompt, c.rationale, c.source, c.tags, c.difficulty, c.media,
      (f.card_id IS NOT NULL) AS introduced
    FROM cards c
    LEFT JOIN fsrs_state f ON f.card_id = c.id
    WHERE c.status = 'active'
      AND c.kind = 'lesson'
      AND (c.tags->'sdd'->>0) = ${topic}
    ORDER BY c.created_at ASC, c.id ASC
  `) as unknown as LibraryLessonRow[];
}

// Lesson individuelle pour la page lecture. Mode aperçu : on autorise la
// consultation même si la lesson n'a jamais été vue en session — le flag
// `introduced` permet à l'UI d'afficher un bandeau "aperçu" et d'adapter.
// Renvoie null uniquement si la lesson n'existe pas / inactive / pas une lesson.
export async function getLibraryLesson(cardId: string): Promise<LibraryLessonRow | null> {
  const sql = db();
  const rows = (await sql`
    SELECT
      c.id, c.prompt, c.rationale, c.source, c.tags, c.difficulty, c.media,
      (f.card_id IS NOT NULL) AS introduced
    FROM cards c
    LEFT JOIN fsrs_state f ON f.card_id = c.id
    WHERE c.id = ${cardId}
      AND c.status = 'active'
      AND c.kind = 'lesson'
  `) as unknown as LibraryLessonRow[];
  return rows[0] ?? null;
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
