"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ChapterMetaForm({
  chapterId,
  number,
  title,
}: {
  chapterId: string;
  number: number;
  title: string | null;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  const input =
    "rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm outline-none focus:border-emerald-500";

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setSaved(false);
    const fd = new FormData(e.currentTarget);
    try {
      const res = await fetch(`/api/admin/chapters/${chapterId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ number: fd.get("number"), title: fd.get("title") }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erreur");
        return;
      }
      setSaved(true);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex max-w-xl flex-wrap items-end gap-3">
      <div>
        <label className="mb-1 block text-xs font-medium text-zinc-400">Numéro</label>
        <input
          name="number"
          type="number"
          step="0.1"
          min="0"
          className={input}
          defaultValue={number}
          required
        />
      </div>
      <div className="min-w-48 flex-1">
        <label className="mb-1 block text-xs font-medium text-zinc-400">Titre (optionnel)</label>
        <input name="title" className={input + " w-full"} defaultValue={title ?? ""} />
      </div>
      <button
        type="submit"
        disabled={busy}
        className="rounded-md bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-200 hover:bg-zinc-700 disabled:opacity-50"
      >
        Enregistrer
      </button>
      {saved && <span className="pb-2 text-xs text-emerald-400">Enregistré ✓</span>}
      {error && <p className="w-full text-sm text-red-400">{error}</p>}
    </form>
  );
}
