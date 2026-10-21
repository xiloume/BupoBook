import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import SeriesForm from "@/components/admin/SeriesForm";
import ChaptersPanel from "@/components/admin/ChaptersPanel";

export const dynamic = "force-dynamic";

export default async function EditSeriesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const series = await prisma.series.findUnique({
    where: { id },
    include: {
      chapters: {
        orderBy: { number: "desc" },
        include: { _count: { select: { pages: true } } },
      },
    },
  });
  if (!series) notFound();

  return (
    <div>
      <h2 className="mb-6 text-lg font-semibold">Éditer « {series.title} »</h2>
      <SeriesForm
        initial={{
          id: series.id,
          title: series.title,
          slug: series.slug,
          author: series.author,
          artist: series.artist,
          description: series.description,
          status: series.status,
          genres: series.genres,
          coverPath: series.coverPath,
        }}
      />

      <hr className="my-10 border-zinc-800" />

      <ChaptersPanel
        seriesId={series.id}
        chapters={series.chapters.map((c) => ({
          id: c.id,
          number: c.number,
          title: c.title,
          pageCount: c._count.pages,
        }))}
      />
    </div>
  );
}
