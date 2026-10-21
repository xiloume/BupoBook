import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { mediaUrl } from "@/lib/media";
import { chapterLabel, formatDate } from "@/lib/utils";
import SeriesCard from "@/components/SeriesCard";

export const dynamic = "force-dynamic";

export const metadata = { title: "Ma bibliothèque" };

export default async function LibraryPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/library");

  const [favorites, history] = await Promise.all([
    prisma.favorite.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      include: { series: { include: { _count: { select: { chapters: true } } } } },
    }),
    prisma.readingProgress.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
      take: 30,
      include: { chapter: { include: { series: true } } },
    }),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Ma bibliothèque</h1>

      <section className="mb-10">
        <h2 className="mb-4 text-lg font-semibold text-zinc-300">Favoris</h2>
        {favorites.length === 0 ? (
          <p className="text-zinc-500">
            Aucun favori. Ajoute des séries depuis leur page pour les retrouver ici.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {favorites.map((f) => (
              <SeriesCard
                key={f.seriesId}
                slug={f.series.slug}
                title={f.series.title}
                coverPath={f.series.coverPath}
                status={f.series.status}
                chapterCount={f.series._count.chapters}
              />
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold text-zinc-300">Historique de lecture</h2>
        {history.length === 0 ? (
          <p className="text-zinc-500">Tu n'as encore rien lu.</p>
        ) : (
          <ul className="divide-y divide-zinc-800 rounded-lg border border-zinc-800">
            {history.map((p) => (
              <li key={p.chapterId}>
                <Link
                  href={`/read/${p.chapterId}`}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-zinc-900"
                >
                  <div className="h-14 w-10 shrink-0 overflow-hidden rounded bg-zinc-800">
                    {p.chapter.series.coverPath && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={mediaUrl(p.chapter.series.coverPath)!}
                        alt=""
                        loading="lazy"
                        className="h-full w-full object-cover"
                      />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{p.chapter.series.title}</p>
                    <p className="truncate text-xs text-zinc-400">
                      {chapterLabel(p.chapter.number, p.chapter.title)}
                    </p>
                  </div>
                  <div className="text-right text-xs">
                    {p.completed ? (
                      <span className="font-semibold text-emerald-400">✓ Terminé</span>
                    ) : (
                      <span className="text-zinc-400">page {p.pageIndex + 1}</span>
                    )}
                    <p className="mt-0.5 text-zinc-600">{formatDate(p.updatedAt)}</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
