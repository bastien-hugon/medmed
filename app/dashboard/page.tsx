import { logout } from "@/actions/auth";
import { startSession } from "@/actions/session";
import { countActive, countDue, countNew } from "@/lib/cards";
import { get7DayStats } from "@/lib/sessions";

export const metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [due, fresh, active, stats] = await Promise.all([
    countDue(),
    countNew(),
    countActive(),
    get7DayStats(),
  ]);

  const hasContent = active > 0;
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
        <form action={startSession} className="mt-6">
          <button
            type="submit"
            disabled={!hasContent}
            className="inline-flex items-center justify-center rounded-xl bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            Commencer (2 min)
          </button>
        </form>
        {!hasContent && (
          <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
            Aucune carte active. Lance <code className="font-mono">npm run db:seed</code>.
          </p>
        )}
      </section>

      <section className="mx-auto grid w-full max-w-3xl grid-cols-3 gap-3">
        <Stat label="Sessions / 7j" value={stats.sessions} />
        <Stat label="Cartes / 7j" value={stats.cards_total} />
        <Stat label="Minutes / 7j" value={minutes} />
      </section>

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
