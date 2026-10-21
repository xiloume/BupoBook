import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";

async function aggregate(chapterId: string) {
  const agg = await prisma.chapterRating.aggregate({
    where: { chapterId },
    _avg: { value: true },
    _count: { _all: true },
  });
  return { average: agg._avg.value ?? 0, count: agg._count._all };
}

// POST { chapterId, value: 1..5 } — crée ou met à jour la note du lecteur
export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non connecté" }, { status: 401 });

  const { chapterId, value } = await req.json();
  const v = Number(value);
  if (typeof chapterId !== "string" || !Number.isInteger(v) || v < 1 || v > 5) {
    return NextResponse.json({ error: "Note invalide (1 à 5)" }, { status: 400 });
  }

  const chapter = await prisma.chapter.findUnique({ where: { id: chapterId } });
  if (!chapter) return NextResponse.json({ error: "Chapitre introuvable" }, { status: 404 });

  await prisma.chapterRating.upsert({
    where: { userId_chapterId: { userId: session.sub, chapterId } },
    create: { userId: session.sub, chapterId, value: v },
    update: { value: v },
  });

  const { average, count } = await aggregate(chapterId);
  return NextResponse.json({ ok: true, userRating: v, average, count });
}

// DELETE { chapterId } — retire la note du lecteur
export async function DELETE(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non connecté" }, { status: 401 });

  const { chapterId } = await req.json();
  if (typeof chapterId !== "string") {
    return NextResponse.json({ error: "Données invalides" }, { status: 400 });
  }

  await prisma.chapterRating
    .delete({ where: { userId_chapterId: { userId: session.sub, chapterId } } })
    .catch(() => null);

  const { average, count } = await aggregate(chapterId);
  return NextResponse.json({ ok: true, userRating: null, average, count });
}
