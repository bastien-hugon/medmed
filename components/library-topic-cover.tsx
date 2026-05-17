import Link from "next/link";
import { topicChip } from "@/lib/topics";

// "Pochette d'album" pour un topic : gradient + label + compteur cartes vues.
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
  const pct = totalLessons > 0 ? Math.round((introducedLessons / totalLessons) * 100) : 0;
  return (
    <Link
      href={`/library/${encodeURIComponent(topic)}`}
      className={`group relative flex aspect-square flex-col justify-between overflow-hidden rounded-2xl bg-gradient-to-br ${gradient} p-4 text-white shadow-sm transition-transform hover:scale-[1.02] active:scale-[0.98]`}
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
          <div
            className="h-full bg-white"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </Link>
  );
}
