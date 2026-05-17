// Labels et couleurs partagés pour les topics medmed.
// Source de vérité : la clé est la valeur stockée dans `cards.tags.sdd[0]`.

export type TopicChip = {
  label: string;
  tone: string; // classes Tailwind pour bg/text
};

const TOPIC_CHIPS: Record<string, TopicChip> = {
  HTA: { label: "HTA", tone: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200" },
  "diabete-t2": {
    label: "Diabète T2",
    tone: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200",
  },
  dyslipidemie: {
    label: "Dyslipidémie",
    tone: "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-200",
  },
  lombalgie: {
    label: "Lombalgie",
    tone: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200",
  },
  cephalee: {
    label: "Céphalée",
    tone: "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-200",
  },
  depression: {
    label: "Dépression",
    tone: "bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-200",
  },
  anxiete: {
    label: "Anxiété",
    tone: "bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-200",
  },
  asthenie: {
    label: "Asthénie",
    tone: "bg-zinc-200 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200",
  },
  ist: {
    label: "IST",
    tone: "bg-pink-100 text-pink-800 dark:bg-pink-950 dark:text-pink-200",
  },
  contraception: {
    label: "Contraception",
    tone: "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200",
  },
  "depistage-col": {
    label: "Dépistage col",
    tone: "bg-fuchsia-100 text-fuchsia-800 dark:bg-fuchsia-950 dark:text-fuchsia-200",
  },
};

export function topicChip(topic: string): TopicChip {
  return TOPIC_CHIPS[topic] ?? {
    label: topic,
    tone: "bg-zinc-100 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300",
  };
}

export function topicLabel(topic: string): string {
  return topicChip(topic).label;
}

// Mapping préfixe d'ID → topic key. Utile dans les composants client qui n'ont
// qu'un cardId sous la main (ex: SessionRunner) et ne peuvent pas joindre tags.
export const TOPIC_PREFIXES: { prefix: string; topic: string }[] = [
  { prefix: "hta-", topic: "HTA" },
  { prefix: "diabete-t2-", topic: "diabete-t2" },
  { prefix: "dyslipidemie-", topic: "dyslipidemie" },
  { prefix: "lombalgie-", topic: "lombalgie" },
  { prefix: "cephalee-", topic: "cephalee" },
  { prefix: "depression-", topic: "depression" },
  { prefix: "anxiete-", topic: "anxiete" },
  { prefix: "asthenie-", topic: "asthenie" },
  { prefix: "ist-", topic: "ist" },
  { prefix: "gyneco-prevention-", topic: "contraception" },
];

export function topicFromCardId(cardId: string): string | null {
  // Préfixe le plus long en premier (ex: "gyneco-prevention-" avant "ist-").
  const sorted = [...TOPIC_PREFIXES].sort((a, b) => b.prefix.length - a.prefix.length);
  const hit = sorted.find((t) => cardId.startsWith(t.prefix));
  return hit ? hit.topic : null;
}
