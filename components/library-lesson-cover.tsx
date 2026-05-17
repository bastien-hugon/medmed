import Link from "next/link";
import { topicChip, titleFromCardId } from "@/lib/topics";
import type { LibraryLessonRow } from "@/lib/cards";

// Couverture d'une lesson, façon pochette d'album.
// - Lesson non introduite : version grisée, non cliquable.
// - Lesson avec image/diagram : la photo en couverture.
// - Sinon : couverture générée (gradient + initiale + slug).
export default function LibraryLessonCover({
  lesson,
  topic,
  hasNote,
}: {
  lesson: LibraryLessonRow;
  topic: string;
  hasNote: boolean;
}) {
  const { label: topicLabel, gradient } = topicChip(topic);
  const title = titleFromCardId(lesson.id);

  if (!lesson.introduced) {
    return (
      <div
        className="relative flex aspect-square flex-col justify-between overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-100 p-4 text-zinc-400 opacity-70 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-600"
        title="Pas encore vue en session"
        aria-disabled="true"
      >
        <span aria-hidden className="text-xl">🔒</span>
        <div>
          <p className="text-[10px] font-medium uppercase tracking-wider opacity-70">
            {topicLabel}
          </p>
          <p className="mt-0.5 line-clamp-2 text-sm font-medium leading-tight">{title}</p>
          <p className="mt-1 text-[10px] uppercase tracking-wide opacity-70">Non vue</p>
        </div>
      </div>
    );
  }

  const cover = lesson.media?.find((m) => m.kind === "image" || m.kind === "diagram");
  const href = `/library/${encodeURIComponent(topic)}/${encodeURIComponent(lesson.id)}`;

  if (cover) {
    return (
      <Link
        href={href}
        className="group relative flex aspect-square flex-col justify-end overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition-transform hover:scale-[1.02] active:scale-[0.98] dark:border-zinc-800 dark:bg-zinc-950"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={cover.src}
          alt={cover.alt}
          loading="lazy"
          className="absolute inset-0 h-full w-full bg-white object-cover dark:bg-zinc-50"
        />
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-3 text-white">
          <p className="text-[10px] font-medium uppercase tracking-wider opacity-80">
            {topicLabel}
          </p>
          <p className="mt-0.5 line-clamp-2 text-sm font-semibold leading-tight">{title}</p>
        </div>
        {hasNote && <NoteDot />}
      </Link>
    );
  }

  return (
    <Link
      href={href}
      className={`group relative flex aspect-square flex-col justify-between overflow-hidden rounded-2xl bg-gradient-to-br ${gradient} p-4 text-white shadow-sm transition-transform hover:scale-[1.02] active:scale-[0.98]`}
    >
      <div className="flex items-start justify-between">
        <span className="text-2xl font-bold leading-none opacity-50">
          {topicLabel.charAt(0)}
        </span>
      </div>
      <div>
        <p className="text-[10px] font-medium uppercase tracking-wider opacity-80">
          {topicLabel}
        </p>
        <p className="mt-0.5 line-clamp-3 text-sm font-semibold leading-snug">{title}</p>
      </div>
      {hasNote && <NoteDot />}
    </Link>
  );
}

function NoteDot() {
  return (
    <span
      title="Fiche de notes générée"
      className="absolute right-2 top-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-amber-400 text-[10px] shadow-sm ring-2 ring-white/80"
      aria-hidden
    >
      📝
    </span>
  );
}
