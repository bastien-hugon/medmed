import Link from "next/link";
import LibraryTopicCover from "@/components/library-topic-cover";
import LibraryFilter from "@/components/library-filter";
import { getLibraryTopics } from "@/lib/cards";
import { getNotesIndex, getAllNotes } from "@/lib/notes";

export const dynamic = "force-dynamic";
export const metadata = { title: "Bibliothèque" };

export default async function LibraryIndexPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const { filter } = await searchParams;
  const notesOnly = filter === "notes";

  if (notesOnly) {
    // En filtre notes : on agrège les notes par topic depuis lesson_notes
    const notes = await getAllNotes();
    const counts = new Map<string, number>();
    for (const n of notes) {
      if (!n.topic) continue;
      counts.set(n.topic, (counts.get(n.topic) ?? 0) + 1);
    }
    const topics = Array.from(counts.entries()).sort();

    return (
      <Page header={<LibraryHeader notesOnly />}>
        {topics.length === 0 ? (
          <EmptyNotes />
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {topics.map(([topic, count]) => (
              <LibraryTopicCover
                key={topic}
                topic={topic}
                totalLessons={count}
                introducedLessons={count}
              />
            ))}
          </div>
        )}
      </Page>
    );
  }

  const [topics, notesIndex] = await Promise.all([getLibraryTopics(), getNotesIndex()]);

  if (topics.length === 0) {
    return (
      <Page header={<LibraryHeader />}>
        <Empty />
      </Page>
    );
  }

  return (
    <Page header={<LibraryHeader notesCount={notesIndex.size} />}>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {topics.map((t) => (
          <LibraryTopicCover
            key={t.topic}
            topic={t.topic}
            totalLessons={t.totalLessons}
            introducedLessons={t.introducedLessons}
          />
        ))}
      </div>
    </Page>
  );
}

function Page({
  header,
  children,
}: {
  header: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-5 px-5 py-6 sm:px-6">
      {header}
      {children}
    </main>
  );
}

function LibraryHeader({
  notesOnly,
  notesCount,
}: {
  notesOnly?: boolean;
  notesCount?: number;
}) {
  return (
    <header className="flex flex-wrap items-baseline justify-between gap-3">
      <div>
        <p className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Bibliothèque
        </p>
        <h1 className="text-2xl font-semibold">
          {notesOnly ? "Mes fiches de notes" : "Mes lessons"}
        </h1>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          {notesOnly
            ? "Topics dont au moins une lesson a une fiche."
            : notesCount && notesCount > 0
              ? `Tu as ${notesCount} fiche${notesCount > 1 ? "s" : ""} de notes.`
              : "Lessons déjà vues en session."}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <LibraryFilter />
        <Link
          href="/dashboard"
          className="text-xs text-zinc-500 underline hover:text-zinc-800 dark:hover:text-zinc-200"
        >
          ← Dashboard
        </Link>
      </div>
    </header>
  );
}

function Empty() {
  return (
    <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-6 text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-400">
      <p>Rien à consulter pour l&apos;instant.</p>
      <p className="mt-1">
        Démarre une session d&apos;apprentissage. Les lessons vues apparaîtront ici.
      </p>
    </div>
  );
}

function EmptyNotes() {
  return (
    <div className="rounded-2xl border border-dashed border-amber-300 bg-amber-50/40 p-6 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950/20 dark:text-amber-100">
      <p>Pas encore de fiche générée.</p>
      <p className="mt-1">
        Pendant une lesson, clique sur <strong>📝 Prendre des notes</strong> pour qu&apos;Opus
        condense la lesson.
      </p>
    </div>
  );
}
