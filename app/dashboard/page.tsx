import Link from "next/link";
import { logout } from "@/actions/auth";
import { startSession } from "@/actions/session";
import {
  countActive,
  countDue,
  countNew,
  getTopicStates,
  MASTERY_THRESHOLD_PCT,
  type TopicState,
} from "@/lib/cards";
import { get7DayStats } from "@/lib/sessions";
import { getDrillTopics } from "@/lib/drill";
import { topicLabel } from "@/lib/topics";

export const metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [due, fresh, active, stats, drillTopics, topicStates] = await Promise.all([
    countDue(),
    countNew(),
    countActive(),
    get7DayStats(),
    getDrillTopics(),
    getTopicStates(),
  ]);

  const hasContent = active > 0;
  const canDrill = drillTopics.length > 0;
  const drillAvailable = drillTopics.reduce((s, t) => s + t.drilable, 0);
  const introducedTopics = topicStates.filter((t) => t.totalIntroduced > 0);
  const accuracy =
    stats.cards_gradeable > 0
      ? Math.round((stats.cards_correct / stats.cards_gradeable) * 100)
      : null;
  const minutes = Math.round(stats.total_duration_ms / 60000);

  return (
    <main className="flex flex-1 flex-col gap-10 px-6 py-12">
      <header className="mx-auto w-full max-w-3xl space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">medmed</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Médecine générale française — apprentissage perso.
        </p>
      </header>

      <section className="mx-auto w-full max-w-3xl rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex items-baseline justify-between">
          <h2 className="text-base font-medium">Aujourd&apos;hui</h2>
          <span className="text-xs text-zinc-400">{active} cartes dans le deck</span>
        </div>
        <div className="mt-2 flex items-baseline gap-6">
          <div>
            <span className="text-3xl font-semibold tabular-nums">{due}</span>
            <span className="ml-1.5 text-xs text-zinc-500">due</span>
          </div>
          <div>
            <span className="text-3xl font-semibold tabular-nums">{fresh}</span>
            <span className="ml-1.5 text-xs text-zinc-500">nouvelles</span>
          </div>
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <form action={startSession}>
            <button
              type="submit"
              disabled={!hasContent}
              className="inline-flex items-center justify-center rounded-xl bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              Session d&apos;apprentissage
            </button>
          </form>
          {canDrill && (
            <Link
              href="/drill"
              className="inline-flex items-center justify-center rounded-xl border border-zinc-300 bg-white px-5 py-2.5 text-sm font-medium text-zinc-800 transition hover:border-zinc-500 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:border-zinc-500 dark:hover:bg-zinc-900"
            >
              Entraînement <span className="ml-1 text-zinc-400">({drillAvailable} dispo)</span>
            </Link>
          )}
          {canDrill && (
            <Link
              href="/library"
              className="inline-flex items-center justify-center rounded-xl border border-zinc-300 bg-white px-5 py-2.5 text-sm font-medium text-zinc-800 transition hover:border-zinc-500 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:border-zinc-500 dark:hover:bg-zinc-900"
            >
              Bibliothèque
            </Link>
          )}
        </div>
        {!hasContent && (
          <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
            Aucune carte active. Lance <code className="font-mono">npm run db:seed</code>.
          </p>
        )}
        {hasContent && !canDrill && (
          <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
            Entraînement disponible après ta première session d&apos;apprentissage.
          </p>
        )}
      </section>

      <section className="mx-auto grid w-full max-w-3xl grid-cols-3 gap-3">
        <Stat label="Sessions / 7j" value={stats.sessions} />
        <Stat label="Cartes / 7j" value={stats.cards_total} />
        <Stat label="Minutes / 7j" value={minutes} />
      </section>

      {introducedTopics.length > 0 && (
        <section className="mx-auto w-full max-w-3xl space-y-3">
          <div className="flex items-baseline justify-between">
            <h2 className="text-base font-medium">Où j&apos;en suis</h2>
            <Link
              href="/notes"
              className="text-xs text-zinc-500 underline hover:text-zinc-800 dark:hover:text-zinc-200"
            >
              Voir mes fiches →
            </Link>
          </div>
          <div className="space-y-2">
            {introducedTopics.map((t) => (
              <TopicStateRow key={t.topic} state={t} />
            ))}
          </div>
        </section>
      )}

      {accuracy !== null && (
        <section className="mx-auto w-full max-w-3xl text-sm text-zinc-500 dark:text-zinc-400">
          Précision 7 jours&nbsp;: <span className="font-medium text-zinc-700 dark:text-zinc-300">{accuracy}%</span>
          {" "}(sur QCM/SCT)
        </section>
      )}

      <footer className="mx-auto w-full max-w-3xl">
        <form action={logout}>
          <button
            type="submit"
            className="text-xs text-zinc-400 underline hover:text-zinc-600 dark:hover:text-zinc-300"
          >
            Se déconnecter
          </button>
        </form>
      </footer>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        {label}
      </div>
      <div className="mt-1 text-2xl font-semibold tabular-nums">{value}</div>
    </div>
  );
}

function TopicStateRow({ state }: { state: TopicState }) {
  const label = topicLabel(state.topic);
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex items-baseline justify-between">
        <p className="text-sm font-semibold">{label}</p>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          {state.totalMastered}/{state.totalDeck} maîtrisées
        </p>
      </div>
      <div className="mt-3 space-y-2">
        {state.layers.map((l) => (
          <LayerBar key={l.difficulty} layer={l} />
        ))}
      </div>
    </div>
  );
}

function LayerBar({
  layer,
}: {
  layer: TopicState["layers"][number];
}) {
  const layerName = layer.difficulty === 1 ? "C1 (fondations)" : `C${layer.difficulty}`;
  const pct = Math.round(layer.masteryPct);
  const reached = pct >= MASTERY_THRESHOLD_PCT;
  const introPct = layer.deck > 0 ? (layer.introduced / layer.deck) * 100 : 0;
  return (
    <div className={layer.locked ? "opacity-50" : ""}>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="text-zinc-600 dark:text-zinc-300">
          {layerName}
          {layer.locked && (
            <span className="ml-2 inline-flex items-center rounded-full bg-zinc-100 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
              🔒 verrouillée
            </span>
          )}
          {reached && !layer.locked && (
            <span className="ml-2 inline-flex items-center rounded-full bg-emerald-100 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
              ✓ maîtrisée
            </span>
          )}
        </span>
        <span className="font-mono text-zinc-500 dark:text-zinc-400">
          {layer.mastered}/{layer.deck} ({pct}%)
        </span>
      </div>
      <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-900">
        {/* introduced (couche grise foncée) */}
        <div
          className="absolute left-0 top-0 h-full bg-zinc-300 dark:bg-zinc-700"
          style={{ width: `${introPct}%` }}
        />
        {/* mastered (vert si seuil atteint, bleu sinon) */}
        <div
          className={
            reached
              ? "absolute left-0 top-0 h-full bg-emerald-500 dark:bg-emerald-400"
              : "absolute left-0 top-0 h-full bg-sky-500 dark:bg-sky-400"
          }
          style={{ width: `${pct}%` }}
        />
        {/* seuil 80% */}
        <div
          className="absolute top-0 h-full w-px bg-zinc-500/40 dark:bg-zinc-400/40"
          style={{ left: `${MASTERY_THRESHOLD_PCT}%` }}
        />
      </div>
    </div>
  );
}
