import Link from "next/link";
import { topicChip } from "@/lib/topics";

// "Pochette d'album" pour un topic. 2 états :
// - Entamé : gradient plein + compteur + barre de progression
// - Non commencé : version atténuée + icône œil (aperçu cliquable)
export default function LibraryTopicCover({
  topic,
  totalLessons,
  introducedLessons,
}: {
  topic: string;
  totalLessons: number;
  introducedLessons: number;
}) {
  const { label, gradient } = topicChip(topic);
  const preview = introducedLessons === 0;
  const pct = totalLessons > 0 ? Math.round((introducedLessons / totalLessons) * 100) : 0;
  const href = `/library/${encodeURIComponent(topic)}`;

  if (preview) {
    return (
      <Link
        href={href}
        title="Topic non commencé — aperçu"
        className={`group relative flex aspect-square flex-col justify-between overflow-hidden rounded-2xl bg-linear-to-br ${gradient} p-4 text-white/85 opacity-65 shadow-sm grayscale transition-[opacity,transform] hover:opacity-90 hover:scale-[1.02] active:scale-[0.98]`}
      >
        <div className="flex items-start justify-between">
          <span aria-hidden className="text-lg">👁️</span>
          <span className="rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide backdrop-blur-sm">
            0/{totalLessons}
          </span>
        </div>
        <div>
          <p className="text-[10px] font-medium uppercase tracking-wider opacity-80">
            Aperçu
          </p>
          <p className="mt-0.5 text-lg font-semibold leading-tight">{label}</p>
          <p className="mt-1 text-[10px] uppercase tracking-wide opacity-70">
            Non commencé
          </p>
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={href}
      className={`group relative flex aspect-square flex-col justify-between overflow-hidden rounded-2xl bg-linear-to-br ${gradient} p-4 text-white shadow-sm transition-transform hover:scale-[1.02] active:scale-[0.98]`}
    >
      <div className="flex items-start justify-between">
        <span className="rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide backdrop-blur-sm">
          {introducedLessons}/{totalLessons}
        </span>
      </div>
      <div>
        <p className="text-[10px] font-medium uppercase tracking-wider opacity-80">
          Topic
        </p>
        <p className="mt-0.5 text-lg font-semibold leading-tight">{label}</p>
        <div className="mt-2 h-0.5 w-full overflow-hidden rounded-full bg-white/20">
          <div className="h-full bg-white" style={{ width: `${pct}%` }} />
        </div>
      </div>
    </Link>
  );
}
