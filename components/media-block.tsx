import type { Media } from "@/lib/schemas";

// Rend un media de carte (image, diagram ou ASCII art) avec légende et attribution.
// Extrait de session-runner.tsx pour réutilisation par le mode lecture (bibliothèque).
export default function MediaBlock({ media }: { media: Media }) {
  if (media.kind === "ascii") {
    return (
      <figure className="overflow-x-auto rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <pre className="whitespace-pre font-mono text-[12px] leading-snug text-zinc-700 dark:text-zinc-200">
          {media.src}
        </pre>
        {(media.caption || media.attribution) && (
          <figcaption className="mt-3 space-y-1 text-xs text-zinc-500 dark:text-zinc-400">
            {media.caption && <p>{media.caption}</p>}
            {media.attribution && (
              <p className="italic opacity-75">{media.attribution}</p>
            )}
          </figcaption>
        )}
      </figure>
    );
  }
  return (
    <figure className="overflow-hidden rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={media.src}
        alt={media.alt}
        className="mx-auto max-h-96 w-full bg-white object-contain p-2 dark:bg-zinc-50"
        loading="lazy"
      />
      {(media.caption || media.attribution) && (
        <figcaption className="space-y-1 border-t border-zinc-100 px-3 py-2 text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
          {media.caption && <p>{media.caption}</p>}
          {media.attribution && (
            <p className="italic opacity-75">{media.attribution}</p>
          )}
        </figcaption>
      )}
    </figure>
  );
}
