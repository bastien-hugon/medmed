import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSession, getSessionStats } from "@/lib/sessions";

export const dynamic = "force-dynamic";

export default async function SessionSummaryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession(id);
  if (!session) notFound();
  // Session encore active → renvoyer dessus pour la terminer proprement.
  if (!session.ended_at) redirect(`/session/${id}`);

  const stats = await getSessionStats(id);
  const accuracy =
    stats.cards_gradeable > 0
      ? Math.round((stats.cards_correct / stats.cards_gradeable) * 100)
      : null;
  const minutes = Math.round(stats.duration_ms / 60000);
  const seconds = Math.round((stats.duration_ms % 60000) / 1000);

  return (
    <main className="flex flex-1 flex-col gap-8 px-6 py-12">
      <header className="mx-auto w-full max-w-2xl space-y-2 text-center">
        <p className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Session terminée
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">Bien joué.</h1>
      </header>

      <section className="mx-auto grid w-full max-w-2xl grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Cartes vues" value={stats.cards_total} />
        <Stat
          label="Précision"
          value={accuracy !== null ? `${accuracy}%` : "—"}
          hint={
            stats.cards_gradeable > 0
              ? `${stats.cards_correct} / ${stats.cards_gradeable}`
              : "aucun quiz"
          }
        />
        <Stat
          label="Durée"
          value={minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`}
        />
        <Stat label="Retests" value={stats.retests} hint="cartes revues" />
      </section>

      <section className="mx-auto w-full max-w-2xl space-y-3">
        <CalibrationCard delta={stats.calibration_delta} />
      </section>

      <footer className="mx-auto w-full max-w-2xl flex flex-col items-center gap-3">
        <Link
          href="/dashboard"
          className="rounded-xl bg-zinc-900 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          Retour au dashboard
        </Link>
      </footer>
    </main>
  );
}

function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: number | string;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        {label}
      </div>
      <div className="mt-1 text-2xl font-semibold tabular-nums">{value}</div>
      {hint && <div className="mt-0.5 text-xs text-zinc-400">{hint}</div>}
    </div>
  );
}

function CalibrationCard({ delta }: { delta: number | null }) {
  if (delta === null) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-white p-5 text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
        <p className="text-xs uppercase tracking-wide text-zinc-500">Calibration</p>
        <p className="mt-1">Pas assez de quiz notés avec une confiance pour calculer un écart.</p>
      </div>
    );
  }

  const abs = Math.abs(delta);
  const label =
    abs < 0.1
      ? "Bien calibré"
      : delta > 0
        ? "Surconfiance"
        : "Sous-confiance";
  const tone =
    abs < 0.1
      ? "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200"
      : delta > 0
        ? "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200"
        : "border-sky-200 bg-sky-50 text-sky-900 dark:border-sky-800 dark:bg-sky-950 dark:text-sky-200";

  const explanation =
    abs < 0.1
      ? "Tu sais ce que tu sais. Confiance et exactitude sont alignées."
      : delta > 0
        ? "Tu te crois plus sûr que tu ne l'es. Pause d'une seconde sur les notes 4/5 avant de répondre."
        : "Tu te sous-estimes : tu réponds juste plus souvent que ta confiance ne le suggère. Tu peux assumer un peu plus.";

  return (
    <div className={`rounded-xl border p-5 ${tone}`}>
      <div className="flex items-baseline justify-between">
        <p className="text-xs uppercase tracking-wide opacity-70">Calibration</p>
        <span className="text-2xl font-semibold tabular-nums">
          {delta > 0 ? "+" : ""}
          {delta.toFixed(2)}
        </span>
      </div>
      <p className="mt-1 text-sm font-medium">{label}</p>
      <p className="mt-2 text-xs leading-5 opacity-90">{explanation}</p>
    </div>
  );
}
