import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireContentManager } from "@/lib/auth";
import { deleteMediaDir } from "@/lib/media";

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(req: Request, ctx: Ctx) {
  if (!(await requireContentManager())) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }
  const { id } = await ctx.params;
  const { number, title } = await req.json();

  const num = Number(number);
  if (!Number.isFinite(num) || num < 0) {
    return NextResponse.json({ error: "Numéro de chapitre invalide" }, { status: 400 });
  }

  try {
    await prisma.chapter.update({
      where: { id },
      data: { number: num, title: String(title ?? "").trim() || null },
    });
  } catch {
    return NextResponse.json({ error: "Numéro de chapitre déjà utilisé" }, { status: 409 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, ctx: Ctx) {
  if (!(await requireContentManager())) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }
  const { id } = await ctx.params;

  const chapter = await prisma.chapter.findUnique({ where: { id } });
  if (!chapter) return NextResponse.json({ error: "Chapitre introuvable" }, { status: 404 });

  await deleteMediaDir(`pages/${id}`);
  await prisma.chapter.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
