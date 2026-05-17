"use client";

import { useState, type ReactNode } from "react";

type Props = {
  cardId: string;
  prompt: string;
  rationale: string;
  // Si la fiche existe déjà en DB, le serveur peut la passer ici pour qu'elle
  // s'affiche directement sans clic ni round-trip API.
  initialContent?: string | null;
};

type NoteResponse = {
  content: string;
  model: string;
  cached: boolean;
  generatedAt: number;
};

export default function LessonNotes({ cardId, prompt, rationale, initialContent }: Props) {
  const [content, setContent] = useState<string | null>(initialContent ?? null);
  const [cached, setCached] = useState(Boolean(initialContent));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function fetchNote(regenerate = false) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ cardId, prompt, rationale, regenerate }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as NoteResponse;
      setContent(data.content);
      setCached(data.cached);
    } catch (e) {
      setError(e instanceof Error ? e.message : "erreur");
    } finally {
      setLoading(false);
    }
  }

  if (!content) {
    return (
      <button
        type="button"
        onClick={() => fetchNote(false)}
        disabled={loading}
        className="mt-2 inline-flex items-center gap-2 self-start rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-900 transition hover:border-amber-400 hover:bg-amber-100 disabled:opacity-60 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100 dark:hover:border-amber-600 dark:hover:bg-amber-950"
      >
        <span aria-hidden>📝</span>
        {loading ? "Génération en cours…" : "Prendre des notes"}
        {error && <span className="ml-1 text-xs text-red-700 dark:text-red-300">({error})</span>}
      </button>
    );
  }

  return (
    <section className="mt-2 overflow-hidden rounded-2xl border border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/20">
      <header className="flex items-center justify-between border-b border-amber-100 px-4 py-2 dark:border-amber-900">
        <div className="flex items-center gap-2">
          <span aria-hidden>📝</span>
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-800 dark:text-amber-200">
            Fiche de notes
          </p>
          {cached && (
            <span className="text-[10px] text-amber-700/70 dark:text-amber-300/70">
              (mise en cache)
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={() => fetchNote(true)}
          disabled={loading}
          className="text-xs text-amber-800 underline hover:text-amber-900 disabled:opacity-50 dark:text-amber-200 dark:hover:text-amber-100"
        >
          {loading ? "…" : "Régénérer"}
        </button>
      </header>
      <div className="px-5 py-4 text-[14px] leading-7 text-amber-950 dark:text-amber-50">
        <Markdown text={content} />
      </div>
    </section>
  );
}

// Mini renderer markdown : puces "- " avec indentation 2 espaces, gras **texte**.
export function Markdown({ text }: { text: string }) {
  const lines = text.split("\n").filter((l) => l.trim().length > 0);
  return (
    <ul className="space-y-1.5">
      {lines.map((line, i) => {
        const m = line.match(/^(\s*)- (.+)$/);
        if (m) {
          const indent = m[1].length;
          const isSub = indent >= 2;
          return (
            <li
              key={i}
              className={
                isSub
                  ? "ml-6 list-disc pl-1 text-[13px] opacity-90 marker:text-amber-500"
                  : "ml-4 list-disc pl-1 marker:text-amber-600"
              }
            >
              <Inline text={m[2]} />
            </li>
          );
        }
        // Ligne non-bullet → simple paragraphe
        return (
          <li key={i} className="list-none">
            <Inline text={line} />
          </li>
        );
      })}
    </ul>
  );
}

function Inline({ text }: { text: string }): ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((p, i) => {
        if (p.startsWith("**") && p.endsWith("**")) {
          return (
            <strong key={i} className="font-semibold text-amber-900 dark:text-amber-100">
              {p.slice(2, -2)}
            </strong>
          );
        }
        return <span key={i}>{p}</span>;
      })}
    </>
  );
}
