import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non connecté" }, { status: 401 });

  const { chapterId, pageIndex, completed } = await req.json();
  if (typeof chapterId !== "string" || typeof pageIndex !== "number") {
    return NextResponse.json({ error: "Données invalides" }, { status: 400 });
  }

  const chapter = await prisma.chapter.findUnique({ where: { id: chapterId } });
  if (!chapter) return NextResponse.json({ error: "Chapitre introuvable" }, { status: 404 });

  await prisma.readingProgress.upsert({
    where: { userId_chapterId: { userId: session.sub, chapterId } },
    create: {
      userId: session.sub,
      chapterId,
      pageIndex,
      completed: completed === true,
    },
    update: {
      pageIndex,
      ...(completed === true ? { completed: true } : {}),
    },
  });

  return NextResponse.json({ ok: true });
}
