import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireContentManager } from "@/lib/auth";

type Ctx = { params: Promise<{ id: string }> };

// Réordonne les pages : body { pageIds: string[] } dans le nouvel ordre
export async function POST(req: Request, ctx: Ctx) {
  if (!(await requireContentManager())) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }
  const { id } = await ctx.params;
  const { pageIds } = await req.json();

  if (!Array.isArray(pageIds) || pageIds.some((p) => typeof p !== "string")) {
    return NextResponse.json({ error: "Données invalides" }, { status: 400 });
  }

  // Deux passes pour éviter les conflits sur @@unique([chapterId, index])
  await prisma.$transaction([
    ...pageIds.map((pid: string, i: number) =>
      prisma.page.update({
        where: { id: pid, chapterId: id },
        data: { index: i + 100000 },
      })
    ),
    ...pageIds.map((pid: string, i: number) =>
      prisma.page.update({
        where: { id: pid, chapterId: id },
        data: { index: i },
      })
    ),
  ]);

  return NextResponse.json({ ok: true });
}
