import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { mediaUrl } from "@/lib/media";
import { chapterLabel, formatDate, statusLabel } from "@/lib/utils";
import FavoriteButton from "@/components/FavoriteButton";

export const dynamic = "force-dynamic";

export default async function SeriesPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const series = await prisma.series.findUnique({
    where: { slug },
    include: {
      chapters: {
        orderBy: { number: "desc" },
        include: { _count: { select: { pages: true } } },
      },
    },
  });
  if (!series) notFound();

  const user = await getCurrentUser();
  const [favorited, progress, ratingAgg, seriesRating] = await Promise.all([
    user
      ? prisma.favorite.findUnique({
          where: { userId_seriesId: { userId: user.id, seriesId: series.id } },
        })
      : null,
    user
      ? prisma.readingProgress.findMany({
          where: { userId: user.id, chapter: { seriesId: series.id } },
        })
      : Promise.resolve([]),
    prisma.chapterRating.groupBy({
      by: ["chapterId"],
      where: { chapter: { seriesId: series.id } },
      _avg: { value: true },
      _count: { _all: true },
    }),
    prisma.chapterRating.aggregate({
      where: { chapter: { seriesId: series.id } },
      _avg: { value: true },
      _count: { _all: true },
    }),
  ]);

  const readMap = new Map(progress.map((p) => [p.chapterId, p]));
  const ratingMap = new Map(
    ratingAgg.map((r) => [r.chapterId, { avg: r._avg.value ?? 0, n: r._count._all }])
  );
  const firstChapter = [...series.chapters].sort((a, b) => a.number - b.number)[0];
  const genres = series.genres.split(",").map((g) => g.trim()).filter(Boolean);
  const cover = mediaUrl(series.coverPath);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="flex flex-col gap-6 sm:flex-row">
        <div className="aspect-[3/4] w-full max-w-[220px] shrink-0 overflow-hidden rounded-lg border border-zinc-800 bg-zinc-800">
          {cover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={cover} alt={series.title} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center bg-gradient-to-br from-emerald-900 to-zinc-900 p-4 text-center text-xl font-bold text-zinc-300">
              {series.title}
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-3xl font-extrabold tracking-tight">{series.title}</h1>
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            <span className="rounded-full bg-emerald-500/15 px-2.5 py-1 font-medium text-emerald-400">
              {statusLabel(series.status)}
            </span>
            {seriesRating._count._all > 0 && (
              <span className="rounded-full bg-amber-500/15 px-2.5 py-1 font-medium text-amber-400">
                ★ {(seriesRating._avg.value ?? 0).toFixed(1)} · {seriesRating._count._all} vote
                {seriesRating._count._all > 1 ? "s" : ""}
              </span>
            )}
            {genres.map((g) => (
              <span key={g} className="rounded-full bg-zinc-800 px-2.5 py-1 text-zinc-300">
                {g}
              </span>
            ))}
          </div>
          <dl className="mt-4 space-y-1 text-sm text-zinc-400">
            {series.author && <div>Auteur : <span className="text-zinc-200">{series.author}</span></div>}
            {series.artist && <div>Artiste : <span className="text-zinc-200">{series.artist}</span></div>}
            <div>{series.chapters.length} chapitre{series.chapters.length > 1 ? "s" : ""}</div>
          </dl>
          {series.description && (
            <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-zinc-300">
              {series.description}
            </p>
          )}
          <div className="mt-6 flex flex-wrap gap-3">
            {firstChapter && (
              <Link
                href={`/read/${firstChapter.id}`}
                className="rounded-md bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-zinc-950 hover:bg-emerald-400"
              >
                Commencer la lecture
              </Link>
            )}
            <FavoriteButton
              seriesId={series.id}
              initialFavorited={!!favorited}
              loggedIn={!!user}
            />
          </div>
        </div>
      </div>

      <h2 className="mb-4 mt-10 text-xl font-bold">Chapitres</h2>
      {series.chapters.length === 0 ? (
        <p className="text-zinc-500">Aucun chapitre publié.</p>
      ) : (
        <ul className="divide-y divide-zinc-800 rounded-lg border border-zinc-800">
          {series.chapters.map((ch) => {
            const p = readMap.get(ch.id);
            const r = ratingMap.get(ch.id);
            return (
              <li key={ch.id}>
                <Link
                  href={`/read/${ch.id}`}
                  className="flex items-center justify-between px-4 py-3 hover:bg-zinc-900"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {chapterLabel(ch.number, ch.title)}
                      {p?.completed && (
                        <span className="ml-2 text-xs font-semibold text-emerald-400">✓ lu</span>
                      )}
                      {p && !p.completed && (
                        <span className="ml-2 text-xs text-zinc-500">page {p.pageIndex + 1}</span>
                      )}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {formatDate(ch.publishedAt)} · {ch._count.pages} page{ch._count.pages > 1 ? "s" : ""}
                      {r && r.n > 0 && (
                        <span className="ml-2 text-amber-400">
                          ★ {r.avg.toFixed(1)} ({r.n})
                        </span>
                      )}
                    </p>
                  </div>
                  <span className="text-zinc-500">→</span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
