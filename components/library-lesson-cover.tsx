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

  const cover = lesson.media?.find((m) => m.kind === "image" || m.kind === "diagram");
  const href = `/library/${encodeURIComponent(topic)}/${encodeURIComponent(lesson.id)}`;

  // Lesson non vue en session : mode aperçu cliquable, version atténuée + œil.
  if (!lesson.introduced) {
    if (cover) {
      return (
        <Link
          href={href}
          title="Aperçu — pas encore vue en session"
          className="group relative flex aspect-square flex-col justify-end overflow-hidden rounded-2xl border border-zinc-200 bg-white opacity-65 shadow-sm grayscale transition-[opacity,transform] hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] dark:border-zinc-800 dark:bg-zinc-950"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={cover.src}
            alt={cover.alt}
            loading="lazy"
            className="absolute inset-0 h-full w-full bg-white object-cover dark:bg-zinc-50"
          />
          <span
            aria-hidden
            className="absolute right-2 top-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/90 text-[10px] shadow-sm dark:bg-zinc-900/90"
          >
            👁️
          </span>
          <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/85 via-black/40 to-transparent p-3 text-white">
            <p className="text-[10px] font-medium uppercase tracking-wider opacity-80">
              Aperçu · {topicLabel}
            </p>
            <p className="mt-0.5 line-clamp-2 text-sm font-semibold leading-tight">{title}</p>
          </div>
        </Link>
      );
    }
    return (
      <Link
        href={href}
        title="Aperçu — pas encore vue en session"
        className={`group relative flex aspect-square flex-col justify-between overflow-hidden rounded-2xl bg-linear-to-br ${gradient} p-4 text-white/85 opacity-65 shadow-sm grayscale transition-[opacity,transform] hover:opacity-90 hover:scale-[1.02] active:scale-[0.98]`}
      >
        <div className="flex items-start justify-between">
          <span aria-hidden className="text-lg">👁️</span>
          <span className="text-2xl font-bold leading-none opacity-50">
            {topicLabel.charAt(0)}
          </span>
        </div>
        <div>
          <p className="text-[10px] font-medium uppercase tracking-wider opacity-80">
            Aperçu · {topicLabel}
          </p>
          <p className="mt-0.5 line-clamp-3 text-sm font-semibold leading-snug">{title}</p>
        </div>
      </Link>
    );
  }

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
        <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/85 via-black/40 to-transparent p-3 text-white">
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
      className={`group relative flex aspect-square flex-col justify-between overflow-hidden rounded-2xl bg-linear-to-br ${gradient} p-4 text-white shadow-sm transition-transform hover:scale-[1.02] active:scale-[0.98]`}
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
