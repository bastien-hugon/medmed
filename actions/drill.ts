"use server";

import { randomUUID } from "node:crypto";
import {
  pickDrillBatch,
  recordDrillAttempt,
  type DrillAttemptInput,
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
