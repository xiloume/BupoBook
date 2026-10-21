import { prisma } from "@/lib/db";
import SeriesCard from "@/components/SeriesCard";

export const dynamic = "force-dynamic";

export const metadata = { title: "Séries" };

export default async function SeriesListPage() {
  const series = await prisma.series.findMany({
    orderBy: { title: "asc" },
    include: { _count: { select: { chapters: true } } },
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Toutes les séries</h1>
      {series.length === 0 ? (
        <p className="text-zinc-500">Aucune série publiée pour le moment.</p>
      ) : (
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
      )}
    </div>
  );
}
