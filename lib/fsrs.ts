import {
  createEmptyCard,
  fsrs,
  generatorParameters,
  Rating,
  type Card as FSRSCard,
  type Grade,
} from "ts-fsrs";

const params = generatorParameters({ request_retention: 0.88 });
const scheduler = fsrs(params);

export function emptyState(now: Date = new Date()): FSRSCard {
  return createEmptyCard(now);
}

export function schedule(state: FSRSCard, rating: Grade, now: Date = new Date()) {
  return scheduler.next(state, now, rating);
}

export function reviveState(stored: unknown): FSRSCard {
  const s = stored as Record<string, unknown>;
  return {
    ...(s as unknown as FSRSCard),
    due: new Date(s.due as string),
    last_review: s.last_review ? new Date(s.last_review as string) : undefined,
  };
}

export { Rating };
export type { FSRSCard };
