import Link from "next/link";
import MediaBlock from "@/components/media-block";
import LessonNotes from "@/components/lesson-notes";
import LessonChat, { type LessonContext } from "@/components/lesson-chat";
import { topicChip, titleFromCardId } from "@/lib/topics";
import type { LibraryLessonRow } from "@/lib/cards";

// Page lecture pleine d'une lesson en mode bibliothèque.
// Read-only : pas de FSRS, pas de rating, pas de submitReview.
// Réutilise LessonNotes (fiche markdown) et LessonChat (Opus contextualisé).
export default function LessonReader({ lesson }: { lesson: LibraryLessonRow }) {
  const topic = (lesson.tags.sdd?.[0] as string) ?? "?";
  const { label: topicLabel, tone, gradient } = topicChip(topic);
  const title = titleFromCardId(lesson.id);

  const chatContext: LessonContext = {
    topic: topicLabel,
    cardId: lesson.id,
    prompt: lesson.prompt,
    rationale: lesson.rationale,
    sourceUrl: lesson.source.url,
    sourceVersion: lesson.source.version,
  };

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-5 py-6 sm:px-6">
      {/* Header sticky : retour + topic + titre */}
      <header className="sticky top-0 -mx-5 sm:-mx-6 z-10 border-b border-zinc-200/60 bg-white/85 px-5 sm:px-6 py-3 backdrop-blur dark:border-zinc-800/60 dark:bg-zinc-950/85">
        <div className="flex items-center gap-3">
          <Link
            href={`/library/${encodeURIComponent(topic)}`}
            className="text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
          >
            ← {topicLabel}
          </Link>
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${tone}`}
          >
            {topicLabel}
          </span>
        </div>
        <h1 className="mt-1 text-xl font-semibold leading-tight">{title}</h1>
      </header>

      {/* Hero illustration (si image/diagram) */}
      {lesson.media?.some((m) => m.kind === "image" || m.kind === "diagram") && (
        <div
          className={`-mx-5 sm:-mx-6 aspect-[16/9] overflow-hidden bg-gradient-to-br ${gradient}`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lesson.media.find((m) => m.kind === "image" || m.kind === "diagram")!.src}
            alt={lesson.media.find((m) => m.kind === "image" || m.kind === "diagram")!.alt}
            className="h-full w-full bg-white object-contain p-2"
          />
        </div>
      )}

      {/* Prompt de la lesson */}
      <article className="space-y-4 text-[15.5px] leading-7 text-zinc-900 dark:text-zinc-100">
        {lesson.prompt.split("\n\n").map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </article>

      {/* Tous les médias (image + ASCII) en bloc */}
      {lesson.media && lesson.media.length > 0 && (
        <div className="space-y-3">
          {lesson.media.map((m, i) => (
            <MediaBlock key={i} media={m} />
          ))}
        </div>
      )}

      {/* Rationale en aparté */}
      {lesson.rationale && lesson.rationale.trim().length > 0 && (
        <aside className="rounded-lg bg-zinc-50 p-4 text-sm leading-6 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Pour aller plus loin
          </p>
          <p>{lesson.rationale}</p>
        </aside>
      )}

      {/* Fiche de notes (bouton génère si absente, affiche le cache sinon) */}
      <LessonNotes
        key={`notes-${lesson.id}`}
        cardId={lesson.id}
        prompt={lesson.prompt}
        rationale={lesson.rationale}
      />

      {/* Chat Opus contextualisé */}
      <LessonChat key={`chat-${lesson.id}`} context={chatContext} />

      {/* Footer : source */}
      <footer className="border-t border-zinc-200 pt-4 text-xs text-zinc-400 dark:border-zinc-800">
        Source&nbsp;:{" "}
        <a
          href={lesson.source.url}
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-zinc-600 dark:hover:text-zinc-200"
        >
          {lesson.source.kind} ({lesson.source.version})
        </a>
      </footer>
    </main>
  );
}
