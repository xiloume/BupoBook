"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  chapterId: string;
  average: number;
  count: number;
  userRating: number | null;
  loggedIn: boolean;
};

export default function RatingStars({ chapterId, average, count, userRating, loggedIn }: Props) {
  const router = useRouter();
  const [my, setMy] = useState<number | null>(userRating);
  const [avg, setAvg] = useState(average);
  const [n, setN] = useState(count);
  const [hover, setHover] = useState(0);
  const [busy, setBusy] = useState(false);

  async function send(method: "POST" | "DELETE", value?: number) {
    if (!loggedIn) {
      router.push("/login");
      return;
    }
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch("/api/ratings", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(value !== undefined ? { chapterId, value } : { chapterId }),
      });
      const data = await res.json().catch(() => null);
      if (res.ok && data) {
        setMy(data.userRating);
        setAvg(data.average);
        setN(data.count);
      }
    } finally {
      setBusy(false);
    }
  }

  const shown = hover || my || Math.round(avg);

  return (
    <div className="inline-flex flex-col items-center gap-1">
      <div className="flex" onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((v) => (
          <button
            key={v}
            onClick={() => send("POST", v)}
            onMouseEnter={() => setHover(v)}
            disabled={busy}
            aria-label={`Noter ${v}/5`}
            className={`px-0.5 text-2xl transition ${
              v <= shown ? "text-amber-400" : "text-zinc-700"
            } ${loggedIn ? "hover:scale-125 cursor-pointer" : "cursor-default"}`}
          >
            ★
          </button>
        ))}
      </div>
      <p className="text-xs text-zinc-400">
        {n > 0 ? `${avg.toFixed(1)} / 5 · ${n} vote${n > 1 ? "s" : ""}` : "Pas encore noté"}
        {my !== null && (
          <>
            {" · "}
            ta note : {my}/5{" "}
            <button
              onClick={() => send("DELETE")}
              disabled={busy}
              className="text-zinc-500 underline hover:text-zinc-300"
            >
              retirer
            </button>
          </>
        )}
        {!loggedIn && " · connecte-toi pour voter"}
      </p>
    </div>
  );
}
