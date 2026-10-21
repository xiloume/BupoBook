import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireContentManager } from "@/lib/auth";
import { deleteMedia } from "@/lib/media";

type Ctx = { params: Promise<{ id: string }> };

export async function DELETE(_req: Request, ctx: Ctx) {
  if (!(await requireContentManager())) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }
  const { id } = await ctx.params;

  const page = await prisma.page.findUnique({ where: { id } });
  if (!page) return NextResponse.json({ error: "Page introuvable" }, { status: 404 });

  await deleteMedia(page.path);
  await prisma.page.delete({ where: { id } });

  // Réindexe pour garder des indices contigus
  const remaining = await prisma.page.findMany({
    where: { chapterId: page.chapterId },
    orderBy: { index: "asc" },
  });
  await prisma.$transaction(
    remaining.map((p, i) =>
      prisma.page.update({ where: { id: p.id }, data: { index: i } })
    )
  );

  return NextResponse.json({ ok: true });
}
