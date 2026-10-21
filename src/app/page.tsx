import Link from "next/link";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { mediaUrl } from "@/lib/media";
import { chapterLabel } from "@/lib/utils";
import SeriesCard from "@/components/SeriesCard";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const user = await getCurrentUser();

  const [series, latestChapters, continueReading] = await Promise.all([
    prisma.series.findMany({
      orderBy: { updatedAt: "desc" },
      take: 18,
      include: { _count: { select: { chapters: true } } },
    }),
    prisma.chapter.findMany({
      orderBy: { publishedAt: "desc" },
      take: 12,
      include: { series: true },
    }),
    user
      ? prisma.readingProgress.findMany({
          where: { userId: user.id, completed: false },
          orderBy: { updatedAt: "desc" },
          take: 6,
          include: { chapter: { include: { series: true } } },
        })
      : Promise.resolve([]),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <section className="mb-10 rounded-xl border border-zinc-800 bg-gradient-to-br from-emerald-950/60 to-zinc-900 p-8">
        <h1 className="text-3xl font-extrabold tracking-tight">
          Bienvenue sur <span className="text-emerald-400">BupoBook</span>
        </h1>
        <p className="mt-2 max-w-xl text-zinc-400">
          Lis tes webtoons et mangas en défilement vertical, reprends là où tu t'étais arrêté.
        </p>
      </section>

      {continueReading.length > 0 && (
        <section className="mb-10">
          <h2 className="mb-4 text-xl font-bold">Reprendre la lecture</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {continueReading.map((p) => (
              <Link
                key={p.chapterId}
                href={`/read/${p.chapterId}`}
                className="group overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900 hover:border-zinc-600"
              >
                <div className="aspect-[3/4] w-full overflow-hidden bg-zinc-800">
                  {p.chapter.series.coverPath ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={mediaUrl(p.chapter.series.coverPath)!}
                      alt={p.chapter.series.title}
                      loading="lazy"
                      className="h-full w-full object-cover group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center p-3 text-center text-sm font-bold text-zinc-400">
                      {p.chapter.series.title}
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <p className="truncate text-sm font-semibold">{p.chapter.series.title}</p>
                  <p className="text-xs text-emerald-400">
                    {chapterLabel(p.chapter.number)} · page {p.pageIndex + 1}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="mb-10">
        <h2 className="mb-4 text-xl font-bold">Derniers chapitres</h2>
        {latestChapters.length === 0 ? (
          <p className="text-zinc-500">Aucun chapitre publié pour le moment.</p>
        ) : (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {latestChapters.map((ch) => (
              <Link
                key={ch.id}
                href={`/read/${ch.id}`}
                className="flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-900 p-3 hover:border-zinc-600"
              >
                <div className="h-14 w-10 shrink-0 overflow-hidden rounded bg-zinc-800">
                  {ch.series.coverPath && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={mediaUrl(ch.series.coverPath)!}
                      alt=""
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{ch.series.title}</p>
                  <p className="truncate text-xs text-zinc-400">
                    {chapterLabel(ch.number, ch.title)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">Toutes les séries</h2>
          <Link href="/series" className="text-sm text-emerald-400 hover:text-emerald-300">
            Tout voir →
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {series.map((s) => (
            <SeriesCard
              key={s.id}
              slug={s.slug}
              title={s.title}
              coverPath={s.coverPath}
              status={s.status}
              chapterCount={s._count.chapters}
            />
          ))}
        </div>
        {series.length === 0 && (
          <p className="text-zinc-500">Aucune série pour le moment.</p>
        )}
      </section>
    </div>
  );
}
