"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  seriesId: string;
  initialFavorited: boolean;
  loggedIn: boolean;
};

export default function FavoriteButton({ seriesId, initialFavorited, loggedIn }: Props) {
  const [favorited, setFavorited] = useState(initialFavorited);
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function toggle() {
    if (!loggedIn) {
      router.push("/login");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seriesId }),
      });
      if (res.ok) {
        const data = await res.json();
        setFavorited(data.favorited);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={busy}
      className={`rounded-md border px-5 py-2.5 text-sm font-semibold transition ${
        favorited
          ? "border-emerald-500 bg-emerald-500/15 text-emerald-400"
          : "border-zinc-700 text-zinc-300 hover:border-zinc-500"
      }`}
    >
      {favorited ? "★ Dans mes favoris" : "☆ Ajouter aux favoris"}
    </button>
  );
}
