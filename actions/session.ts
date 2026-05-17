"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createSession, endSession, recordReview, type ReviewInput } from "@/lib/sessions";
import { emptyState, reviveState, schedule } from "@/lib/fsrs";
import { getFsrsState, upsertFsrsState } from "@/lib/cards";

export async function startSession() {
  const id = await createSession();
  redirect(`/session/${id}`);
}

export async function submitReview(input: ReviewInput) {
  const stored = await getFsrsState(input.cardId);
  const state = stored ? reviveState(stored) : emptyState();
  const now = new Date();
  const result = schedule(state, input.rating, now);
  const newState = result.card;

  await upsertFsrsState(
    input.cardId,
    newState,
    newState.due.getTime(),
    now.getTime(),
    newState.lapses,
  );
  await recordReview(input);
}

export async function completeSession(id: string) {
  await endSession(id);
  revalidatePath("/dashboard");
  redirect(`/session/${id}/summary`);
}
