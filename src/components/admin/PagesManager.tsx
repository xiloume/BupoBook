"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

type PageItem = { id: string; index: number; path: string };

function mediaSrc(path: string) {
  return "/api/media/" + path.split("/").map(encodeURIComponent).join("/");
}

export default function PagesManager({
  chapterId,
  pages,
}: {
  chapterId: string;
  pages: PageItem[];
}) {
  const router = useRouter();
  const fileInput = useRef<HTMLInputElement>(null);
  const [selected, setSelected] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    // Tri par nom de fichier pour un ordre prévisible
    files.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
    setSelected(files);
    setMessage(null);
  }

  // Upload séquentiel : 1 image par requête → progression visible,
  // pas de gros corps multipart qui peut bloquer ou échouer en silence.
  async function upload() {
    if (selected.length === 0) return;
    setBusy(true);
    setMessage(null);
    setProgress({ done: 0, total: selected.length });

    const errors: string[] = [];
    let added = 0;

    try {
      for (let i = 0; i < selected.length; i++) {
        const f = selected[i];
        const fd = new FormData();
        fd.append("pages", f);
        try {
          const res = await fetch(`/api/admin/chapters/${chapterId}/pages`, {
            method: "POST",
            body: fd,
          });
          const data = await res.json().catch(() => ({}));
          if (!res.ok) {
            errors.push(`${f.name} : ${data.error ?? `erreur ${res.status}`}`);
          } else {
            added += data.added ?? 0;
            if (data.errors?.length) errors.push(...data.errors);
          }
        } catch {
          errors.push(`${f.name} : erreur réseau`);
        }
        setProgress({ done: i + 1, total: selected.length });
      }

      setMessage(
        `${added} page(s) ajoutée(s)` +
          (errors.length ? ` — échecs : ${errors.join(" ; ")}` : "")
      );
      setSelected([]);
      if (fileInput.current) fileInput.current.value = "";
      router.refresh();
    } finally {
      setBusy(false);
      setProgress(null);
    }
  }

  async function move(index: number, dir: -1 | 1) {
    const target = index + dir;
    if (target < 0 || target >= pages.length) return;
    const ids = pages.map((p) => p.id);
    [ids[index], ids[target]] = [ids[target], ids[index]];
    setBusy(true);
    try {
      await fetch(`/api/admin/chapters/${chapterId}/pages/order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pageIds: ids }),
      });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("Supprimer cette page ?")) return;
    setBusy(true);
    try {
      await fetch(`/api/admin/pages/${id}`, { method: "DELETE" });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  const btn =
    "rounded border border-zinc-700 px-2 py-1 text-xs text-zinc-300 hover:border-zinc-500 disabled:opacity-40";

  return (
    <section>
      <h3 className="mb-4 text-base font-semibold">Pages ({pages.length})</h3>

      <div className="mb-6 rounded-lg border border-dashed border-zinc-700 bg-zinc-900/50 p-5">
        <label className="mb-2 block text-sm font-medium text-zinc-300">
          Ajouter des images (sélection multiple, triées par nom de fichier)
        </label>
        <input
          ref={fileInput}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
          onChange={onPick}
          className="w-full text-sm text-zinc-400 file:mr-4 file:rounded-md file:border-0 file:bg-zinc-800 file:px-4 file:py-2 file:text-sm file:text-zinc-200 hover:file:bg-zinc-700"
        />
        {selected.length > 0 && (
          <div className="mt-3 flex items-center gap-3">
            <span className="text-sm text-zinc-400">{selected.length} fichier(s) prêt(s)</span>
            <button
              onClick={upload}
              disabled={busy}
              className="rounded-md bg-emerald-500 px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-emerald-400 disabled:opacity-50"
            >
              {busy ? "Upload en cours…" : "Uploader"}
            </button>
          </div>
        )}
        {progress && (
          <div className="mt-3">
            <div className="h-2 w-full overflow-hidden rounded bg-zinc-800">
              <div
                className="h-full bg-emerald-500 transition-all"
                style={{ width: `${(progress.done / progress.total) * 100}%` }}
              />
            </div>
            <p className="mt-1 text-xs text-zinc-400">
              Upload {progress.done} / {progress.total}
            </p>
          </div>
        )}
        {message && (
          <p
            className={`mt-3 text-sm ${
              message.includes("échec") ? "text-amber-400" : "text-emerald-400"
            }`}
          >
            {message}
          </p>
        )}
        <p className="mt-3 text-xs text-zinc-600">
          Formats : jpg, png, webp, gif, avif · 30 Mo max par image.
          Les images sont envoyées une par une avec une barre de progression.
        </p>
      </div>

      {pages.length === 0 ? (
        <p className="text-sm text-zinc-500">Aucune page. Uploade les images du chapitre ci-dessus.</p>
      ) : (
        <ul className="space-y-2">
          {pages.map((p, i) => (
            <li
              key={p.id}
              className="flex items-center gap-4 rounded-lg border border-zinc-800 bg-zinc-900 p-2"
            >
              <span className="w-10 text-center text-sm font-bold text-zinc-400">{i + 1}</span>
              <div className="h-20 w-14 shrink-0 overflow-hidden rounded bg-zinc-800">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={mediaSrc(p.path)}
                  alt={`Page ${i + 1}`}
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="ml-auto flex items-center gap-2">
                <button className={btn} onClick={() => move(i, -1)} disabled={busy || i === 0}>
                  ↑
                </button>
                <button
                  className={btn}
                  onClick={() => move(i, 1)}
                  disabled={busy || i === pages.length - 1}
                >
                  ↓
                </button>
                <button
                  className={btn + " border-red-900 text-red-400 hover:border-red-600"}
                  onClick={() => remove(p.id)}
                  disabled={busy}
                >
                  ✕
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
