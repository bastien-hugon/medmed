"use client";

import { useState } from "react";
import type { LessonNoteWithCard } from "@/lib/notes";
import { topicLabel } from "@/lib/topics";

export default function NotesExportButton({ notes }: { notes: LessonNoteWithCard[] }) {
  const [copied, setCopied] = useState(false);

  async function copyAll() {
    const md = toMarkdown(notes);
    try {
      await navigator.clipboard.writeText(md);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback : download
      const blob = new Blob([md], { type: "text/markdown" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "medmed-notes.md";
      a.click();
      URL.revokeObjectURL(url);
    }
  }

  return (
    <button
      type="button"
      onClick={copyAll}
      className="rounded-lg border border-amber-300 bg-amber-100 px-3 py-1.5 text-xs font-medium text-amber-900 transition hover:bg-amber-200 dark:border-amber-700 dark:bg-amber-950/60 dark:text-amber-100 dark:hover:bg-amber-950"
    >
      {copied ? "✓ Copié" : "Copier tout (markdown)"}
    </button>
  );
}

function toMarkdown(notes: LessonNoteWithCard[]): string {
  const grouped = new Map<string, LessonNoteWithCard[]>();
  for (const n of notes) {
    const key = n.topic ?? "?";
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(n);
  }
  const parts: string[] = ["# medmed — mes fiches\n"];
  for (const [topic, items] of grouped) {
    parts.push(`\n## ${topic === "?" ? "Autres" : topicLabel(topic)}\n`);
    for (const n of items) {
      const firstLine =
        n.cardPrompt.split("\n").find((l) => l.trim().length > 0) ?? "(sans titre)";
      const title = firstLine.length > 100 ? firstLine.slice(0, 97) + "…" : firstLine;
      parts.push(`\n### ${title}\n\n${n.content}\n`);
    }
  }
  return parts.join("");
}
