"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import RatingStars from "./RatingStars";

type PageImg = { index: number; path: string };

type Props = {
  chapterId: string;
  seriesSlug: string;
  seriesTitle: string;
  chapterNumber: number;
  chapterTitle: string | null;
  pages: PageImg[];
  prevChapterId: string | null;
  prevChapterNumber: number | null;
  nextChapterId: string | null;
  nextChapterNumber: number | null;
  initialPage: number;
  loggedIn: boolean;
  ratingAverage: number;
  ratingCount: number;
  userRating: number | null;
};

function mediaSrc(path: string) {
  return "/api/media/" + path.split("/").map(encodeURIComponent).join("/");
}

export default function ReaderClient({
  chapterId,
  seriesSlug,
  seriesTitle,
  chapterNumber,
  chapterTitle,
  pages,
  prevChapterId,
  prevChapterNumber,
  nextChapterId,
  nextChapterNumber,
  initialPage,
  loggedIn,
  ratingAverage,
  ratingCount,
  userRating,
}: Props) {
  const [currentPage, setCurrentPage] = useState(initialPage);
  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);
  const visibleRef = useRef<Set<number>>(new Set());
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const completedRef = useRef(false);
  const resumedRef = useRef(false);

  const lastIndex = pages.length - 1;

  const sendProgress = useCallback(
    (pageIndex: number, completed: boolean) => {
      if (!loggedIn) return;
      fetch("/api/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chapterId, pageIndex, completed }),
      }).catch(() => {});
    },
    [chapterId, loggedIn]
  );

  // Reprendre à la dernière page lue
  useEffect(() => {
    if (!resumedRef.current && initialPage > 0 && pageRefs.current[initialPage]) {
      resumedRef.current = true;
      pageRefs.current[initialPage]?.scrollIntoView({ block: "start" });
    }
  }, [initialPage]);

  // Observer les pages visibles pour suivre la progression
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const idx = Number((entry.target as HTMLElement).dataset.index);
          if (entry.isIntersecting) visibleRef.current.add(idx);
          else visibleRef.current.delete(idx);
        }
        if (visibleRef.current.size === 0) return;
        const current = Math.max(...visibleRef.current);
        setCurrentPage(current);

        const completed = current >= lastIndex;
        if (completed && !completedRef.current) {
          completedRef.current = true;
          sendProgress(current, true);
          return;
        }
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(
          () => sendProgress(current, completed),
          1500
        );
      },
      { threshold: 0.5 }
    );

    pageRefs.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, [lastIndex, sendProgress, pages.length]);

  const navBtn =
    "rounded-md border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-200 hover:border-zinc-500 disabled:opacity-30";

  return (
    <div>
      {/* Barre de progression */}
      <div className="fixed inset-x-0 top-14 z-30 h-0.5 bg-zinc-800">
        <div
          className="h-full bg-emerald-500 transition-all"
          style={{ width: `${pages.length ? ((currentPage + 1) / pages.length) * 100 : 0}%` }}
        />
      </div>

      {/* En-tête lecteur */}
      <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-2 px-4 py-3">
        <Link href={`/series/${seriesSlug}`} className="text-sm text-zinc-400 hover:text-white">
          ← {seriesTitle}
        </Link>
        <p className="text-sm font-semibold">
          Chapitre {chapterNumber}
          {chapterTitle ? ` — ${chapterTitle}` : ""}
          <span className="ml-3 text-xs font-normal text-zinc-500">
            {currentPage + 1} / {pages.length}
          </span>
        </p>
        <div className="flex gap-2">
          {prevChapterId ? (
            <Link href={`/read/${prevChapterId}`} className={navBtn}>
              ← Ch. {prevChapterNumber}
            </Link>
          ) : (
            <button className={navBtn} disabled>
              ← Préc.
            </button>
          )}
          {nextChapterId ? (
            <Link href={`/read/${nextChapterId}`} className={navBtn}>
              Ch. {nextChapterNumber} →
            </Link>
          ) : (
            <button className={navBtn} disabled>
              Suiv. →
            </button>
          )}
        </div>
      </div>

      {/* Pages en défilement vertical */}
      <div className="mx-auto max-w-3xl bg-black">
        {pages.length === 0 ? (
          <p className="py-20 text-center text-zinc-500">
            Ce chapitre ne contient aucune page.
          </p>
        ) : (
          pages.map((p, i) => (
            <div
              key={p.index}
              data-index={i}
              ref={(el) => {
                pageRefs.current[i] = el;
              }}
              className="reader-page"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={mediaSrc(p.path)}
                alt={`Page ${i + 1}`}
                loading={i < 3 ? "eager" : "lazy"}
              />
            </div>
          ))
        )}
      </div>

      {/* Fin de chapitre */}
      <div className="mx-auto max-w-3xl border-t border-zinc-800 px-4 py-10">
        <p className="text-center text-xs font-semibold uppercase tracking-widest text-zinc-500">
          Fin du chapitre {chapterNumber}
          {chapterTitle ? ` — ${chapterTitle}` : ""}
        </p>

        {nextChapterId ? (
          <Link
            href={`/read/${nextChapterId}`}
            className="mt-4 block rounded-xl bg-emerald-500 py-4 text-center text-lg font-bold text-zinc-950 transition hover:bg-emerald-400"
          >
            Chapitre {nextChapterNumber} →
          </Link>
        ) : (
          <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-900 py-6 text-center">
            <p className="font-semibold text-zinc-200">
              Tu es à jour sur « {seriesTitle} »
            </p>
            <p className="mt-1 text-sm text-zinc-500">
              C'est le dernier chapitre publié.
            </p>
          </div>
        )}

        {/* Notation du chapitre */}
        <div className="mt-8 text-center">
          <p className="mb-2 text-sm font-medium text-zinc-300">
            Ce chapitre t'a plu ?
          </p>
          <RatingStars
            chapterId={chapterId}
            average={ratingAverage}
            count={ratingCount}
            userRating={userRating}
            loggedIn={loggedIn}
          />
        </div>

        {/* Liens rapides */}
        <div className="mt-8 flex items-center justify-between text-sm">
          {prevChapterId ? (
            <Link
              href={`/read/${prevChapterId}`}
              className="rounded-md border border-zinc-700 px-3 py-2 text-zinc-300 hover:border-zinc-500"
            >
              ← Chapitre {prevChapterNumber}
            </Link>
          ) : (
            <span />
          )}
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="rounded-md border border-zinc-700 px-3 py-2 text-zinc-300 hover:border-zinc-500"
          >
            ↑ Haut de page
          </button>
          <Link
            href={`/series/${seriesSlug}`}
            className="rounded-md border border-zinc-700 px-3 py-2 text-zinc-300 hover:border-zinc-500"
          >
            Liste des chapitres
          </Link>
        </div>
      </div>
    </div>
  );
}
