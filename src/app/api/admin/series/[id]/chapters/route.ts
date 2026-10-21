import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireContentManager } from "@/lib/auth";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: Request, ctx: Ctx) {
  if (!(await requireContentManager())) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }
  const { id } = await ctx.params;
  const { number, title } = await req.json();

  const num = Number(number);
  if (!Number.isFinite(num) || num < 0) {
    return NextResponse.json({ error: "Numéro de chapitre invalide" }, { status: 400 });
  }

  const exists = await prisma.chapter.findUnique({
    where: { seriesId_number: { seriesId: id, number: num } },
  });
  if (exists) {
    return NextResponse.json({ error: `Le chapitre ${num} existe déjà` }, { status: 409 });
  }

  const chapter = await prisma.chapter.create({
    data: { seriesId: id, number: num, title: String(title ?? "").trim() || null },
  });
  await prisma.series.update({ where: { id }, data: { updatedAt: new Date() } });

  return NextResponse.json({ ok: true, id: chapter.id });
}
