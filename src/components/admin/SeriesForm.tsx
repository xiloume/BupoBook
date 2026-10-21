"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Initial = {
  id: string;
  title: string;
  slug: string;
  author: string | null;
  artist: string | null;
  description: string | null;
  status: string;
  genres: string;
  coverPath: string | null;
};

export default function SeriesForm({ initial }: { initial?: Initial }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const input =
    "w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm outline-none focus:border-emerald-500";
  const label = "mb-1 block text-xs font-medium text-zinc-400";

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const fd = new FormData(e.currentTarget);
      const res = await fetch(
        initial ? `/api/admin/series/${initial.id}` : "/api/admin/series",
        { method: initial ? "PUT" : "POST", body: fd }
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erreur");
        return;
      }
      router.push("/admin/series");
      router.refresh();
    } catch {
      setError("Erreur réseau");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid max-w-2xl grid-cols-1 gap-4 sm:grid-cols-2">
      <div>
        <label className={label}>Titre *</label>
        <input name="title" className={input} defaultValue={initial?.title} required />
      </div>
      <div>
        <label className={label}>Slug (URL, laisser vide = auto)</label>
        <input name="slug" className={input} defaultValue={initial?.slug} />
      </div>
      <div>
        <label className={label}>Auteur</label>
        <input name="author" className={input} defaultValue={initial?.author ?? ""} />
      </div>
      <div>
        <label className={label}>Artiste</label>
        <input name="artist" className={input} defaultValue={initial?.artist ?? ""} />
      </div>
      <div>
        <label className={label}>Statut</label>
        <select name="status" className={input} defaultValue={initial?.status ?? "ONGOING"}>
          <option value="ONGOING">En cours</option>
          <option value="COMPLETED">Terminé</option>
          <option value="HIATUS">En pause</option>
        </select>
      </div>
      <div>
        <label className={label}>Genres (séparés par des virgules)</label>
        <input
          name="genres"
          className={input}
          defaultValue={initial?.genres ?? ""}
          placeholder="Action, Fantasy, Romance"
        />
      </div>
      <div className="sm:col-span-2">
        <label className={label}>Description</label>
        <textarea
          name="description"
          className={input}
          rows={4}
          defaultValue={initial?.description ?? ""}
        />
      </div>
      <div className="sm:col-span-2">
        <label className={label}>
          Couverture {initial?.coverPath && "(laisser vide pour conserver l'actuelle)"}
        </label>
        <input
          name="cover"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
          className="w-full text-sm text-zinc-400 file:mr-4 file:rounded-md file:border-0 file:bg-zinc-800 file:px-4 file:py-2 file:text-sm file:text-zinc-200 hover:file:bg-zinc-700"
        />
        {initial?.coverPath && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`/api/media/${initial.coverPath}`}
            alt="Couverture actuelle"
            className="mt-3 h-40 rounded-md border border-zinc-800 object-cover"
          />
        )}
      </div>
      {error && <p className="text-sm text-red-400 sm:col-span-2">{error}</p>}
      <div className="sm:col-span-2">
        <button
          type="submit"
          disabled={busy}
          className="rounded-md bg-emerald-500 px-6 py-2.5 text-sm font-semibold text-zinc-950 hover:bg-emerald-400 disabled:opacity-50"
        >
          {busy ? "Enregistrement…" : initial ? "Enregistrer" : "Créer la série"}
        </button>
      </div>
    </form>
  );
}
