"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { startDrill, submitDrillAttempt, getDrillRecap } from "@/actions/drill";
import type { CardRow } from "@/lib/cards";
import type { DrillStreak, DrillTopic, DrillTopicStats } from "@/lib/drill";

type Phase = "select" | "run" | "summary";
type Step = "prompt" | "reveal";

type Verdict = { correct: boolean; feedback: string } | null;

type RunResult = { cardId: string; topic: string; correct: 0 | 1 };

const DRILL_LIMIT = 15;

// Mélange déterministe basé sur l'id de la carte : à chaque ouverture, la même
// carte présente ses choix dans un ordre stable (évite la "mémoire de position")
// mais qui peut différer d'un device/session à l'autre.
function seededShuffle<T>(arr: T[], seed: string): T[] {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  // Random pseudo-déterministe (LCG)
  function rng() {
    h = (h * 1664525 + 1013904223) | 0;
    return ((h >>> 0) % 1000) / 1000;
  }
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const TOPIC_LABELS: Record<string, string> = {
  HTA: "HTA",
  "diabete-t2": "Diabète T2",
  dyslipidemie: "Dyslipidémie",
  lombalgie: "Lombalgie",
  cephalee: "Céphalée",
  depression: "Dépression",
  anxiete: "Anxiété",
  asthenie: "Asthénie",
  ist: "IST",
  contraception: "Contraception",
  "depistage-col": "Dépistage col",
};

export default function DrillRunner({ topics }: { topics: DrillTopic[] }) {
  const [phase, setPhase] = useState<Phase>("select");
  const [drillSessionId, setDrillSessionId] = useState<string | null>(null);
  const [cards, setCards] = useState<CardRow[]>([]);
  const [results, setResults] = useState<RunResult[]>([]);

  if (topics.length === 0) {
    return <NoTopics />;
  }

  if (phase === "select") {
    return (
      <SelectPhase
        topics={topics}
        onStart={(sid, fetched) => {
          setDrillSessionId(sid);
          setCards(fetched);
          setResults([]);
          setPhase("run");
        }}
      />
    );
  }

  if (phase === "run" && drillSessionId) {
    return (
      <RunPhase
        cards={cards}
        drillSessionId={drillSessionId}
        onDone={(rs) => {
          setResults(rs);
          setPhase("summary");
        }}
      />
    );
  }

  return <SummaryPhase results={results} />;
}

function NoTopics() {
  return (
    <div className="mx-auto flex max-w-md flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
      <h2 className="text-xl font-semibold">Rien à drill encore</h2>
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        Le mode entraînement re-pioche dans les cartes que tu as déjà vues en session. Commence par
        une session d&apos;apprentissage classique puis reviens ici.
      </p>
      <Link
        href="/dashboard"
        className="rounded-xl bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white dark:bg-zinc-50 dark:text-zinc-900"
      >
        Retour au dashboard
      </Link>
    </div>
  );
}

function SelectPhase({
  topics,
  onStart,
}: {
  topics: DrillTopic[];
  onStart: (drillSessionId: string, cards: CardRow[]) => void;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set(topics.map((t) => t.topic)));
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function toggle(topic: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(topic)) next.delete(topic);
      else next.add(topic);
      return next;
    });
  }

  function launch() {
    setError(null);
    startTransition(async () => {
      const { drillSessionId, cards } = await startDrill(Array.from(selected), DRILL_LIMIT);
      if (cards.length === 0) {
        setError("Aucune question disponible pour cette sélection.");
        return;
      }
      onStart(drillSessionId, cards);
    });
  }

  const totalAvailable = topics
    .filter((t) => selected.has(t.topic))
    .reduce((s, t) => s + t.drilable, 0);

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-6 py-10">
      <header className="space-y-1">
        <p className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Mode entraînement
        </p>
        <h1 className="text-2xl font-semibold">Quels topics veux-tu drill ?</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          On pioche {DRILL_LIMIT} questions au hasard parmi les concepts que tu as déjà
          abordés (lessons + quizzes vus). Aucun impact sur ton apprentissage (pas de mise
          à jour FSRS).
        </p>
      </header>

      <div className="space-y-2">
        {topics.map((t) => {
          const checked = selected.has(t.topic);
          const label = TOPIC_LABELS[t.topic] ?? t.topic;
          return (
            <label
              key={t.topic}
              className={`flex cursor-pointer items-center justify-between rounded-xl border px-4 py-3 transition ${
                checked
                  ? "border-zinc-900 bg-zinc-50 dark:border-zinc-50 dark:bg-zinc-900"
                  : "border-zinc-200 hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-600"
              }`}
            >
              <span className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggle(t.topic)}
                  className="h-4 w-4 accent-zinc-900 dark:accent-zinc-50"
                />
                <span className="text-sm font-medium">{label}</span>
              </span>
              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                {t.drilable} question{t.drilable > 1 ? "s" : ""} dispo
                {t.drilable < t.total ? (
                  <span className="ml-1 text-zinc-400">
                    sur {t.total}
                  </span>
                ) : null}
              </span>
            </label>
          );
        })}
      </div>

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      <div className="flex items-center justify-between">
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          {selected.size} topic{selected.size > 1 ? "s" : ""} · {totalAvailable} questions
          accessibles
        </p>
        <button
          type="button"
          onClick={launch}
          disabled={pending || selected.size === 0}
          className="rounded-xl bg-zinc-900 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          {pending ? "Préparation…" : `Lancer (${Math.min(totalAvailable, DRILL_LIMIT)} questions)`}
        </button>
      </div>
    </main>
  );
}

function RunPhase({
  cards,
  drillSessionId,
  onDone,
}: {
  cards: CardRow[];
  drillSessionId: string;
  onDone: (results: RunResult[]) => void;
}) {
  const [idx, setIdx] = useState(0);
  const [step, setStep] = useState<Step>("prompt");
  const [userAnswer, setUserAnswer] = useState("");
  const [pickedChoiceId, setPickedChoiceId] = useState<string | null>(null);
  const [pickedMultiIds, setPickedMultiIds] = useState<string[]>([]);
  const [pickedSctValue, setPickedSctValue] = useState<string | null>(null);
  const [verdict, setVerdict] = useState<Verdict>(null);
  const [grading, setGrading] = useState(false);
  const [results, setResults] = useState<RunResult[]>([]);
  const startedAtRef = useRef<number>(0);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    startedAtRef.current = Date.now();
  }, [idx]);

  const card = cards[idx];
  const expectedArr = (Array.isArray(card.expected) ? card.expected : []) as string[];
  const progress = ((idx + (step === "reveal" ? 0.5 : 0)) / cards.length) * 100;

  // Randomisation stable de l'ordre des choices QCM (par carte).
  // Ne pas re-mélanger à chaque render → useMemo sur card.id.
  const shuffledChoices = useMemo(() => {
    if (card.kind !== "qcm-vignette" && card.kind !== "qcm-multi") return null;
    const ch = ((card.extra as { choices?: { id: string; text: string }[] } | null)?.choices ??
      []) as { id: string; text: string }[];
    return seededShuffle(ch, card.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [card.id]);

  function computeCorrect(): 0 | 1 | null {
    if (card.kind === "qcm-vignette")
      return pickedChoiceId && expectedArr.includes(pickedChoiceId) ? 1 : 0;
    if (card.kind === "qcm-multi") {
      // Strict : exactement les bonnes, aucune mauvaise
      const exp = new Set(expectedArr);
      const got = new Set(pickedMultiIds);
      if (exp.size !== got.size) return 0;
      for (const id of exp) if (!got.has(id)) return 0;
      return 1;
    }
    if (card.kind === "sct")
      return pickedSctValue && expectedArr.includes(pickedSctValue) ? 1 : 0;
    if (card.kind === "cloze" || card.kind === "free-recall")
      return verdict ? (verdict.correct ? 1 : 0) : null;
    return null;
  }

  function canReveal() {
    if (card.kind === "qcm-vignette") return pickedChoiceId !== null;
    if (card.kind === "qcm-multi") return pickedMultiIds.length > 0;
    if (card.kind === "sct") return pickedSctValue !== null;
    return userAnswer.trim().length > 0;
  }

  async function onReveal() {
    if ((card.kind === "cloze" || card.kind === "free-recall") && userAnswer.trim()) {
      setGrading(true);
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
        if (res.ok) {
          const data = (await res.json()) as { correct: boolean; feedback: string };
          setVerdict({ correct: !!data.correct, feedback: String(data.feedback ?? "") });
        }
      } finally {
        setGrading(false);
        setStep("reveal");
      }
    } else {
      setStep("reveal");
    }
  }

  function nextOrFinish() {
    const correct = computeCorrect();
    const finalCorrect: 0 | 1 = correct === 1 ? 1 : 0;
    const durationMs = Date.now() - startedAtRef.current;
    const topic = (card.tags.sdd?.[0] as string) ?? "?";
    const newResults = [...results, { cardId: card.id, topic, correct: finalCorrect }];

    startTransition(async () => {
      await submitDrillAttempt({
        drillSessionId,
        cardId: card.id,
        correct: finalCorrect,
        durationMs,
      });

      if (idx + 1 >= cards.length) {
        onDone(newResults);
      } else {
        setResults(newResults);
        setIdx(idx + 1);
        setStep("prompt");
        setUserAnswer("");
        setPickedChoiceId(null);
        setPickedMultiIds([]);
        setPickedSctValue(null);
        setVerdict(null);
      }
    });
  }

  const correctNow = step === "reveal" ? computeCorrect() : null;

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-5 px-6 py-8">
      <header className="space-y-2">
        <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
          <span>
            <span className="font-semibold text-zinc-700 dark:text-zinc-300">Entraînement</span>
            {" — "}Question {idx + 1} / {cards.length}
          </span>
          <span>{TOPIC_LABELS[(card.tags.sdd?.[0] as string) ?? ""] ?? "—"}</span>
        </div>
        <div className="h-1 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-900">
          <div
            className="h-full rounded-full bg-zinc-900 transition-all duration-300 dark:bg-zinc-50"
            style={{ width: `${progress}%` }}
          />
        </div>
      </header>

      <section className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
        <p className="whitespace-pre-wrap text-[15px] leading-7 text-zinc-900 dark:text-zinc-100">
          {card.prompt}
        </p>
        {card.kind === "sct" && card.extra && (
          <div className="mt-4 space-y-1 rounded-lg bg-zinc-50 p-3 text-sm dark:bg-zinc-900">
            {(card.extra as { hypothesis?: string; new_info?: string }).hypothesis && (
              <p>
                <span className="font-semibold text-zinc-500">Hypothèse&nbsp;: </span>
                {(card.extra as { hypothesis?: string }).hypothesis}
              </p>
            )}
            {(card.extra as { hypothesis?: string; new_info?: string }).new_info && (
              <p>
                <span className="font-semibold text-zinc-500">Nouvelle info&nbsp;: </span>
                {(card.extra as { new_info?: string }).new_info}
              </p>
            )}
          </div>
        )}

        <div className="mt-5">
          <AnswerArea
            card={card}
            locked={step === "reveal"}
            userAnswer={userAnswer}
            setUserAnswer={setUserAnswer}
            pickedChoiceId={pickedChoiceId}
            setPickedChoiceId={setPickedChoiceId}
            pickedMultiIds={pickedMultiIds}
            setPickedMultiIds={setPickedMultiIds}
            pickedSctValue={pickedSctValue}
            setPickedSctValue={setPickedSctValue}
            expectedArr={expectedArr}
            shuffledChoices={shuffledChoices}
          />
        </div>

        {step === "reveal" && (
          <RevealBlock
            card={card}
            expectedArr={expectedArr}
            userAnswer={userAnswer}
            verdict={verdict}
            correct={correctNow}
          />
        )}
      </section>

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
        <button
          type="button"
          onClick={nextOrFinish}
          disabled={pending}
          className="mx-auto rounded-xl bg-zinc-900 px-8 py-3 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:opacity-40 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          {idx + 1 >= cards.length ? "Voir le récap" : "Question suivante →"}
        </button>
      )}
    </main>
  );
}

function AnswerArea({
  card,
  locked,
  userAnswer,
  setUserAnswer,
  pickedChoiceId,
  setPickedChoiceId,
  pickedMultiIds,
  setPickedMultiIds,
  pickedSctValue,
  setPickedSctValue,
  expectedArr,
  shuffledChoices,
}: {
  card: CardRow;
  locked: boolean;
  userAnswer: string;
  setUserAnswer: (v: string) => void;
  pickedChoiceId: string | null;
  setPickedChoiceId: (v: string) => void;
  pickedMultiIds: string[];
  setPickedMultiIds: (v: string[]) => void;
  pickedSctValue: string | null;
  setPickedSctValue: (v: string) => void;
  expectedArr: string[];
  shuffledChoices: { id: string; text: string }[] | null;
}) {
  if (card.kind === "qcm-vignette") {
    const choices = shuffledChoices ?? [];
    return (
      <div className="space-y-2">
        {choices.map((c) => {
          const isPicked = pickedChoiceId === c.id;
          const isCorrect = expectedArr.includes(c.id);
          const color = locked
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
              key={c.id}
              type="button"
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
  if (card.kind === "qcm-multi") {
    const choices = shuffledChoices ?? [];
    const picked = new Set(pickedMultiIds);
    const toggle = (id: string) => {
      const next = new Set(picked);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      setPickedMultiIds([...next]);
    };
    return (
      <div className="space-y-2">
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          ☐ Coche toutes les bonnes réponses (plusieurs possibles)
        </p>
        {choices.map((c) => {
          const isPicked = picked.has(c.id);
          const isCorrect = expectedArr.includes(c.id);
          let color: string;
          if (locked) {
            if (isCorrect && isPicked) color = "border-emerald-500 bg-emerald-50 dark:bg-emerald-950";
            else if (isCorrect && !isPicked) color = "border-emerald-300 bg-emerald-50/40 dark:bg-emerald-950/40";
            else if (!isCorrect && isPicked) color = "border-red-500 bg-red-50 dark:bg-red-950";
            else color = "border-zinc-200 dark:border-zinc-800";
          } else {
            color = isPicked
              ? "border-zinc-900 bg-zinc-50 dark:border-zinc-50 dark:bg-zinc-900"
              : "border-zinc-200 hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-600";
          }
          return (
            <button
              key={c.id}
              type="button"
              disabled={locked}
              onClick={() => toggle(c.id)}
              className={`flex w-full items-start gap-3 rounded-lg border px-4 py-3 text-left text-sm transition ${color}`}
            >
              <span
                className={`mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded border-2 ${
                  isPicked
                    ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-50 dark:bg-zinc-50 dark:text-zinc-900"
                    : "border-zinc-300 dark:border-zinc-600"
                }`}
              >
                {isPicked && <span className="text-[10px] leading-none">✓</span>}
              </span>
              <span>{c.text}</span>
            </button>
          );
        })}
      </div>
    );
  }
  if (card.kind === "sct") {
    const opts = [
      { value: "renforce", label: "Renforce", tone: "border-emerald-500" },
      { value: "neutre", label: "Neutre", tone: "border-zinc-400" },
      { value: "affaiblit", label: "Affaiblit", tone: "border-red-500" },
    ];
    return (
      <div className="grid grid-cols-3 gap-2">
        {opts.map((o) => {
          const isPicked = pickedSctValue === o.value;
          const isCorrect = expectedArr.includes(o.value);
          const color = locked
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
              key={o.value}
              type="button"
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
  return (
    <textarea
      value={userAnswer}
      onChange={(e) => setUserAnswer(e.target.value)}
      disabled={locked}
      rows={card.kind === "free-recall" ? 4 : 2}
      placeholder={
        card.kind === "cloze"
          ? "Ta réponse (mot ou chiffre)…"
          : "Écris ce dont tu te souviens…"
      }
      className="w-full rounded-lg border border-zinc-200 bg-white p-3 text-sm outline-none transition focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 disabled:opacity-70 dark:border-zinc-800 dark:bg-zinc-950 dark:focus:border-zinc-50 dark:focus:ring-zinc-50/10"
    />
  );
}

function RevealBlock({
  card,
  expectedArr,
  userAnswer,
  verdict,
  correct,
}: {
  card: CardRow;
  expectedArr: string[];
  userAnswer: string;
  verdict: Verdict;
  correct: 0 | 1 | null;
}) {
  return (
    <div className="mt-6 space-y-4 border-t border-zinc-200 pt-6 dark:border-zinc-800">
      {(card.kind === "cloze" || card.kind === "free-recall") && (
        <>
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
                {verdict.correct ? "✓ Correct" : "✗ À revoir"}
                <span className="font-normal opacity-70"> — Opus 4.6</span>
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
          <div>
            <p className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Réponse attendue
            </p>
            <p className="text-sm font-medium">{expectedArr.join(" · ")}</p>
            {userAnswer && (
              <p className="pt-1 text-xs text-zinc-500">
                Ta réponse&nbsp;: <span className="italic">{userAnswer}</span>
              </p>
            )}
          </div>
        </>
      )}
      {(card.kind === "qcm-vignette" || card.kind === "qcm-multi" || card.kind === "sct") &&
        correct !== null && (
          <p
            className={
              correct === 1
                ? "text-sm font-semibold text-emerald-700 dark:text-emerald-300"
                : "text-sm font-semibold text-red-700 dark:text-red-300"
            }
          >
            {correct === 1 ? "✓ Correct" : "✗ Incorrect"}
            {card.kind === "qcm-multi" && correct === 0 && (
              <span className="ml-2 text-xs font-normal text-zinc-500">
                (note : exact match strict — toutes les bonnes ET aucune mauvaise)
              </span>
            )}
          </p>
        )}
      <div className="rounded-lg bg-zinc-50 p-3 text-sm leading-6 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Pourquoi</p>
        <p>{card.rationale}</p>
      </div>
    </div>
  );
}

function SummaryPhase({ results }: { results: RunResult[] }) {
  const total = results.length;
  const correct = results.filter((r) => r.correct === 1).length;
  const pct = total > 0 ? Math.round((correct / total) * 100) : 0;

  // Aggrégation par topic (cette session)
  const byTopicMap = new Map<string, { attempts: number; correct: number }>();
  for (const r of results) {
    const cur = byTopicMap.get(r.topic) ?? { attempts: 0, correct: 0 };
    cur.attempts++;
    cur.correct += r.correct;
    byTopicMap.set(r.topic, cur);
  }
  const byTopic: DrillTopicStats[] = Array.from(byTopicMap.entries())
    .map(([topic, v]) => {
      const acc = v.correct / v.attempts;
      return {
        topic,
        attempts: v.attempts,
        correct: v.correct,
        accuracy: acc,
        level: (acc >= 0.8 ? "good" : acc >= 0.5 ? "mid" : "weak") as DrillTopicStats["level"],
      };
    })
    .sort((a, b) => a.accuracy - b.accuracy);

  // Recap historique (streak + cumul par topic) — fetch après mount
  const [streak, setStreak] = useState<DrillStreak | null>(null);
  const [history, setHistory] = useState<DrillTopicStats[] | null>(null);

  useEffect(() => {
    (async () => {
      const r = await getDrillRecap();
      setStreak(r.streak);
      setHistory(r.history);
    })().catch(() => {});
  }, []);

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-6 py-10">
      <header className="space-y-1 text-center">
        <p className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Récap entraînement
        </p>
        <h1 className="text-3xl font-semibold">
          {correct} / {total} <span className="text-base font-normal text-zinc-500">({pct} %)</span>
        </h1>
      </header>

      {streak && streak.current > 0 && <StreakBadge streak={streak} />}

      <section className="space-y-2">
        <p className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Cette session — à réviser en priorité (du plus faible au plus solide)
        </p>
        {byTopic.length === 0 && (
          <p className="text-sm text-zinc-500">Aucune donnée — étrange.</p>
        )}
        {byTopic.map((t) => {
          const histo = history?.find((h) => h.topic === t.topic);
          return <TopicRow key={t.topic} stats={t} historical={histo} />;
        })}
      </section>

      {history && history.length > 0 && (
        <section className="space-y-2 border-t border-zinc-200 pt-5 dark:border-zinc-800">
          <p className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Tendance globale (cumul tous les drills)
          </p>
          {history.map((h) => (
            <TopicRow key={h.topic} stats={h} dim />
          ))}
        </section>
      )}

      <footer className="flex justify-center gap-3">
        <Link
          href="/drill"
          className="rounded-xl border border-zinc-200 bg-white px-5 py-2.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-900"
        >
          Re-drill
        </Link>
        <Link
          href="/dashboard"
          className="rounded-xl bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white dark:bg-zinc-50 dark:text-zinc-900"
        >
          Retour au dashboard
        </Link>
      </footer>
    </main>
  );
}

function StreakBadge({ streak }: { streak: DrillStreak }) {
  return (
    <div className="rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 dark:border-orange-800 dark:bg-orange-950/40">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span aria-hidden className="text-2xl">
            🔥
          </span>
          <div>
            <p className="text-sm font-semibold text-orange-900 dark:text-orange-100">
              {streak.current} jour{streak.current > 1 ? "s" : ""} d&apos;affilée
            </p>
            <p className="text-xs text-orange-800/80 dark:text-orange-200/80">
              Record : {streak.longest} · {streak.totalDays} jours au total
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function TopicRow({
  stats,
  historical,
  dim,
}: {
  stats: DrillTopicStats;
  historical?: DrillTopicStats;
  dim?: boolean;
}) {
  const tone =
    stats.level === "good"
      ? "border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/40"
      : stats.level === "mid"
        ? "border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/40"
        : "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/40";
  const icon = stats.level === "good" ? "🟢" : stats.level === "mid" ? "🟡" : "🔴";
  const label =
    stats.level === "good" ? "Bien" : stats.level === "mid" ? "Moyen" : "À revoir en prio";
  const topicL = TOPIC_LABELS[stats.topic] ?? stats.topic;
  const pct = Math.round(stats.accuracy * 100);
  const histoPct = historical ? Math.round(historical.accuracy * 100) : null;
  const delta = histoPct !== null ? pct - histoPct : null;

  return (
    <div
      className={`flex items-center justify-between rounded-xl border px-4 py-3 ${tone} ${
        dim ? "opacity-90" : ""
      }`}
    >
      <div className="flex items-center gap-3">
        <span aria-hidden className="text-lg">
          {icon}
        </span>
        <div>
          <p className="text-sm font-semibold">{topicL}</p>
          <p className="text-xs opacity-75">{label}</p>
        </div>
      </div>
      <div className="text-right text-sm">
        <div>
          <span className="font-semibold tabular-nums">{pct} %</span>
          <span className="ml-2 text-xs opacity-70">
            ({stats.correct} / {stats.attempts})
          </span>
        </div>
        {!dim && delta !== null && Math.abs(delta) >= 5 && (
          <p className="mt-0.5 text-[10px] opacity-70">
            cumul : {histoPct} %
            <span className={delta > 0 ? "ml-1 text-emerald-700" : "ml-1 text-red-700"}>
              ({delta > 0 ? "+" : ""}
              {delta})
            </span>
          </p>
        )}
      </div>
    </div>
  );
}
