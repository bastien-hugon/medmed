"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { completeSession, submitReview } from "@/actions/session";
import type { CardRow } from "@/lib/cards";
import type { Media } from "@/lib/schemas";
import LessonChat, { type LessonContext } from "@/components/lesson-chat";

type Step = "prompt" | "answer" | "reveal";

type Rating = 1 | 2 | 3 | 4;
const ratings: { value: Rating; label: string; hint: string; tone: string }[] = [
  { value: 1, label: "Again", hint: "raté", tone: "bg-red-600 hover:bg-red-700" },
  { value: 2, label: "Hard", hint: "difficile", tone: "bg-orange-500 hover:bg-orange-600" },
  { value: 3, label: "Good", hint: "ok", tone: "bg-emerald-600 hover:bg-emerald-700" },
  { value: 4, label: "Easy", hint: "facile", tone: "bg-sky-600 hover:bg-sky-700" },
];

// Rolling retrieval (BLUEPRINT Partie 1bis) : une carte ratée est ré-insérée
// dans la session courante après quelques cartes, jusqu'à réussite.
// Limites : pas de retest pour les lessons (rating=1 → FSRS la remettra vite),
// distance min 2 cartes plus loin, max 3 retests par carte pour éviter une boucle.
const RETEST_DISTANCE = 3;
const MAX_RETESTS = 3;

// Labels affichables par topic (dérivés du préfixe de l'id de la carte).
// Permet d'afficher un badge clair pendant les sessions interleaved.
const TOPIC_LABELS: { prefix: string; label: string; tone: string }[] = [
  { prefix: "hta-", label: "HTA", tone: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200" },
  { prefix: "diabete-t2-", label: "Diabète T2", tone: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200" },
  { prefix: "dyslipidemie-", label: "Dyslipidémie", tone: "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-200" },
  { prefix: "lombalgie-", label: "Lombalgie", tone: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200" },
  { prefix: "cephalee-", label: "Céphalée", tone: "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-200" },
  { prefix: "depression-", label: "Dépression", tone: "bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-200" },
  { prefix: "anxiete-", label: "Anxiété", tone: "bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-200" },
  { prefix: "asthenie-", label: "Asthénie", tone: "bg-zinc-200 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200" },
  { prefix: "ist-", label: "IST", tone: "bg-pink-100 text-pink-800 dark:bg-pink-950 dark:text-pink-200" },
  { prefix: "gyneco-prevention-", label: "Gynéco", tone: "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200" },
];
function topicFromId(cardId: string): { label: string; tone: string } | null {
  // Match le préfixe le plus long en premier (ex: "gyneco-prevention-" avant "ist-").
  const sorted = [...TOPIC_LABELS].sort((a, b) => b.prefix.length - a.prefix.length);
  const hit = sorted.find((t) => cardId.startsWith(t.prefix));
  return hit ? { label: hit.label, tone: hit.tone } : null;
}

// Extrait l'identifiant de concept d'une carte (ex: "hta-c1-l05-..." → "hta-c1-05").
// Une lesson et ses quiz partagent le même conceptKey.
function conceptKey(cardId: string): string {
  const m = cardId.match(/^(.+?-c\d+)-[lqs](\d+)/);
  return m ? `${m[1]}-${m[2]}` : cardId;
}

// Détecte la transition pédagogique entre 2 cartes successives dans la queue.
// Sert à afficher un bandeau qui aide à organiser les notes :
// - "topic"      : on entre dans un nouveau sujet
// - "concept"    : nouveau concept au sein du même sujet
// - "lesson-end" : la lesson est finie, on passe au quiz du même concept
type Transition =
  | { kind: "topic"; topic: string }
  | { kind: "concept" }
  | { kind: "lesson-end" }
  | null;

function detectTransition(prev: CardRow | null, current: CardRow): Transition {
  if (!prev) return null;
  const prevTopic = topicFromId(prev.id)?.label ?? "?";
  const curTopic = topicFromId(current.id)?.label ?? "?";
  if (prevTopic !== curTopic) return { kind: "topic", topic: curTopic };
  const prevConcept = conceptKey(prev.id);
  const curConcept = conceptKey(current.id);
  if (prevConcept !== curConcept) return { kind: "concept" };
  if (prev.kind === "lesson" && current.kind !== "lesson") return { kind: "lesson-end" };
  return null;
}

type QueueItem = {
  card: CardRow;
  attempt: number;
};

export default function SessionRunner({
  sessionId,
  cards,
}: {
  sessionId: string;
  cards: CardRow[];
}) {
  const router = useRouter();
  const [queue, setQueue] = useState<QueueItem[]>(() =>
    cards.map((c) => ({ card: c, attempt: 0 })),
  );
  const [cursor, setCursor] = useState(0);
  const [step, setStep] = useState<Step>("prompt");
  const [confidence, setConfidence] = useState<number | null>(null);
  const [userAnswer, setUserAnswer] = useState<string>("");
  const [pickedChoiceId, setPickedChoiceId] = useState<string | null>(null);
  const [pickedSctValue, setPickedSctValue] = useState<string | null>(null);
  const [verdict, setVerdict] = useState<{ correct: boolean; feedback: string } | null>(null);
  const [grading, setGrading] = useState(false);
  const [gradeError, setGradeError] = useState<string | null>(null);
  const startedAtRef = useRef<number>(0);
  const [pending, startTransition] = useTransition();
  const [finishing, finishTransition] = useTransition();

  useEffect(() => {
    startedAtRef.current = Date.now();
  }, [cursor]);

  if (cards.length === 0) {
    return (
      <EmptyState onComplete={() => finishTransition(() => completeSession(sessionId))} />
    );
  }

  const item = queue[cursor];
  const card = item.card;
  const isRetest = item.attempt > 0;
  // Pas de bandeau de transition si on est sur un retest : le sujet est déjà connu.
  const previousCard = cursor > 0 && !isRetest ? queue[cursor - 1].card : null;
  const transition = detectTransition(previousCard, card);
  // Progression : sur le nombre de cartes uniques originales (la queue peut grandir
  // avec les retests, mais on veut un repère stable pour l'utilisateur).
  const progress = (Math.min(cursor, cards.length) / cards.length) * 100;

  const expectedArr = (Array.isArray(card.expected) ? card.expected : []) as string[];

  function computeCorrect(): 0 | 1 | null {
    if (card.kind === "qcm-vignette") {
      return pickedChoiceId && expectedArr.includes(pickedChoiceId) ? 1 : 0;
    }
    if (card.kind === "sct") {
      return pickedSctValue && expectedArr.includes(pickedSctValue) ? 1 : 0;
    }
    if (card.kind === "cloze" || card.kind === "free-recall") {
      return verdict ? (verdict.correct ? 1 : 0) : null;
    }
    return null;
  }

  function reset() {
    setStep("prompt");
    setConfidence(null);
    setUserAnswer("");
    setPickedChoiceId(null);
    setPickedSctValue(null);
    setVerdict(null);
    setGradeError(null);
    setGrading(false);
  }

  // Pour cloze + free-recall, on demande à Opus 4.6 de juger la réponse
  // avant d'afficher la correction (laxiste mais pas naïf).
  async function onReveal() {
    if ((card.kind === "cloze" || card.kind === "free-recall") && userAnswer.trim()) {
      setGrading(true);
      setGradeError(null);
      try {
        const res = await fetch("/api/grade", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            kind: card.kind,
            prompt: card.prompt,
            expected: expectedArr,
            userAnswer,
            rationale: card.rationale,
          }),
        });
        if (!res.ok) throw new Error(`Grading ${res.status}`);
        const data = (await res.json()) as { correct: boolean; feedback: string };
        setVerdict({ correct: !!data.correct, feedback: String(data.feedback ?? "") });
      } catch (e) {
        setGradeError(e instanceof Error ? e.message : "erreur de correction");
      } finally {
        setGrading(false);
        setStep("reveal");
      }
    } else {
      setStep("reveal");
    }
  }

  function onGrade(rating: Rating) {
    // eslint-disable-next-line react-hooks/purity
    const durationMs = Date.now() - startedAtRef.current;
    const correct = computeCorrect();
    startTransition(async () => {
      await submitReview({
        sessionId,
        cardId: card.id,
        rating,
        confidence,
        correct,
        durationMs,
      });

      // Rolling retrieval : si carte ratée (non-lesson), la re-insérer
      // RETEST_DISTANCE crans plus loin, dans la limite de MAX_RETESTS.
      const isQuiz = card.kind !== "lesson";
      const failed = rating === 1 || correct === 0;
      const canRetest = isQuiz && failed && item.attempt < MAX_RETESTS;

      let nextQueue = queue;
      if (canRetest) {
        const insertAt = Math.min(cursor + 1 + RETEST_DISTANCE, queue.length);
        nextQueue = [
          ...queue.slice(0, insertAt),
          { card, attempt: item.attempt + 1 },
          ...queue.slice(insertAt),
        ];
        setQueue(nextQueue);
      }

      const nextCursor = cursor + 1;
      if (nextCursor >= nextQueue.length) {
        finishTransition(() => completeSession(sessionId));
      } else {
        setCursor(nextCursor);
        reset();
        router.refresh();
      }
    });
  }

  function canReveal(): boolean {
    if (card.kind === "qcm-vignette") return pickedChoiceId !== null;
    if (card.kind === "sct") return pickedSctValue !== null;
    if (card.kind === "free-recall") return userAnswer.trim().length > 0;
    if (card.kind === "cloze") return userAnswer.trim().length > 0;
    return true;
  }

  return (
    <div className="flex flex-1 flex-col gap-6 px-6 py-8">
      <header className="mx-auto w-full max-w-2xl space-y-3">
        <div className="flex items-center justify-between gap-2 text-xs text-zinc-500 dark:text-zinc-400">
          <span className="flex flex-wrap items-center gap-2">
            {(() => {
              const topic = topicFromId(card.id);
              return topic ? (
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${topic.tone}`}
                >
                  {topic.label}
                </span>
              ) : null;
            })()}
            <span>
              Carte {Math.min(cursor + 1, cards.length)} / {cards.length}
              {queue.length > cards.length && (
                <span className="ml-1 text-zinc-400">(+{queue.length - cards.length} retest{queue.length - cards.length > 1 ? "s" : ""})</span>
              )}
            </span>
            {isRetest && (
              <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                Retest #{item.attempt}
              </span>
            )}
          </span>
          <button
            type="button"
            onClick={() => finishTransition(() => completeSession(sessionId))}
            className="underline hover:text-zinc-800 dark:hover:text-zinc-200"
            disabled={finishing}
          >
            Terminer la session
          </button>
        </div>
        <div className="h-1 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-900">
          <div
            className="h-full rounded-full bg-zinc-900 transition-all duration-300 dark:bg-zinc-50"
            style={{ width: `${progress}%` }}
          />
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6">
        {transition && <TransitionBanner transition={transition} />}
        <CardKindBadge kind={card.kind} />

        {card.kind === "lesson" ? (
          <LessonView
            card={card}
            pending={pending || finishing}
            onAck={() => onGrade(3)}
            onMiss={() => onGrade(1)}
          />
        ) : (
          <>
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
              <Prompt text={card.prompt} />

              {card.kind === "sct" && (
                <SctExtras
                  extra={card.extra as { hypothesis?: string; new_info?: string } | null}
                />
              )}

              {step !== "reveal" && (
                <div className="mt-6">
                  <ConfidencePicker value={confidence} onChange={setConfidence} />
                </div>
              )}

              <div className="mt-6">
                <AnswerArea
                  card={card}
                  step={step}
                  userAnswer={userAnswer}
                  setUserAnswer={setUserAnswer}
                  pickedChoiceId={pickedChoiceId}
                  setPickedChoiceId={setPickedChoiceId}
                  pickedSctValue={pickedSctValue}
                  setPickedSctValue={setPickedSctValue}
                  expectedArr={expectedArr}
                />
              </div>

              {step === "reveal" && (
                <Reveal
                  card={card}
                  userAnswer={userAnswer}
                  pickedChoiceId={pickedChoiceId}
                  pickedSctValue={pickedSctValue}
                  expectedArr={expectedArr}
                  verdict={verdict}
                  gradeError={gradeError}
                />
              )}
            </div>

            {step !== "reveal" ? (
              <button
                type="button"
                onClick={onReveal}
                disabled={!canReveal() || grading}
                className="mx-auto rounded-xl bg-zinc-900 px-8 py-3 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:opacity-40 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                {grading ? "Correction en cours…" : "Voir la correction"}
              </button>
            ) : (
              <div className="space-y-3">
                <p className="text-center text-xs text-zinc-500 dark:text-zinc-400">
                  Comment t&apos;as géré&nbsp;?
                </p>
                <div className="grid grid-cols-4 gap-2">
                  {ratings.map((r) => (
                    <button
                      key={r.value}
                      type="button"
                      disabled={pending || finishing}
                      onClick={() => onGrade(r.value)}
                      className={`flex flex-col items-center gap-0.5 rounded-xl px-3 py-3 text-sm font-medium text-white transition disabled:opacity-50 ${r.tone}`}
                    >
                      <span>{r.label}</span>
                      <span className="text-[10px] font-normal opacity-80">{r.hint}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

function LessonView({
  card,
  pending,
  onAck,
  onMiss,
}: {
  card: CardRow;
  pending: boolean;
  onAck: () => void;
  onMiss: () => void;
}) {
  const topicLabel = topicFromId(card.id)?.label ?? "—";
  const chatContext: LessonContext = {
    topic: topicLabel,
    cardId: card.id,
    prompt: card.prompt,
    rationale: card.rationale,
    sourceUrl: card.source.url,
    sourceVersion: card.source.version,
  };
  return (
    <>
      <article className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="space-y-4 text-[15px] leading-7 text-zinc-900 dark:text-zinc-100">
          {card.prompt.split("\n\n").map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
        {card.media && card.media.length > 0 && (
          <div className="mt-5 space-y-4">
            {card.media.map((m, i) => (
              <MediaBlock key={i} media={m} />
            ))}
          </div>
        )}
        {card.rationale && card.rationale.trim().length > 0 && (
          <div className="mt-5 rounded-lg bg-zinc-50 p-4 text-sm leading-6 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Pour aller plus loin
            </p>
            <p>{card.rationale}</p>
          </div>
        )}
        <div className="mt-5 text-xs text-zinc-400">
          Source&nbsp;:{" "}
          <a
            href={card.source.url}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-zinc-600 dark:hover:text-zinc-200"
          >
            {card.source.kind} ({card.source.version})
          </a>
        </div>
      </article>

      <LessonChat key={card.id} context={chatContext} />

      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          disabled={pending}
          onClick={onMiss}
          className="rounded-xl border border-zinc-200 bg-white px-5 py-3 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-900"
        >
          À revoir bientôt
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={onAck}
          className="rounded-xl bg-zinc-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          Compris !
        </button>
      </div>
    </>
  );
}

function TransitionBanner({ transition }: { transition: NonNullable<Transition> }) {
  if (transition.kind === "topic") {
    return (
      <div className="rounded-xl border-2 border-dashed border-indigo-300 bg-indigo-50 px-5 py-3 dark:border-indigo-700 dark:bg-indigo-950/40">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-indigo-700 dark:text-indigo-300">
          Nouveau sujet
        </p>
        <p className="mt-0.5 text-sm font-medium text-indigo-900 dark:text-indigo-100">
          → {transition.topic}
        </p>
        <p className="mt-1 text-xs text-indigo-700/80 dark:text-indigo-300/80">
          Bon moment pour changer de page si tu prends des notes.
        </p>
      </div>
    );
  }
  if (transition.kind === "concept") {
    return (
      <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-5 py-2.5 dark:border-zinc-800 dark:bg-zinc-900">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-600 dark:text-zinc-400">
          Nouveau concept
        </p>
      </div>
    );
  }
  // lesson-end
  return (
    <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-2.5 dark:border-emerald-800 dark:bg-emerald-950/40">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
        Leçon terminée → place au quiz
      </p>
      <p className="mt-0.5 text-xs text-emerald-700/80 dark:text-emerald-300/80">
        Tu peux finaliser ta note avant de répondre.
      </p>
    </div>
  );
}

function MediaBlock({ media }: { media: Media }) {
  if (media.kind === "ascii") {
    return (
      <figure className="overflow-x-auto rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <pre className="whitespace-pre font-mono text-[12px] leading-snug text-zinc-700 dark:text-zinc-200">
          {media.src}
        </pre>
        {(media.caption || media.attribution) && (
          <figcaption className="mt-3 space-y-1 text-xs text-zinc-500 dark:text-zinc-400">
            {media.caption && <p>{media.caption}</p>}
            {media.attribution && (
              <p className="italic opacity-75">{media.attribution}</p>
            )}
          </figcaption>
        )}
      </figure>
    );
  }
  // image or diagram
  return (
    <figure className="overflow-hidden rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={media.src}
        alt={media.alt}
        className="mx-auto max-h-96 w-full bg-white object-contain p-2 dark:bg-zinc-50"
        loading="lazy"
      />
      {(media.caption || media.attribution) && (
        <figcaption className="space-y-1 border-t border-zinc-100 px-3 py-2 text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
          {media.caption && <p>{media.caption}</p>}
          {media.attribution && (
            <p className="italic opacity-75">{media.attribution}</p>
          )}
        </figcaption>
      )}
    </figure>
  );
}

function EmptyState({ onComplete }: { onComplete: () => void }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
      <h2 className="text-2xl font-semibold">Aucune carte due</h2>
      <p className="max-w-sm text-sm text-zinc-500 dark:text-zinc-400">
        Reviens plus tard, ou rajoute des cartes au deck via le seed.
      </p>
      <button
        onClick={onComplete}
        className="rounded-xl bg-zinc-900 px-6 py-2.5 text-sm font-medium text-white dark:bg-zinc-50 dark:text-zinc-900"
      >
        Retour au dashboard
      </button>
    </div>
  );
}

function CardKindBadge({ kind }: { kind: CardRow["kind"] }) {
  const labels: Record<CardRow["kind"], string> = {
    lesson: "Leçon",
    cloze: "Texte à trous",
    "qcm-vignette": "QCM",
    "free-recall": "Rappel libre",
    sct: "Raisonnement clinique",
  };
  const tones: Record<CardRow["kind"], string> = {
    lesson: "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-800 dark:bg-sky-950 dark:text-sky-300",
    cloze: "border-zinc-200 text-zinc-500 dark:border-zinc-800 dark:text-zinc-400",
    "qcm-vignette": "border-zinc-200 text-zinc-500 dark:border-zinc-800 dark:text-zinc-400",
    "free-recall": "border-zinc-200 text-zinc-500 dark:border-zinc-800 dark:text-zinc-400",
    sct: "border-zinc-200 text-zinc-500 dark:border-zinc-800 dark:text-zinc-400",
  };
  return (
    <div className="mx-auto">
      <span
        className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wide ${tones[kind]}`}
      >
        {labels[kind]}
      </span>
    </div>
  );
}

function Prompt({ text }: { text: string }) {
  return (
    <div className="space-y-3 text-base leading-7 text-zinc-900 dark:text-zinc-100">
      {text.split("\n\n").map((p, i) => (
        <p key={i}>{p}</p>
      ))}
    </div>
  );
}

function SctExtras({ extra }: { extra: { hypothesis?: string; new_info?: string } | null }) {
  if (!extra) return null;
  return (
    <div className="mt-4 space-y-3 rounded-lg bg-zinc-50 p-4 text-sm dark:bg-zinc-900">
      {extra.hypothesis && (
        <p>
          <span className="font-semibold text-zinc-500 dark:text-zinc-400">Hypothèse&nbsp;: </span>
          <span>{extra.hypothesis}</span>
        </p>
      )}
      {extra.new_info && (
        <p>
          <span className="font-semibold text-zinc-500 dark:text-zinc-400">
            Nouvelle info&nbsp;:{" "}
          </span>
          <span>{extra.new_info}</span>
        </p>
      )}
    </div>
  );
}

function ConfidencePicker({
  value,
  onChange,
}: {
  value: number | null;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-2">
      <p className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        Confiance avant de répondre
      </p>
      <div className="flex gap-1.5">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={`h-8 w-8 rounded-md border text-xs font-medium transition ${
              value === n
                ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-50 dark:bg-zinc-50 dark:text-zinc-900"
                : "border-zinc-200 text-zinc-600 hover:border-zinc-400 dark:border-zinc-800 dark:text-zinc-400 dark:hover:border-zinc-600"
            }`}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}

function AnswerArea({
  card,
  step,
  userAnswer,
  setUserAnswer,
  pickedChoiceId,
  setPickedChoiceId,
  pickedSctValue,
  setPickedSctValue,
  expectedArr,
}: {
  card: CardRow;
  step: Step;
  userAnswer: string;
  setUserAnswer: (v: string) => void;
  pickedChoiceId: string | null;
  setPickedChoiceId: (v: string) => void;
  pickedSctValue: string | null;
  setPickedSctValue: (v: string) => void;
  expectedArr: string[];
}) {
  const locked = step === "reveal";

  if (card.kind === "qcm-vignette") {
    const choices =
      ((card.extra as { choices?: { id: string; text: string }[] } | null)?.choices ?? []) as {
        id: string;
        text: string;
      }[];
    return (
      <div className="space-y-2">
        {choices.map((c) => {
          const isPicked = pickedChoiceId === c.id;
          const isCorrect = expectedArr.includes(c.id);
          const showColor = locked;
          const color = showColor
            ? isCorrect
              ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950"
              : isPicked
                ? "border-red-500 bg-red-50 dark:bg-red-950"
                : "border-zinc-200 dark:border-zinc-800"
            : isPicked
              ? "border-zinc-900 bg-zinc-50 dark:border-zinc-50 dark:bg-zinc-900"
              : "border-zinc-200 hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-600";
          return (
            <button
              type="button"
              key={c.id}
              disabled={locked}
              onClick={() => setPickedChoiceId(c.id)}
              className={`flex w-full items-start gap-3 rounded-lg border px-4 py-3 text-left text-sm transition ${color}`}
            >
              <span className="font-mono text-xs text-zinc-400">{c.id.toUpperCase()}</span>
              <span>{c.text}</span>
            </button>
          );
        })}
      </div>
    );
  }

  if (card.kind === "sct") {
    const options: { value: string; label: string; tone: string }[] = [
      { value: "renforce", label: "Renforce", tone: "border-emerald-500" },
      { value: "neutre", label: "Neutre", tone: "border-zinc-400" },
      { value: "affaiblit", label: "Affaiblit", tone: "border-red-500" },
    ];
    return (
      <div className="grid grid-cols-3 gap-2">
        {options.map((o) => {
          const isPicked = pickedSctValue === o.value;
          const isCorrect = expectedArr.includes(o.value);
          const showColor = locked;
          const color = showColor
            ? isCorrect
              ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950"
              : isPicked
                ? "border-red-500 bg-red-50 dark:bg-red-950"
                : "border-zinc-200 dark:border-zinc-800"
            : isPicked
              ? "border-zinc-900 bg-zinc-50 dark:border-zinc-50 dark:bg-zinc-900"
              : `${o.tone} hover:bg-zinc-50 dark:hover:bg-zinc-900`;
          return (
            <button
              type="button"
              key={o.value}
              disabled={locked}
              onClick={() => setPickedSctValue(o.value)}
              className={`rounded-lg border-2 px-3 py-3 text-sm font-medium transition ${color}`}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    );
  }

  // cloze + free-recall: free text
  return (
    <textarea
      value={userAnswer}
      onChange={(e) => setUserAnswer(e.target.value)}
      disabled={locked}
      placeholder={
        card.kind === "cloze"
          ? "Ta réponse (mot ou chiffre)…"
          : "Écris ce dont tu te souviens, même en vrac…"
      }
      rows={card.kind === "free-recall" ? 4 : 2}
      className="w-full rounded-lg border border-zinc-200 bg-white p-3 text-sm outline-none transition focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 disabled:opacity-70 dark:border-zinc-800 dark:bg-zinc-950 dark:focus:border-zinc-50 dark:focus:ring-zinc-50/10"
    />
  );
}

function Reveal({
  card,
  userAnswer,
  pickedChoiceId,
  pickedSctValue,
  expectedArr,
  verdict,
  gradeError,
}: {
  card: CardRow;
  userAnswer: string;
  pickedChoiceId: string | null;
  pickedSctValue: string | null;
  expectedArr: string[];
  verdict: { correct: boolean; feedback: string } | null;
  gradeError: string | null;
}) {
  return (
    <div className="mt-6 space-y-4 border-t border-zinc-200 pt-6 dark:border-zinc-800">
      {(card.kind === "cloze" || card.kind === "free-recall") && (
        <div className="space-y-3">
          {verdict && (
            <div
              className={
                verdict.correct
                  ? "rounded-lg border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-800 dark:bg-emerald-950/40"
                  : "rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-950/40"
              }
            >
              <p
                className={
                  verdict.correct
                    ? "text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300"
                    : "text-xs font-semibold uppercase tracking-wide text-red-700 dark:text-red-300"
                }
              >
                {verdict.correct ? "✓ Correct" : "✗ À revoir"}{" "}
                <span className="font-normal opacity-70">— jugé par Opus 4.6</span>
              </p>
              <p
                className={
                  verdict.correct
                    ? "mt-1 text-sm leading-6 text-emerald-900 dark:text-emerald-100"
                    : "mt-1 text-sm leading-6 text-red-900 dark:text-red-100"
                }
              >
                {verdict.feedback}
              </p>
            </div>
          )}
          {gradeError && !verdict && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100">
              <p className="font-medium">Correction LLM indisponible</p>
              <p className="mt-0.5 text-xs opacity-90">
                {gradeError}. Évalue toi-même via les boutons de rating ci-dessous.
              </p>
            </div>
          )}
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Réponse attendue
            </p>
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
              {expectedArr.join(" · ")}
            </p>
            {userAnswer && (
              <p className="pt-2 text-xs text-zinc-500 dark:text-zinc-400">
                Ta réponse&nbsp;: <span className="italic">{userAnswer}</span>
              </p>
            )}
          </div>
        </div>
      )}

      <div className="space-y-2 rounded-lg bg-zinc-50 p-4 text-sm leading-6 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Pourquoi</p>
        <p>{card.rationale}</p>
      </div>

      <div className="text-xs text-zinc-400">
        Source&nbsp;:{" "}
        <a
          href={card.source.url}
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-zinc-600 dark:hover:text-zinc-200"
        >
          {card.source.kind} ({card.source.version})
        </a>
      </div>

      {/* Suppress unused warnings for consumed display props */}
      <span className="hidden">{pickedChoiceId}{pickedSctValue}</span>
    </div>
  );
}
