"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Chapter = { id: string; number: number; title: string | null; pageCount: number };

export default function ChaptersPanel({
  seriesId,
  chapters,
}: {
  seriesId: string;
  chapters: Chapter[];
}) {
  const router = useRouter();
  const [number, setNumber] = useState("");
  const [title, setTitle] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const input =
    "rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm outline-none focus:border-emerald-500";

  async function addChapter(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/series/${seriesId}/chapters`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ number, title }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erreur");
        return;
      }
      setNumber("");
      setTitle("");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function deleteChapter(id: string, num: number) {
    if (!confirm(`Supprimer le chapitre ${num} et toutes ses pages ?`)) return;
    const res = await fetch(`/api/admin/chapters/${id}`, { method: "DELETE" });
    if (res.ok) router.refresh();
    else alert("Erreur lors de la suppression");
  }

  return (
    <section>
      <h3 className="mb-4 text-base font-semibold">Chapitres ({chapters.length})</h3>

      <form onSubmit={addChapter} className="mb-6 flex flex-wrap items-end gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-400">Numéro *</label>
          <input
            className={input}
            type="number"
            step="0.1"
            min="0"
            value={number}
            onChange={(e) => setNumber(e.target.value)}
            placeholder="ex : 12"
            required
          />
        </div>
        <div className="min-w-48 flex-1">
          <label className="mb-1 block text-xs font-medium text-zinc-400">Titre (optionnel)</label>
          <input
            className={input + " w-full"}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Titre du chapitre"
          />
        </div>
        <button
          type="submit"
          disabled={busy}
          className="rounded-md bg-emerald-500 px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-emerald-400 disabled:opacity-50"
        >
          + Ajouter
        </button>
      </form>
      {error && <p className="mb-4 text-sm text-red-400">{error}</p>}

      {chapters.length === 0 ? (
        <p className="text-sm text-zinc-500">Aucun chapitre.</p>
      ) : (
        <ul className="divide-y divide-zinc-800 rounded-lg border border-zinc-800">
          {chapters.map((ch) => (
            <li key={ch.id} className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="text-sm font-medium">
                  Chapitre {ch.number}
                  {ch.title && <span className="text-zinc-400"> — {ch.title}</span>}
                </p>
                <p className="text-xs text-zinc-500">
                  {ch.pageCount} page{ch.pageCount > 1 ? "s" : ""}
                </p>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Link
                  href={`/read/${ch.id}`}
                  target="_blank"
                  className="text-zinc-400 hover:text-white"
                >
                  Voir
                </Link>
                <Link
                  href={`/admin/chapters/${ch.id}`}
                  className="text-emerald-400 hover:text-emerald-300"
                >
                  Pages →
                </Link>
                <button
                  onClick={() => deleteChapter(ch.id, ch.number)}
                  className="text-red-400 hover:text-red-300"
                >
                  Supprimer
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
