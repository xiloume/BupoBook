"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DeleteSeriesButton({ id, title }: { id: string; title: string }) {
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function onDelete() {
    if (!confirm(`Supprimer définitivement « ${title} » et tous ses chapitres ?`)) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/series/${id}`, { method: "DELETE" });
      if (res.ok) router.refresh();
      else alert("Erreur lors de la suppression");
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      onClick={onDelete}
      disabled={busy}
      className="text-red-400 hover:text-red-300 disabled:opacity-50"
    >
      Supprimer
    </button>
  );
}
