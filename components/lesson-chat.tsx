"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";

export type LessonContext = {
  topic: string;
  cardId: string;
  prompt: string;
  rationale: string;
  sourceUrl: string;
  sourceVersion: string;
};

export default function LessonChat({ context }: { context: LessonContext }) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");

  // Le transport est instancié une fois par carte. Si la carte change, on
  // recrée le transport (et la conversation est reset implicitement par le
  // remount via `key` au niveau parent — voir LessonView).
  const transport = useMemo(
    () =>
      new DefaultChatTransport<UIMessage>({
        api: "/api/chat",
        prepareSendMessagesRequest: ({ messages }) => ({
          body: { messages, context },
        }),
      }),
    [context],
  );

  const { messages, sendMessage, status, error, clearError, stop } = useChat({
    transport,
  });

  const busy = status === "streaming" || status === "submitted";

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || busy) return;
    sendMessage({ text: trimmed });
    setInput("");
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-2 inline-flex items-center gap-2 self-start rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition hover:border-zinc-400 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:border-zinc-600 dark:hover:bg-zinc-900"
      >
        <span aria-hidden>💬</span>
        Discuter avec Claude sur cette leçon
      </button>
    );
  }

  return (
    <section className="mt-2 overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <header className="flex items-center justify-between border-b border-zinc-100 px-4 py-2.5 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-violet-800 dark:bg-violet-950 dark:text-violet-200">
            Claude · Haiku
          </span>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Tuteur contextualisé sur la leçon
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-xs text-zinc-500 underline hover:text-zinc-800 dark:hover:text-zinc-200"
        >
          Fermer
        </button>
      </header>

      <div className="max-h-80 space-y-3 overflow-y-auto px-4 py-3">
        {messages.length === 0 && (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Pose une question — Claude répondra en se basant sur le contenu de la leçon affichée au-dessus.
          </p>
        )}

        {messages.map((m) => (
          <div
            key={m.id}
            className={
              m.role === "user"
                ? "ml-6 rounded-xl bg-zinc-100 px-3 py-2 text-sm leading-6 text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100"
                : "mr-6 rounded-xl bg-violet-50 px-3 py-2 text-sm leading-6 text-violet-950 dark:bg-violet-950/40 dark:text-violet-100"
            }
          >
            <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide opacity-60">
              {m.role === "user" ? "Toi" : "Claude"}
            </div>
            {m.parts.map((p, i) =>
              p.type === "text" ? (
                <p key={i} className="whitespace-pre-wrap">
                  {p.text}
                </p>
              ) : null,
            )}
          </div>
        ))}

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
            <p className="font-medium">Erreur</p>
            <p className="mt-0.5 text-xs opacity-90">{error.message}</p>
            <button
              type="button"
              onClick={clearError}
              className="mt-1 text-xs underline hover:opacity-80"
            >
              Réessayer
            </button>
          </div>
        )}
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex items-end gap-2 border-t border-zinc-100 px-4 py-2.5 dark:border-zinc-800"
      >
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e as unknown as FormEvent);
            }
          }}
          rows={1}
          placeholder="Une question sur la leçon ? (Entrée pour envoyer, Shift+Entrée pour aller à la ligne)"
          className="flex-1 resize-none rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 dark:border-zinc-800 dark:bg-zinc-950 dark:focus:border-zinc-50 dark:focus:ring-zinc-50/10"
        />
        {busy ? (
          <button
            type="button"
            onClick={stop}
            className="rounded-lg bg-zinc-200 px-3 py-2 text-sm font-medium text-zinc-800 transition hover:bg-zinc-300 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
          >
            Stop
          </button>
        ) : (
          <button
            type="submit"
            disabled={!input.trim()}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            Envoyer
          </button>
        )}
      </form>
    </section>
  );
}
