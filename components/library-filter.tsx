"use client";

import { useRouter, useSearchParams } from "next/navigation";

// Toggle "Toutes" / "Notes seules" via URL search param ?filter=notes.
// Server-rendered pages utilisent ce param pour filtrer la liste.
export default function LibraryFilter() {
  const router = useRouter();
  const params = useSearchParams();
  const current = params.get("filter") === "notes" ? "notes" : "all";

  function setFilter(value: "all" | "notes") {
    const sp = new URLSearchParams(params.toString());
    if (value === "all") sp.delete("filter");
    else sp.set("filter", value);
    const qs = sp.toString();
    router.push(qs ? `?${qs}` : "?");
  }

  return (
    <div className="inline-flex rounded-full border border-zinc-200 bg-white p-0.5 text-xs dark:border-zinc-800 dark:bg-zinc-950">
      <button
        type="button"
        onClick={() => setFilter("all")}
        className={`rounded-full px-3 py-1.5 transition ${
          current === "all"
            ? "bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900"
            : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
        }`}
      >
        Toutes
      </button>
      <button
        type="button"
        onClick={() => setFilter("notes")}
        className={`rounded-full px-3 py-1.5 transition ${
          current === "notes"
            ? "bg-amber-400 text-amber-950 dark:bg-amber-500 dark:text-amber-950"
            : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
        }`}
      >
        📝 Avec notes
      </button>
    </div>
  );
}
