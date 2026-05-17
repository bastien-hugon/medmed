import Link from "next/link";
import { notFound } from "next/navigation";
import LibraryLessonCover from "@/components/library-lesson-cover";
import LibraryFilter from "@/components/library-filter";
import { getLibraryLessons } from "@/lib/cards";
import { getNotesIndex } from "@/lib/notes";
import { topicChip } from "@/lib/topics";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ topic: string }>;
}) {
  const { topic } = await params;
  return { title: `Bibliothèque — ${topicChip(decodeURIComponent(topic)).label}` };
}

export default async function LibraryTopicPage({
  params,
  searchParams,
}: {
  params: Promise<{ topic: string }>;
  searchParams: Promise<{ filter?: string }>;
}) {
  const { topic: rawTopic } = await params;
  const { filter } = await searchParams;
  const topic = decodeURIComponent(rawTopic);
  const notesOnly = filter === "notes";

  const [lessons, notesIndex] = await Promise.all([
    getLibraryLessons(topic),
    getNotesIndex(),
  ]);

  if (lessons.length === 0) notFound();

  const visible = notesOnly
    ? lessons.filter((l) => l.introduced && notesIndex.has(l.id))
    : lessons;

  const introduced = visible.filter((l) => l.introduced).length;
  const locked = visible.filter((l) => !l.introduced).length;
  const { label, tone } = topicChip(topic);

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-5 px-5 py-6 sm:px-6">
      <header className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <Link
            href="/library"
            className="text-xs text-zinc-500 underline hover:text-zinc-800 dark:hover:text-zinc-200"
          >
            ← Bibliothèque
          </Link>
          <div className="mt-2 flex items-center gap-2">
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${tone}`}
            >
              {label}
            </span>
          </div>
          <h1 className="mt-1 text-2xl font-semibold">{label}</h1>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            {notesOnly ? (
              <>{introduced} fiche{introduced > 1 ? "s" : ""} disponible{introduced > 1 ? "s" : ""}</>
            ) : (
              <>
                {introduced} vue{introduced > 1 ? "s" : ""}
                {locked > 0 && <> · {locked} à découvrir</>}
              </>
            )}
          </p>
        </div>
        <LibraryFilter />
      </header>

      {visible.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-amber-300 bg-amber-50/40 p-6 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950/20 dark:text-amber-100">
          Aucune fiche pour ce topic. Reviens après une session avec prise de notes.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {visible.map((l) => (
            <LibraryLessonCover
              key={l.id}
              lesson={l}
              topic={topic}
              hasNote={notesIndex.has(l.id)}
            />
          ))}
        </div>
      )}
    </main>
  );
}
