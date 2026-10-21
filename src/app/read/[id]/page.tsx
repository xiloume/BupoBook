import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import ReaderClient from "@/components/ReaderClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Lecture" };

export default async function ReadPage({
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

  const [prev, next, user] = await Promise.all([
    prisma.chapter.findFirst({
      where: { seriesId: chapter.seriesId, number: { lt: chapter.number } },
      orderBy: { number: "desc" },
    }),
    prisma.chapter.findFirst({
      where: { seriesId: chapter.seriesId, number: { gt: chapter.number } },
      orderBy: { number: "asc" },
    }),
    getCurrentUser(),
  ]);

  const [progress, ratingAgg, userRating] = await Promise.all([
    user
      ? prisma.readingProgress.findUnique({
          where: { userId_chapterId: { userId: user.id, chapterId: chapter.id } },
        })
      : null,
    prisma.chapterRating.aggregate({
      where: { chapterId: chapter.id },
      _avg: { value: true },
      _count: { _all: true },
    }),
    user
      ? prisma.chapterRating.findUnique({
          where: { userId_chapterId: { userId: user.id, chapterId: chapter.id } },
        })
      : null,
  ]);

  return (
    <ReaderClient
      chapterId={chapter.id}
      seriesSlug={chapter.series.slug}
      seriesTitle={chapter.series.title}
      chapterNumber={chapter.number}
      chapterTitle={chapter.title}
      pages={chapter.pages.map((p) => ({ index: p.index, path: p.path }))}
      prevChapterId={prev?.id ?? null}
      prevChapterNumber={prev?.number ?? null}
      nextChapterId={next?.id ?? null}
      nextChapterNumber={next?.number ?? null}
      initialPage={progress && !progress.completed ? progress.pageIndex : 0}
      loggedIn={!!user}
      ratingAverage={ratingAgg._avg.value ?? 0}
      ratingCount={ratingAgg._count._all}
      userRating={userRating?.value ?? null}
    />
  );
}
