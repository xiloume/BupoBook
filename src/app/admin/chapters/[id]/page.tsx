import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import ChapterMetaForm from "@/components/admin/ChapterMetaForm";
import PagesManager from "@/components/admin/PagesManager";

export const dynamic = "force-dynamic";

export default async function AdminChapterPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const chapter = await prisma.chapter.findUnique({
    where: { id },
    include: {
      series: true,
      pages: { orderBy: { index: "asc" } },
    },
  });
  if (!chapter) notFound();

  return (
    <div>
      <p className="mb-2 text-sm text-zinc-500">
        <Link href={`/admin/series/${chapter.seriesId}`} className="hover:text-white">
          ← {chapter.series.title}
        </Link>
      </p>
      <h2 className="mb-6 text-lg font-semibold">
        Chapitre {chapter.number}
        {chapter.title && <span className="text-zinc-400"> — {chapter.title}</span>}
      </h2>

      <ChapterMetaForm
        chapterId={chapter.id}
        number={chapter.number}
        title={chapter.title}
      />

      <hr className="my-10 border-zinc-800" />

      <PagesManager
        chapterId={chapter.id}
        pages={chapter.pages.map((p) => ({ id: p.id, index: p.index, path: p.path }))}
      />
    </div>
  );
}
