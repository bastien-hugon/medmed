import { db } from "./db";

export type LessonNote = {
  cardId: string;
  content: string;
  model: string;
  generatedAt: number;
};

export async function getNote(cardId: string): Promise<LessonNote | null> {
  const sql = db();
  const rows = (await sql`
    SELECT card_id, content, model, generated_at
    FROM lesson_notes WHERE card_id = ${cardId}
  `) as Array<{ card_id: string; content: string; model: string; generated_at: string }>;
  const r = rows[0];
  if (!r) return null;
  return {
    cardId: r.card_id,
    content: r.content,
    model: r.model,
    generatedAt: Number(r.generated_at),
  };
}

export async function saveNote(
  cardId: string,
  content: string,
  model: string,
): Promise<void> {
  const sql = db();
  await sql`
    INSERT INTO lesson_notes (card_id, content, model, generated_at)
    VALUES (${cardId}, ${content}, ${model}, ${Date.now()})
    ON CONFLICT (card_id) DO UPDATE SET
      content = EXCLUDED.content,
      model = EXCLUDED.model,
      generated_at = EXCLUDED.generated_at
  `;
}
