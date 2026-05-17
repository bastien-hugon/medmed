"use server";

import { randomUUID } from "node:crypto";
import {
  pickDrillBatch,
  recordDrillAttempt,
  getDrillHistoryStats,
  getDrillStreak,
  type DrillAttemptInput,
  type DrillStreak,
  type DrillTopicStats,
} from "@/lib/drill";
import type { CardRow } from "@/lib/cards";

export async function startDrill(
  topics: string[],
  limit: number = 15,
): Promise<{ drillSessionId: string; cards: CardRow[] }> {
  const cards = await pickDrillBatch(topics, limit);
  return { drillSessionId: randomUUID(), cards };
}

export async function submitDrillAttempt(input: DrillAttemptInput) {
  await recordDrillAttempt(input);
}

// Récap historique pour enrichir la page summary (#5) + streak (#4).
export async function getDrillRecap(): Promise<{
  streak: DrillStreak;
  history: DrillTopicStats[];
}> {
  const [streak, history] = await Promise.all([getDrillStreak(), getDrillHistoryStats()]);
  return { streak, history };
}
