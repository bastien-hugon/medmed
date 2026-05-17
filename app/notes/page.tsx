import Link from "next/link";
import { getAllNotes, type LessonNoteWithCard } from "@/lib/notes";
import { topicLabel } from "@/lib/topics";
import NotesExportButton from "@/components/notes-export-button";
import { Markdown } from "@/components/lesson-notes";

export const dynamic = "force-dynamic";
export const metadata = { title: "Mes fiches de notes" };

export default async function NotesPage() {
  const notes = await getAllNotes();
  const grouped = groupByTopic(notes);

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-6 py-10">
      <header className="flex items-baseline justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Mes fiches
          </p>
          <h1 className="text-2xl font-semibold">Notes générées</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {notes.length} fiche{notes.length > 1 ? "s" : ""} sur {grouped.length} topic
            {grouped.length > 1 ? "s" : ""}.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {notes.length > 0 && <NotesExportButton notes={notes} />}
          <Link
            href="/dashboard"
            className="text-xs text-zinc-500 underline hover:text-zinc-800 dark:hover:text-zinc-200"
          >
            ← Dashboard
          </Link>
        </div>
      </header>

      {notes.length === 0 && (
        <div className="rounded-xl border border-zinc-200 bg-white p-6 text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
          <p>Pas encore de fiche.</p>
          <p className="mt-1">
            Pendant une session, sur une leçon, clique sur <strong>📝 Prendre des notes</strong>{" "}
            pour générer une fiche condensée.
          </p>
        </div>
      )}

      {grouped.map(({ topic, items }) => (
        <section key={topic ?? "?"} className="space-y-3">
          <div className="flex items-baseline gap-2 border-b border-zinc-200 pb-2 dark:border-zinc-800">
            <h2 className="text-lg font-semibold">{topic ? topicLabel(topic) : "?"}</h2>
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              {items.length} fiche{items.length > 1 ? "s" : ""}
            </span>
          </div>
          <div className="space-y-3">
            {items.map((n) => (
              <NoteCard key={n.cardId} note={n} />
            ))}
          </div>
        </section>
      ))}
    </main>
  );
}

function NoteCard({ note }: { note: LessonNoteWithCard }) {
  const firstLine = note.cardPrompt.split("\n").find((l) => l.trim().length > 0) ?? "(sans titre)";
  const title = firstLine.length > 90 ? firstLine.slice(0, 87) + "…" : firstLine;
  return (
    <article className="overflow-hidden rounded-2xl border border-amber-200 bg-amber-50/40 dark:border-amber-800 dark:bg-amber-950/10">
      <header className="border-b border-amber-100 px-4 py-2 dark:border-amber-900">
        <p className="text-sm font-medium text-amber-900 dark:text-amber-100">{title}</p>
        <p className="mt-0.5 font-mono text-[10px] text-amber-700/70 dark:text-amber-300/70">
          {note.cardId}
        </p>
      </header>
      <div className="px-5 py-4 text-[14px] leading-7 text-amber-950 dark:text-amber-50">
        <Markdown text={note.content} />
      </div>
    </article>
  );
}

function groupByTopic(
  notes: LessonNoteWithCard[],
): { topic: string | null; items: LessonNoteWithCard[] }[] {
  const map = new Map<string, LessonNoteWithCard[]>();
  for (const n of notes) {
    const key = n.topic ?? "?";
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(n);
  }
  return Array.from(map.entries()).map(([topic, items]) => ({
    topic: topic === "?" ? null : topic,
    items,
  }));
}
